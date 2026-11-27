import { beforeEach, describe, expect, it, vi } from "vitest";

const deleted: string[] = [];
let passwordOk = true;
const signIn = vi.fn(async ({ password }: { email: string; password: string }) =>
  passwordOk && password === "senha-certa"
    ? { data: { user: { id: USER.id } }, error: null }
    : { data: { user: null }, error: { message: "Invalid login credentials" } },
);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({ auth: { admin: { deleteUser: async (id: string) => (deleted.push(id), { error: null }) } } }),
  createSupabaseServerClient: vi.fn(),
  createSupabaseAnonClient: () => ({ auth: { signInWithPassword: signIn } }),
}));

const { appRouter } = await import("@/server/root");
const { createCallerFactory } = await import("@/server/trpc");
const createCaller = createCallerFactory(appRouter);

const USER = { id: "11111111-1111-4111-8111-111111111111", email: "a@example.com" };
const session = { auth: { signOut: vi.fn(async () => ({ error: null })) } };
const caller = (identities: { provider: string }[]) =>
  createCaller({ supabase: session as never, user: { ...USER, identities } as never });

beforeEach(() => {
  deleted.length = 0;
  passwordOk = true;
  signIn.mockClear();
});

describe("account deletion", () => {
  it("asks e-mail/password accounts for their password again", async () => {
    const c = caller([{ provider: "email" }]);
    await expect(c.account.delete({ confirm: "EXCLUIR" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(c.account.delete({ confirm: "EXCLUIR", password: "errada" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(deleted).toEqual([]);
    await expect(c.account.delete({ confirm: "EXCLUIR", password: "senha-certa" })).resolves.toEqual({ ok: true });
    expect(signIn).toHaveBeenLastCalledWith({ email: USER.email, password: "senha-certa" });
    expect(deleted).toEqual([USER.id]);
  });

  it("does not ask a password from accounts that only sign in with Google", async () => {
    await expect(caller([{ provider: "google" }]).account.delete({ confirm: "EXCLUIR" })).resolves.toEqual({ ok: true });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("still requires the typed confirmation", async () => {
    await expect(caller([]).account.delete({ confirm: "excluir" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(deleted).toEqual([]);
  });
});
