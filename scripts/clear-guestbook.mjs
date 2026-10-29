/**
 * Resets the guestbook to the seed art and broadcasts the reset to everyone
 * reading. It invokes the adminClear Lambda, which has no HTTP route, so
 * only someone with AWS credentials for this account can run it.
 *
 *   node scripts/clear-guestbook.mjs
 */
import { readFileSync } from "node:fs";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const outputs = JSON.parse(readFileSync(new URL("../amplify_outputs.json", import.meta.url), "utf8"));
const name = outputs.custom?.admin?.clearFunctionName;
const region = outputs.custom?.events?.aws_region;
if (!name || !region) {
  console.error("No custom.admin in amplify_outputs.json: deploy the backend first.");
  process.exit(1);
}

const res = await new LambdaClient({ region }).send(new InvokeCommand({ FunctionName: name }));
const body = new TextDecoder().decode(res.Payload);
if (res.FunctionError) {
  console.error("Reset failed:", body);
  process.exit(1);
}
console.log("Guestbook reset:", body);
