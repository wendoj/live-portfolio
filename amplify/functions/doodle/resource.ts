import { defineFunction } from "@aws-amplify/backend";

/** GET/POST /doodle: reads the guestbook, or paints a batch of pixels and broadcasts it. */
export const doodle = defineFunction({
  name: "doodle",
  entry: "./handler.ts",
  timeoutSeconds: 8,
  memoryMB: 256,
});
