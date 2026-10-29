import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { GRID_SIZE, SEED_ART } from "../../src/lib/guestbook";

/**
 * The guestbook is one DynamoDB item: `cells` is a list of 1,024 palette
 * ids, so a single pixel can be set atomically with `SET cells[i] = :c`,
 * and `version` counts every change so clients can spot a missed one.
 */
export const CELLS = GRID_SIZE * GRID_SIZE;
export const PALETTE_SIZE = 8;
export const ITEM_ID = "main";

export const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const table = () => {
  const name = process.env.DOODLE_TABLE;
  if (!name) throw new Error("DOODLE_TABLE not set");
  return name;
};

export const seedCells = () => [...SEED_ART].map(Number);
export const packCells = (cells: number[]) => cells.join("");

export type DoodleState = { cells: string; version: number };

export async function readDoodle(): Promise<DoodleState> {
  const { Item } = await db.send(new GetCommand({ TableName: table(), Key: { id: ITEM_ID } }));
  if (!Item) return { cells: SEED_ART, version: 0 };
  return { cells: packCells(Item.cells as number[]), version: Item.version as number };
}

/** Writes the seed art. `force` overwrites (admin clear); otherwise only if missing. */
export async function writeSeed({ force, version = 0 }: { force: boolean; version?: number }) {
  await db.send(
    new PutCommand({
      TableName: table(),
      Item: { id: ITEM_ID, cells: seedCells(), version, updatedAt: new Date().toISOString() },
      ...(force ? {} : { ConditionExpression: "attribute_not_exists(id)" }),
    }),
  );
}
