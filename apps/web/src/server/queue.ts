import "server-only";
import { inngest } from "@honeymoney/worker/client";
import type { Events } from "@honeymoney/worker/events";

/** Send an event to the agents queue (Inngest). */
export async function sendEvent<K extends keyof Events>(name: K, data: Events[K]["data"]): Promise<void> {
  // The cast keeps this helper generic over the typed event map.
  await inngest.send({ name, data } as never);
}
