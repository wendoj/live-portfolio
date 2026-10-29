import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;

/** CORS headers are added by API Gateway, so responses only carry the body. */
export function json(statusCode: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    statusCode,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

/**
 * The raw request body, capped at `maxBytes`. API Gateway may hand it over
 * base64-encoded.
 */
export function readBody(event: APIGatewayProxyEventV2, maxBytes: number): string | null {
  if (!event.body) return null;
  const text = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  return Buffer.byteLength(text) > maxBytes ? null : text;
}

export function parseJson(text: string | null): unknown {
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
