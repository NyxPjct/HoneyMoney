import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Db, expectDenied, setupDatabase } from "./harness";

let db: Db;
let alice: string;
let bob: string;
let admin: string;
let aliceProject: string;
let bobProject: string;
let aliceRun: string;
let alicePage: string;

beforeAll(async () => {
  db = await setupDatabase();
  alice = await db.createUser({ age_confirmed: "true", name: "Alice", locale: "en" });
  bob = await db.createUser({ age_confirmed: "true", name: "Bob" });
  admin = await db.createUser();
  await db.admin.query("update public.profiles set role = 'admin' where id = $1", [admin]);

  const p1 = await db.admin.query<{ id: string }>(
    "insert into public.projects (user_id, name, briefing) values ($1, 'Alice offer', '{}') returning id",
    [alice],
  );
  aliceProject = p1.rows[0]!.id;
  const p2 = await db.admin.query<{ id: string }>(
    "insert into public.projects (user_id, name, briefing) values ($1, 'Bob offer', '{}') returning id",
    [bob],
  );
  bobProject = p2.rows[0]!.id;

  const r = await db.admin.query<{ id: string }>(
    `insert into public.agent_runs (project_id, user_id, agent, status, prompt_version, output)
     values ($1, $2, 'researcher', 'succeeded', 'researcher@1', '{"niche":"x"}') returning id`,
    [aliceProject, alice],
  );
  aliceRun = r.rows[0]!.id;

  await db.admin.query(
    `insert into public.offer_versions (project_id, user_id, version, promise, structure, copy)
     values ($1, $2, 1, 'promise', '{}', '{}')`,
    [aliceProject, alice],
  );

  const pg = await db.admin.query<{ id: string }>(
    `insert into public.pages (project_id, user_id, slug, blocks, approved_at)
     values ($1, $2, 'alice-offer', '[{"type":"hero"}]', now()) returning id`,
    [aliceProject, alice],
  );
  alicePage = pg.rows[0]!.id;
});

afterAll(async () => {
  await db?.close();
});

describe("schema guarantees", () => {
  it("has RLS enabled on every table in public", async () => {
    const { rows } = await db.admin.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(8);
    for (const row of rows) {
      expect(row.relrowsecurity, `RLS disabled on ${row.relname}`).toBe(true);
    }
  });

  it("has at least one policy on every table in public", async () => {
    const { rows } = await db.admin.query<{ relname: string; policies: string }>(
      `select c.relname, count(p.polname)::text as policies from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       left join pg_policy p on p.polrelid = c.oid
       where n.nspname = 'public' and c.relkind = 'r'
       group by c.relname`,
    );
    for (const row of rows) {
      expect(Number(row.policies), `no policy on ${row.relname}`).toBeGreaterThan(0);
    }
  });

  it("creates a profile with age confirmation and locale from sign-up metadata", async () => {
    const { rows } = await db.admin.query(
      "select display_name, locale, role, age_confirmed_at is not null as confirmed from public.profiles where id = $1",
      [alice],
    );
    expect(rows[0]).toEqual({ display_name: "Alice", locale: "en", role: "user", confirmed: true });

    const unconfirmed = await db.createUser({});
    const r2 = await db.admin.query("select age_confirmed_at from public.profiles where id = $1", [unconfirmed]);
    expect(r2.rows[0].age_confirmed_at).toBeNull();
  });
});

describe("profiles", () => {
  it("a user reads only their own profile", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const { rows } = await c.query("select id from public.profiles");
      expect(rows.map((r) => r.id)).toEqual([alice]);
    });
  });

  it("anon reads nothing", async () => {
    await db.as({ role: "anon" }, async (c) => {
      await expectDenied(c, "select id from public.profiles");
    });
  });

  it("a user can update their name but not their role", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const ok = await c.query("update public.profiles set display_name = 'Ali' where id = $1", [alice]);
      expect(ok.rowCount).toBe(1);
      await expectDenied(c, "update public.profiles set role = 'admin' where id = $1", [alice]);
    });
  });

  it("a user cannot update someone else's profile", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const res = await c.query("update public.profiles set display_name = 'hacked' where id = $1", [bob]);
      expect(res.rowCount).toBe(0);
    });
  });
});

describe("ai_keys", () => {
  it("users cannot insert keys directly or call the key functions", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      await expectDenied(
        c,
        "insert into public.ai_keys (user_id, provider, secret_id, last4) values ($1, 'openai', gen_random_uuid(), 'abcd')",
        [alice],
      );
      await expectDenied(c, "select public.upsert_ai_key($1, 'openai', 'sk-test-1234567890')", [alice]);
      await expectDenied(c, "select public.get_ai_key($1, 'openai')", [alice]);
    });
  });

  it("the service role stores a key in Vault and reads it back", async () => {
    await db.as({ role: "service_role" }, async (c) => {
      const { rows } = await c.query("select * from public.upsert_ai_key($1, 'openai', 'sk-test-ALICE-9876')", [
        alice,
      ]);
      expect(rows[0].last4).toBe("9876");
      const got = await c.query("select public.get_ai_key($1, 'openai') as key", [alice]);
      expect(got.rows[0].key).toBe("sk-test-ALICE-9876");
    });
  });

  it("owners see provider and last 4 digits, never the Vault pointer; others see nothing", async () => {
    await db.admin.query("select public.upsert_ai_key($1, 'anthropic', 'sk-ant-secret-abcd')", [alice]);

    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const { rows } = await c.query("select provider, last4 from public.ai_keys");
      expect(rows).toEqual([{ provider: "anthropic", last4: "abcd" }]);
      await expectDenied(c, "select secret_id from public.ai_keys");
      await expectDenied(c, "select * from vault.decrypted_secrets");
      await expectDenied(c, "update public.ai_keys set last4 = 'zzzz'");
    });

    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const { rows } = await c.query("select provider from public.ai_keys");
      expect(rows).toEqual([]);
    });

    await db.as({ role: "anon" }, async (c) => {
      await expectDenied(c, "select provider from public.ai_keys");
    });
  });

  it("replacing a key removes the old Vault secret", async () => {
    await db.admin.query("select public.upsert_ai_key($1, 'google', 'AIza-first-key-1111')", [bob]);
    await db.admin.query("select public.upsert_ai_key($1, 'google', 'AIza-second-key-2222')", [bob]);
    const { rows } = await db.admin.query(
      "select count(*)::int as n from vault.secrets where secret like 'AIza-%-key-%'",
    );
    expect(rows[0].n).toBe(1);
  });

  it("deleting a key (by its owner) deletes the Vault secret too", async () => {
    await db.admin.query("select public.upsert_ai_key($1, 'openai', 'sk-delete-me-0000')", [bob]);
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const del = await c.query("delete from public.ai_keys where provider = 'openai'");
      expect(del.rowCount).toBe(1);
      const left = await c.query("select count(*)::int as n from public.ai_keys where provider = 'openai'");
      expect(left.rows[0].n).toBe(0);
    });
    // The `as` helper rolled back; delete for real and check Vault.
    await db.admin.query("delete from public.ai_keys where user_id = $1 and provider = 'openai'", [bob]);
    const { rows } = await db.admin.query("select count(*)::int as n from vault.secrets where secret = 'sk-delete-me-0000'");
    expect(rows[0].n).toBe(0);
  });

  it("a user cannot delete someone else's key", async () => {
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const res = await c.query("delete from public.ai_keys where user_id = $1", [alice]);
      expect(res.rowCount).toBe(0);
    });
  });
});

describe("projects", () => {
  it("a user creates projects only for themselves", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const ok = await c.query("insert into public.projects (name, briefing) values ('New', '{}') returning user_id, status");
      expect(ok.rows[0]).toEqual({ user_id: alice, status: "draft" });
      await expectDenied(c, "insert into public.projects (user_id, name) values ($1, 'Spoof')", [bob]);
    });
  });

  it("a user cannot set the status directly (only the server can)", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      await expectDenied(c, "insert into public.projects (name, status) values ('x', 'published')");
      await expectDenied(c, "update public.projects set status = 'published' where id = $1", [aliceProject]);
    });
  });

  it("isolates projects between users", async () => {
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const { rows } = await c.query("select id from public.projects");
      expect(rows.map((r) => r.id)).toEqual([bobProject]);
      const upd = await c.query("update public.projects set name = 'pwned' where id = $1", [aliceProject]);
      expect(upd.rowCount).toBe(0);
      const del = await c.query("delete from public.projects where id = $1", [aliceProject]);
      expect(del.rowCount).toBe(0);
    });
    await db.as({ role: "anon" }, async (c) => {
      await expectDenied(c, "select id from public.projects");
    });
  });

  it("enforces a maximum briefing size", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const huge = JSON.stringify({ extra: "x".repeat(40_000) });
      const msg = await expectDenied(c, "insert into public.projects (name, briefing) values ('big', $1::jsonb)", [huge]);
      expect(msg).toMatch(/check constraint/);
    });
  });
});

describe("agent_runs and offer_versions", () => {
  it("owners read their runs; others do not", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const { rows } = await c.query("select id from public.agent_runs");
      expect(rows.map((r) => r.id)).toEqual([aliceRun]);
    });
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const { rows } = await c.query("select id from public.agent_runs");
      expect(rows).toEqual([]);
    });
  });

  it("owners can edit a deliverable but not the raw output, status or tokens", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const ok = await c.query("update public.agent_runs set edited_output = '{\"niche\":\"y\"}' where id = $1", [aliceRun]);
      expect(ok.rowCount).toBe(1);
      await expectDenied(c, "update public.agent_runs set output = '{}' where id = $1", [aliceRun]);
      await expectDenied(c, "update public.agent_runs set status = 'failed' where id = $1", [aliceRun]);
      await expectDenied(
        c,
        "insert into public.agent_runs (project_id, user_id, agent, prompt_version) values ($1, $2, 'sentinel', 'x')",
        [aliceProject, alice],
      );
    });
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const res = await c.query("update public.agent_runs set edited_output = '{}' where id = $1", [aliceRun]);
      expect(res.rowCount).toBe(0);
    });
  });

  it("offer versions are read-only history for their owner", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const { rows } = await c.query("select version from public.offer_versions");
      expect(rows).toEqual([{ version: 1 }]);
      await expectDenied(c, "update public.offer_versions set promise = 'x'");
      await expectDenied(
        c,
        "insert into public.offer_versions (project_id, user_id, version, promise, structure, copy) values ($1, $2, 2, 'p', '{}', '{}')",
        [aliceProject, alice],
      );
    });
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const { rows } = await c.query("select version from public.offer_versions");
      expect(rows).toEqual([]);
    });
  });
});

describe("pages", () => {
  it("editing the draft clears the Sentinel approval", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      await c.query("update public.pages set blocks = '[{\"type\":\"cta\"}]' where id = $1", [alicePage]);
      const { rows } = await c.query("select approved_at from public.pages where id = $1", [alicePage]);
      expect(rows[0].approved_at).toBeNull();
    });
  });

  it("owners cannot approve, publish or change the slug themselves", async () => {
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      await expectDenied(c, "update public.pages set approved_at = now() where id = $1", [alicePage]);
      await expectDenied(c, "update public.pages set published_blocks = blocks, published_at = now() where id = $1", [
        alicePage,
      ]);
      await expectDenied(c, "update public.pages set slug = 'other' where id = $1", [alicePage]);
    });
  });

  it("other users and visitors cannot read page drafts", async () => {
    await db.as({ role: "authenticated", sub: bob }, async (c) => {
      const { rows } = await c.query("select id from public.pages");
      expect(rows).toEqual([]);
    });
    await db.as({ role: "anon" }, async (c) => {
      await expectDenied(c, "select id from public.pages");
    });
  });

  it("visitors only get published pages, and only the published snapshot", async () => {
    await db.as({ role: "anon" }, async (c) => {
      const { rows } = await c.query("select * from public.get_published_page('alice-offer')");
      expect(rows).toEqual([]);
    });

    await db.admin.query(
      "update public.pages set published_blocks = '[{\"type\":\"hero\",\"v\":1}]', published_at = now() where id = $1",
      [alicePage],
    );
    await db.admin.query("update public.projects set status = 'published' where id = $1", [aliceProject]);
    // A later draft edit must not leak to visitors.
    await db.admin.query("update public.pages set blocks = '[{\"type\":\"draft\"}]' where id = $1", [alicePage]);

    await db.as({ role: "anon" }, async (c) => {
      const { rows } = await c.query("select slug, title, blocks from public.get_published_page('alice-offer')");
      expect(rows).toEqual([{ slug: "alice-offer", title: "Alice offer", blocks: [{ type: "hero", v: 1 }] }]);
    });
  });

  it("unpublishing takes the page offline", async () => {
    await db.admin.query("update public.pages set published_at = null, published_blocks = null where id = $1", [alicePage]);
    await db.as({ role: "anon" }, async (c) => {
      const { rows } = await c.query("select * from public.get_published_page('alice-offer')");
      expect(rows).toEqual([]);
    });
  });
});

describe("catalog", () => {
  it("visitors read only published catalog offers", async () => {
    await db.admin.query(
      `insert into public.catalog_offers (name, format, niche, language, is_published) values
       ('Published', 'ebook', 'finance', 'pt-BR', true), ('Hidden', 'ebook', 'finance', 'pt-BR', false)`,
    );
    await db.as({ role: "anon" }, async (c) => {
      const { rows } = await c.query("select name from public.catalog_offers order by name");
      expect(rows.map((r) => r.name)).toEqual(["Published"]);
    });
    await db.as({ role: "authenticated", sub: admin }, async (c) => {
      const { rows } = await c.query("select name from public.catalog_offers order by name");
      expect(rows.map((r) => r.name)).toEqual(["Hidden", "Published"]);
    });
  });

  it("only admins write to the catalog", async () => {
    const insert = "insert into public.catalog_offers (name, format, niche, language) values ('X', 'course', 'n', 'en')";
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      const msg = await expectDenied(c, insert);
      expect(msg).toMatch(/row-level security/);
    });
    await db.as({ role: "anon" }, async (c) => {
      await expectDenied(c, insert);
    });
    await db.as({ role: "authenticated", sub: admin }, async (c) => {
      const res = await c.query(insert);
      expect(res.rowCount).toBe(1);
    });
  });

  it("numbers without a collection date are rejected", async () => {
    const msg = await db.admin
      .query("insert into public.catalog_offers (name, format, niche, language, price_cents) values ('X', 'e', 'n', 'en', 1700)")
      .then(
        () => "",
        (e: Error) => e.message,
      );
    expect(msg).toMatch(/catalog_price_dated/);
  });

  it("catalog sources follow the visibility of their offer and need an https source", async () => {
    const { rows } = await db.admin.query<{ id: string; name: string }>("select id, name from public.catalog_offers");
    const published = rows.find((r) => r.name === "Published")!.id;
    const hidden = rows.find((r) => r.name === "Hidden")!.id;
    await db.admin.query(
      `insert into public.catalog_sources (catalog_offer_id, field, value, source_url, collected_at) values
       ($1, 'price', 'R$ 17,00', 'https://example.com/a', '2026-11-09'),
       ($2, 'price', 'R$ 27,00', 'https://example.com/b', '2026-11-09')`,
      [published, hidden],
    );
    await db.as({ role: "anon" }, async (c) => {
      const { rows: visible } = await c.query("select value from public.catalog_sources");
      expect(visible.map((r) => r.value)).toEqual(["R$ 17,00"]);
    });
    await db.as({ role: "authenticated", sub: alice }, async (c) => {
      await expectDenied(
        c,
        "insert into public.catalog_sources (catalog_offer_id, field, value, source_url, collected_at) values ($1, 'f', 'v', 'https://x.y', now())",
        [published],
      );
    });
    const bad = await db.admin
      .query(
        "insert into public.catalog_sources (catalog_offer_id, field, value, source_url, collected_at) values ($1, 'f', 'v', 'http://insecure', now())",
        [published],
      )
      .then(
        () => "",
        (e: Error) => e.message,
      );
    expect(bad).toMatch(/check constraint/);
  });
});

describe("account deletion", () => {
  it("deleting the auth user cascades to every row and Vault secret", async () => {
    const carol = await db.createUser();
    await db.admin.query("select public.upsert_ai_key($1, 'openai', 'sk-carol-secret-7777')", [carol]);
    const p = await db.admin.query<{ id: string }>(
      "insert into public.projects (user_id, name) values ($1, 'Carol') returning id",
      [carol],
    );
    await db.admin.query(
      "insert into public.agent_runs (project_id, user_id, agent, prompt_version) values ($1, $2, 'manager', 'm@1')",
      [p.rows[0]!.id, carol],
    );

    await db.admin.query("delete from auth.users where id = $1", [carol]);

    const counts = await db.admin.query(
      `select
        (select count(*)::int from public.profiles where id = $1) as profiles,
        (select count(*)::int from public.projects where user_id = $1) as projects,
        (select count(*)::int from public.agent_runs where user_id = $1) as runs,
        (select count(*)::int from public.ai_keys where user_id = $1) as keys,
        (select count(*)::int from vault.secrets where secret = 'sk-carol-secret-7777') as secrets`,
      [carol],
    );
    expect(counts.rows[0]).toEqual({ profiles: 0, projects: 0, runs: 0, keys: 0, secrets: 0 });
  });
});
