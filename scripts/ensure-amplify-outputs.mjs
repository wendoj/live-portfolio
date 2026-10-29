/**
 * amplify_outputs.json is generated (by `npx ampx sandbox` locally, or by the
 * pipeline) and gitignored, but the client imports it. When it's missing,
 * write a stub with no `custom.events`, so a fresh clone still builds and the
 * site runs as a static page with the multiplayer layer switched off.
 */
import { existsSync, writeFileSync } from "node:fs";

const file = new URL("../amplify_outputs.json", import.meta.url);

if (!existsSync(file)) {
  writeFileSync(file, `${JSON.stringify({ version: "1.4" }, null, 2)}\n`);
  console.log("amplify_outputs.json not found: wrote an offline stub (run `npx ampx sandbox` for live mode).");
}
