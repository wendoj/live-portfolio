import { fileURLToPath } from "node:url";
import { defineBackend } from "@aws-amplify/backend";
import { CfnOutput, Duration, Expiration, RemovalPolicy, Stack } from "aws-cdk-lib";
import { CorsHttpMethod, HttpApi, HttpMethod, HttpStage } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { AppSyncAuthorizationType, Code, EventApi } from "aws-cdk-lib/aws-appsync";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { adminClear } from "./functions/admin-clear/resource";
import { doodle } from "./functions/doodle/resource";

/**
 * Backend entry point (Amplify Gen 2), all in eu-west-2. Serverless only:
 *
 *   AppSync Events   live cursors and presence (`room`),
 *                    plus server-confirmed guestbook pixels (`server`)
 *   HTTP API         GET/POST /doodle, throttled
 *   Lambda           doodle, adminClear (no route)
 *   DynamoDB         Doodle (one item)
 */
const backend = defineBackend({ doodle, adminClear });

// ---------------------------------------------------------------------------
// Real-time: AppSync Events
// ---------------------------------------------------------------------------

const realtime = backend.createStack("realtime");

// The browser connects, publishes and subscribes with a public API key. The
// key is public by design: the onPublish validator and the client's flood
// guard limit what it can do. AppSync caps API keys at 365 days; `expires`
// is recomputed on every deploy, so each deploy pushes the expiry out again
// (see "API key rotation" in the README). IAM is for Lambdas only.
const events = new EventApi(realtime, "RoomEvents", {
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
      { authorizationType: AppSyncAuthorizationType.IAM },
    ],
    connectionAuthModeTypes: [AppSyncAuthorizationType.API_KEY],
    defaultPublishAuthModeTypes: [AppSyncAuthorizationType.API_KEY],
    defaultSubscribeAuthModeTypes: [AppSyncAuthorizationType.API_KEY],
  },
});

// Visitor-to-visitor events. The handler drops anything that isn't a
// well-formed cursor or presence event.
events.addChannelNamespace("room", {
  code: Code.fromAsset(fileURLToPath(new URL("./events/room-onPublish.js", import.meta.url))),
});

// Server-confirmed events (guestbook pixels). Browsers may only listen: an
// onPublish handler can't tell an API-key publish from an IAM one, so the
// split is made by auth mode on a namespace of its own.
events.addChannelNamespace("server", {
  authorizationConfig: {
    publishAuthModeTypes: [AppSyncAuthorizationType.IAM],
    subscribeAuthModeTypes: [AppSyncAuthorizationType.API_KEY],
  },
});

// ---------------------------------------------------------------------------
// HTTP API + Lambda + DynamoDB
// ---------------------------------------------------------------------------

// Tables and the HTTP API live with the functions, so nothing references
// across stacks except the functions' read of the Events endpoint.
const apiStack = Stack.of(backend.doodle.resources.lambda);

const doodleTable = new Table(apiStack, "Doodle", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  removalPolicy: RemovalPolicy.DESTROY,
});

const { lambda: doodleFn } = backend.doodle.resources;
const { lambda: adminClearFn } = backend.adminClear.resources;

doodleTable.grantReadWriteData(doodleFn);
doodleTable.grantReadWriteData(adminClearFn);
events.grantPublish(doodleFn);
events.grantPublish(adminClearFn);

for (const fn of [backend.doodle, backend.adminClear]) {
  fn.addEnvironment("DOODLE_TABLE", doodleTable.tableName);
  fn.addEnvironment("EVENTS_HTTP_URL", `https://${events.httpDns}/event`);
}

// CORS: the deployed site only. Amplify Hosting sets AWS_APP_ID and
// AWS_BRANCH during `pipeline-deploy`; a personal sandbox has neither and
// allows any origin, so a phone on the LAN can test against it.
const { AWS_APP_ID, AWS_BRANCH, EXTRA_ALLOWED_ORIGINS } = process.env;
const allowOrigins =
  AWS_APP_ID && AWS_BRANCH
    ? [
        `https://${AWS_BRANCH.replaceAll("/", "-")}.${AWS_APP_ID}.amplifyapp.com`,
        "https://wendyji.com",
        "https://www.wendyji.com",
        "http://localhost:3000",
        ...(EXTRA_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? []),
      ]
    : ["*"];

// HTTP API rather than Lambda Function URLs: one base URL, CORS in one
// place, and stage-level throttling, which Function URLs don't have.
const httpApi = new HttpApi(apiStack, "PortfolioApi", {
  createDefaultStage: false,
  corsPreflight: {
    allowOrigins,
    allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
    allowHeaders: ["content-type"],
    maxAge: Duration.hours(1),
  },
});
new HttpStage(apiStack, "DefaultStage", {
  httpApi,
  autoDeploy: true,
  throttle: { burstLimit: 20, rateLimit: 10 },
});

httpApi.addRoutes({
  path: "/doodle",
  methods: [HttpMethod.GET, HttpMethod.POST],
  integration: new HttpLambdaIntegration("Doodle", doodleFn),
});

// For scripts/clear-guestbook.mjs.
new CfnOutput(apiStack, "AdminClearFunctionName", { value: adminClearFn.functionName });

// ---------------------------------------------------------------------------
// amplify_outputs.json
// ---------------------------------------------------------------------------

backend.addOutput({
  custom: {
    // Amplify.configure() reads `custom.events` into its Events config.
    events: {
      url: `https://${events.httpDns}/event`,
      aws_region: realtime.region,
      default_authorization_type: AppSyncAuthorizationType.API_KEY,
      api_key: events.apiKeys["Default"].attrApiKey,
    },
    api: { url: httpApi.apiEndpoint },
    admin: { clearFunctionName: adminClearFn.functionName },
  },
});
