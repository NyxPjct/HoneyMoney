import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/trpc";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    // Log only the procedure and code, never inputs (they can contain AI keys).
    onError: ({ path, error }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") console.error(`tRPC ${path ?? "?"} failed: ${error.code}`);
    },
  });
}

export { handler as GET, handler as POST };
