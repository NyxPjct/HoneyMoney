/** Minimal chainable stand-in for supabase-js, enough to drive the tRPC routers in tests. */
export type FakeQuery = {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  payload: unknown;
  filters: unknown[][];
  head: boolean;
  single: boolean;
};
export type FakeResult = { data?: unknown; error?: { message: string; code?: string } | null; count?: number };

export function fakeSupabase(handler: (q: FakeQuery) => FakeResult) {
  const queries: FakeQuery[] = [];
  const client = {
    queries,
    from(table: string) {
      const q: FakeQuery = { table, op: "select", payload: null, filters: [], head: false, single: false };
      queries.push(q);
      const builder: Record<string, unknown> = new Proxy(
        {},
        {
          get(_target, prop: string) {
            if (prop === "then") {
              return (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
                Promise.resolve()
                  .then(() => handler(q))
                  .then((r) => ({ data: r.data ?? null, error: r.error ?? null, count: r.count ?? null }))
                  .then(resolve, reject);
            }
            return (...args: unknown[]) => {
              if (prop === "insert" || prop === "update" || prop === "delete") {
                q.op = prop;
                q.payload = args[0];
              } else if (prop === "select") {
                const opts = args[1] as { head?: boolean } | undefined;
                if (opts?.head) q.head = true;
              } else if (prop === "single" || prop === "maybeSingle") {
                q.single = true;
              } else if (["eq", "neq", "gte", "in", "not"].includes(prop)) {
                q.filters.push([prop, ...args]);
              }
              return builder;
            };
          },
        },
      );
      return builder;
    },
    rpc: async () => ({ data: null, error: null }),
    auth: { signOut: async () => ({ error: null }) },
  };
  return client;
}
