import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const ADMIN_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/postgres";
const MIGRATIONS_DIR = join(import.meta.dirname, "..", "supabase", "migrations");
const SHIM = join(import.meta.dirname, "supabase-shim.sql");

export type Db = {
  /** Superuser client on the throwaway database. */
  admin: pg.Client;
  /** Run `fn` inside a transaction as `role`, with `sub` as the JWT subject. Always rolled back. */
  as: <T>(who: Who, fn: (c: pg.Client) => Promise<T>) => Promise<T>;
  createUser: (meta?: Record<string, unknown>) => Promise<string>;
  close: () => Promise<void>;
};

export type Who = { role: "anon" } | { role: "authenticated"; sub: string } | { role: "service_role" };

function withDatabase(url: string, database: string): string {
  const u = new URL(url);
  u.pathname = `/${database}`;
  return u.toString();
}

export async function setupDatabase(): Promise<Db> {
  const name = `honeymoney_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const root = new pg.Client({ connectionString: ADMIN_URL });
  await root.connect();
  await root.query(`create database ${name}`);
  await root.end();

  const admin = new pg.Client({ connectionString: withDatabase(ADMIN_URL, name) });
  await admin.connect();
  await admin.query(readFileSync(SHIM, "utf8"));
  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of migrations) {
    await admin.query(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }

  const as: Db["as"] = async (who, fn) => {
    await admin.query("begin");
    try {
      const claims = who.role === "authenticated" ? { sub: who.sub, role: who.role } : { role: who.role };
      await admin.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
      await admin.query(`set local role ${who.role}`);
      return await fn(admin);
    } finally {
      await admin.query("rollback");
    }
  };

  const createUser: Db["createUser"] = async (meta = { age_confirmed: "true" }) => {
    const { rows } = await admin.query<{ id: string }>(
      "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
      [`u${Math.random().toString(36).slice(2)}@example.com`, JSON.stringify(meta)],
    );
    return rows[0]!.id;
  };

  const close = async () => {
    await admin.end();
    const cleanup = new pg.Client({ connectionString: ADMIN_URL });
    await cleanup.connect();
    await cleanup.query(`drop database if exists ${name} with (force)`);
    await cleanup.end();
  };

  return { admin, as, createUser, close };
}

/** Expect a query to fail with a permission/RLS error. Uses a savepoint so the transaction survives. */
export async function expectDenied(c: pg.Client, sql: string, params: unknown[] = []): Promise<string> {
  await c.query("savepoint deny_check");
  try {
    await c.query(sql, params);
  } catch (err) {
    await c.query("rollback to savepoint deny_check");
    return (err as Error).message;
  }
  await c.query("release savepoint deny_check");
  throw new Error(`Expected query to be denied: ${sql}`);
}
