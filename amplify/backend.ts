import { fileURLToPath } from "node:url";
import { defineBackend } from "@aws-amplify/backend";
import { Duration, Expiration } from "aws-cdk-lib";
import { AppSyncAuthorizationType, Code, EventApi } from "aws-cdk-lib/aws-appsync";

/**
 * Backend entry point (Amplify Gen 2), all in eu-west-2.
 *
 * An AppSync Events API for live cursors and presence. Still to come:
 *   - API Gateway HTTP API + Lambda for ghost paths and the guestbook
 *   - DynamoDB tables GhostPaths (7-day TTL) and Doodle
 *   - IAM auth on the Events API so Lambdas can publish server-only events
 */
const backend = defineBackend({});

const realtime = backend.createStack("realtime");

// The browser connects, publishes and subscribes with a public API key. The
// key is public by design: the onPublish validator and the client's flood
// guard limit what it can do. AppSync caps API keys at 365 days; `expires`
// is recomputed on every deploy, so each deploy pushes the expiry out again
// (see "API key rotation" in the README).
const api = new EventApi(realtime, "RoomEvents", {
  apiName: "live-portfolio-room",
  authorizationConfig: {
    authProviders: [
      {
        authorizationType: AppSyncAuthorizationType.API_KEY,
        apiKeyConfig: {
          description: "Public browser key for the live room",
          expires: Expiration.after(Duration.days(365)),
        },
      },
    ],
  },
});

// One namespace, one channel (/room/main). The handler drops anything that
// isn't a well-formed cursor or presence event.
api.addChannelNamespace("room", {
  code: Code.fromAsset(fileURLToPath(new URL("./events/room-onPublish.js", import.meta.url))),
});

// Amplify.configure() reads `custom.events` into its Events config.
backend.addOutput({
  custom: {
    events: {
      url: `https://${api.httpDns}/event`,
      aws_region: realtime.region,
      default_authorization_type: AppSyncAuthorizationType.API_KEY,
      api_key: api.apiKeys["Default"].attrApiKey,
    },
  },
});
