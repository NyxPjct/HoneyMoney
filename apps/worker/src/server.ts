/**
 * Standalone worker for self-hosting outside Vercel:
 *   pnpm --filter @honeymoney/worker start
 * Then point Inngest at http://<host>:<PORT>/api/inngest.
 */
import { createServer } from "inngest/node";
import { functions, inngest, inngestEnv } from "./index";

const port = Number(process.env.PORT ?? 3001);
createServer({
  client: inngest,
  functions,
  signingKey: inngestEnv("INNGEST_SIGNING_KEY"),
  signingKeyFallback: inngestEnv("INNGEST_SIGNING_KEY_FALLBACK"),
}).listen(port, () => {
  console.warn(`HoneyMoney worker listening on :${port}/api/inngest`);
});
