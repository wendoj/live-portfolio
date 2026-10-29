import { Sha256 } from "@aws-crypto/sha256-js";
import { SignatureV4 } from "@smithy/signature-v4";

/**
 * Publishes events to the AppSync Events HTTP endpoint, signed with the
 * Lambda's own IAM role. The `server` namespace accepts IAM publishes only,
 * so browsers (API key) can never fake a confirmed guestbook pixel.
 */
export async function publish(channel: string, events: unknown[]) {
  const endpoint = process.env.EVENTS_HTTP_URL;
  const region = process.env.AWS_REGION;
  if (!endpoint || !region) throw new Error("EVENTS_HTTP_URL / AWS_REGION not set");

  const url = new URL(endpoint);
  const body = JSON.stringify({ channel, events: events.map((e) => JSON.stringify(e)) });
  const signer = new SignatureV4({
    service: "appsync",
    region,
    sha256: Sha256,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });
  const signed = await signer.sign({
    method: "POST",
    protocol: url.protocol,
    hostname: url.hostname,
    path: url.pathname,
    headers: { host: url.hostname, "content-type": "application/json" },
    body,
  });

  const res = await fetch(endpoint, { method: "POST", headers: signed.headers, body });
  if (!res.ok) throw new Error(`Events publish failed: ${res.status} ${await res.text()}`);
}
