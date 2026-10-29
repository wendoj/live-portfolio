/**
 * Publishes good and bad events to the deployed room over the HTTP endpoint
 * and checks that the onPublish handler lets through exactly the good ones.
 *
 *   npx ampx sandbox   (in another terminal, or deployed once)
 *   node scripts/check-onpublish.mjs
 *
 * Valid events really are broadcast, so open tabs will briefly see a
 * visitor called "Test Probe".
 */
import { readFileSync } from "node:fs";

const outputs = JSON.parse(readFileSync(new URL("../amplify_outputs.json", import.meta.url), "utf8"));
const config = outputs.custom?.events;
if (!config?.api_key) {
  console.error("No custom.events in amplify_outputs.json: deploy the sandbox first.");
  process.exit(1);
}

const visitor = { id: "TestPrb1", name: "Test Probe", color: 0 };
const cases = [
  ["valid cursor", true, { type: "cursor", id: visitor.id, device: "pointer", section: "about", anchor: "about-now", x: 0.5, y: 0.5, t: Date.now() }],
  ["valid join", true, { type: "join", visitor, device: "touch" }],
  ["valid away heartbeat", true, { type: "heartbeat", visitor, device: "pointer", away: true }],
  ["valid leave", true, { type: "leave", visitor, device: "pointer" }],
  ["x out of range", false, { type: "cursor", id: visitor.id, device: "pointer", section: "about", x: 1.5, y: 0.5, t: 1 }],
  ["unknown type", false, { type: "chat", id: visitor.id, text: "hi" }],
  ["bad section", false, { type: "cursor", id: visitor.id, device: "pointer", section: "About Me", x: 0.5, y: 0.5, t: 1 }],
  ["colour outside palette", false, { type: "join", visitor: { ...visitor, color: 99 }, device: "pointer" }],
  ["name over 32 chars", false, { type: "join", visitor: { ...visitor, name: "x".repeat(33) }, device: "pointer" }],
  ["oversized payload", false, { type: "join", visitor, device: "pointer", pad: "x".repeat(1100) }],
];

let failures = 0;
// One event per request, so one rejection can't mask another.
for (const [label, shouldPass, event] of cases) {
  const res = await fetch(config.url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": config.api_key },
    body: JSON.stringify({ channel: "/room/main", events: [JSON.stringify(event)] }),
  });
  const body = await res.json().catch(() => ({}));
  const passed = res.ok && (body.successful?.length ?? 0) === 1;
  const ok = passed === shouldPass;
  if (!ok) failures += 1;
  const detail = passed ? "broadcast" : (body.failed?.[0]?.message ?? `HTTP ${res.status}`);
  console.log(`${ok ? "✓" : "✗"} ${label.padEnd(24)} ${detail}`);
}

console.log(failures ? `\n${failures} case(s) wrong` : "\nAll cases behave as expected");
process.exit(failures ? 1 : 0);
