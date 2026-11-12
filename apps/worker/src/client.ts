import { EventSchemas, Inngest } from "inngest";
import type { Events } from "./events";
import { inngestEnv } from "./inngest-env";

export const inngest = new Inngest({
  id: "honeymoney",
  schemas: new EventSchemas().fromRecord<Events>(),
  eventKey: inngestEnv("INNGEST_EVENT_KEY"),
});
