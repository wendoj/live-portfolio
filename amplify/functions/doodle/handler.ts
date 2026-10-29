import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CELLS, ITEM_ID, PALETTE_SIZE, db, readDoodle, table, writeSeed } from "../../shared/doodle";
import { type Handler, json, parseJson, readBody } from "../../shared/http";
import { publish } from "../../shared/publish";

const isInt = (n: unknown, max: number): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < max;

function isMissingItem(error: unknown) {
  return error instanceof Error && error.name === "ConditionalCheckFailedException";
}

/** A stroke's worth of pixels: one request per batch, not per cell. Matches INK_MAX. */
const MAX_PIXELS = 30;

/**
 * `[[i, c], ...]` → valid, de-duplicated pixels (the last colour for a cell
 * wins; DynamoDB rejects two SETs on the same path), or null.
 */
function parsePixels(raw: unknown): [number, number][] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_PIXELS) return null;
  const pixels = new Map<number, number>();
  for (const p of raw) {
    if (!Array.isArray(p) || !isInt(p[0], CELLS) || !isInt(p[1], PALETTE_SIZE)) return null;
    pixels.set(p[0], p[1]);
  }
  return [...pixels];
}

/** Sets a batch of pixels in one atomic update and returns the new version. Last write wins. */
async function paint(pixels: [number, number][]) {
  const values: Record<string, unknown> = { ":one": 1, ":now": new Date().toISOString() };
  const sets = pixels.map(([i, c], n) => {
    values[`:c${n}`] = c;
    return `cells[${i}] = :c${n}`;
  });
  const update = () =>
    db.send(
      new UpdateCommand({
        TableName: table(),
        Key: { id: ITEM_ID },
        UpdateExpression: `SET ${sets.join(", ")}, updatedAt = :now ADD version :one`,
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeValues: values,
        ReturnValues: "UPDATED_NEW",
      }),
    );
  try {
    return (await update()).Attributes?.version as number;
  } catch (error) {
    if (!isMissingItem(error)) throw error;
    // First pixel ever: create the item from the seed art, then retry.
    await writeSeed({ force: false }).catch((e) => {
      if (!isMissingItem(e)) throw e; // someone else created it first: fine
    });
    return (await update()).Attributes?.version as number;
  }
}

/**
 * GET /doodle → { cells, version }.
 * POST /doodle { pixels: [[i, c], ...] } → paints the batch, then publishes
 * the confirmed change to /server/main, which only IAM (this Lambda) may
 * publish to.
 */
export const handler: Handler = async (event) => {
  if (event.requestContext.http.method === "GET") {
    return json(200, await readDoodle(), { "cache-control": "no-store" });
  }

  const body = parseJson(readBody(event, 1024)) as { pixels?: unknown } | undefined;
  const pixels = parsePixels(body?.pixels);
  if (!pixels) return json(400, { error: "invalid pixels" });

  const version = await paint(pixels);
  await publish("/server/main", [{ type: "doodle", pixels, version }]);
  return json(200, { version });
};
