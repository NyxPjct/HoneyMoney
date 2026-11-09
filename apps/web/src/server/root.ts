import { accountRouter } from "./routers/account";
import { keysRouter } from "./routers/keys";
import { pagesRouter } from "./routers/pages";
import { profileRouter } from "./routers/profile";
import { projectsRouter } from "./routers/projects";
import { router } from "./trpc";

export const appRouter = router({
  profile: profileRouter,
  keys: keysRouter,
  projects: projectsRouter,
  pages: pagesRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
