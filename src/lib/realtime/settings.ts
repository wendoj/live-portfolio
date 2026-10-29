"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Per-visitor room preferences, remembered across reloads. localStorage can
 * throw (private mode, blocked site data), so the settings then last for
 * this page load only.
 */
const KEYS = {
  invisible: "live-portfolio:invisible",
  hideOthers: "live-portfolio:hide-others",
} as const;

export type RoomSetting = keyof typeof KEYS;

function read(setting: RoomSetting) {
  try {
    return localStorage.getItem(KEYS[setting]) === "1";
  } catch {
    return false;
  }
}

function write(setting: RoomSetting, on: boolean) {
  try {
    if (on) localStorage.setItem(KEYS[setting], "1");
    else localStorage.removeItem(KEYS[setting]);
  } catch {
    // Not persisted; the in-memory value still applies.
  }
}

/**
 * A boolean setting. `loaded` turns true once storage has been read (after
 * hydration), so nothing acts on the default before the real value is known.
 */
export function useRoomSetting(setting: RoomSetting) {
  const [value, setValue] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setValue(read(setting));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [setting]);

  const set = useCallback(
    (on: boolean) => {
      setValue(on);
      write(setting, on);
    },
    [setting],
  );

  return [value, set, loaded] as const;
}
