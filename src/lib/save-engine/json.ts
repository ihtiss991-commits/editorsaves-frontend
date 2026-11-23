import type { JsonValue, SaveKind } from "./types.ts";

const SLOT_CORE_KEYS = [
  "actors",
  "map",
  "player",
  "switches",
  "variables",
  "selfSwitches",
  "screen",
  "timer"
];

const CONFIG_KEYS = [
  "alwaysDash",
  "commandRemember",
  "bgmVolume",
  "bgsVolume",
  "meVolume",
  "seVolume",
  "touchUI",
  "windowOpacity",
  "fontSize",
  "screenWidth",
  "screenHeight"
];

export function isJsonRecord(value: unknown): value is Record<string, JsonValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseJsonPayload(text: string): JsonValue {
  return JSON.parse(text) as JsonValue;
}

export function classifyRpgMakerData(
  value: JsonValue,
  filename = ""
): SaveKind | null {
  const normalizedFilename = filename.toLowerCase().split(/[\\/]/).pop() ?? "";

  if (Array.isArray(value)) {
    const metadataEntries = value.filter((entry) => {
      if (!isJsonRecord(entry)) return false;
      const signals = ["title", "playtime", "timestamp", "characters", "faces"];
      return signals.filter((key) => key in entry).length >= 2;
    });

    return metadataEntries.length > 0 ? "global" : null;
  }

  if (!isJsonRecord(value)) return null;

  const hasSlotRoots = "system" in value && "party" in value;
  const slotSignalCount = SLOT_CORE_KEYS.filter((key) => key in value).length;
  if (hasSlotRoots && slotSignalCount >= 3) return "slot";

  const configSignalCount = CONFIG_KEYS.filter((key) => key in value).length;
  if (configSignalCount >= 3) return "config";

  if (normalizedFilename.startsWith("config") && configSignalCount >= 2) {
    return "config";
  }

  return null;
}
