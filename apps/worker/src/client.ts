import { EventSchemas, Inngest } from "inngest";
import type { Events } from "./events";

export const inngest = new Inngest({
  id: "honeymoney",
  schemas: new EventSchemas().fromRecord<Events>(),
});
