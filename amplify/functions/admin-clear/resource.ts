import { defineFunction } from "@aws-amplify/backend";

/**
 * Resets the guestbook to the seed art and tells everyone. It has no HTTP
 * route: only someone with AWS credentials can invoke it
 * (scripts/clear-guestbook.mjs), so there is no admin token to leak.
 */
export const adminClear = defineFunction({
  name: "adminClear",
  entry: "./handler.ts",
  timeoutSeconds: 8,
  memoryMB: 256,
});
