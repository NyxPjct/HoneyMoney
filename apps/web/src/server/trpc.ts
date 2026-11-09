import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  // Never echo inputs back (they may contain an AI key); only field-level validation messages.
  errorFormatter({ shape, error }) {
    const zod = error.cause instanceof ZodError ? error.cause.issues.map((i) => ({ path: i.path.join("."), message: i.message })) : null;
    return {
      ...shape,
      data: { code: shape.data.code, httpStatus: shape.data.httpStatus, path: shape.data.path, zod },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Faça login para continuar." });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
