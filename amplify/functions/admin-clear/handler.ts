import { SEED_ART } from "../../../src/lib/guestbook";
import { readDoodle, writeSeed } from "../../shared/doodle";
import { publish } from "../../shared/publish";

/** Resets the guestbook to the seed art and broadcasts the reset. */
export const handler = async () => {
  const { version } = await readDoodle();
  const next = version + 1;
  await writeSeed({ force: true, version: next });
  await publish("/server/main", [{ type: "doodle-reset", cells: SEED_ART, version: next }]);
  return { ok: true, version: next };
};
