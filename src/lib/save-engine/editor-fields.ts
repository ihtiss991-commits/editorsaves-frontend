import { isJsonRecord } from "./json.ts";
import type { JsonValue } from "./types.ts";

export type EditorFieldKind = "number" | "boolean";

export interface EditorField {
  id: string;
  path: Array<string | number>;
  section: string;
  label: string;
  kind: EditorFieldKind;
  value: number | boolean;
  description: string;
  min?: number;
  max?: number;
  step?: number;
}

const MAX_FIELDS = 180;
const MAX_INVENTORY_ENTRIES = 50;
const MAX_ACTORS = 24;
const MAX_VARIABLES = 40;
const MAX_SWITCHES = 40;

function addNumberField(
  fields: EditorField[],
  root: JsonValue,
  path: Array<string | number>,
  section: string,
  label: string,
  description: string,
  min = 0,
  max = 2_147_483_647,
  step = 1
): void {
  if (fields.length >= MAX_FIELDS) return;
  const value = getJsonValueAtPath(root, path);
  if (typeof value !== "number" || !Number.isFinite(value)) return;

  fields.push({
    id: JSON.stringify(path),
    path,
    section,
    label,
    kind: "number",
    value,
    description,
    min,
    max,
    step
  });
}

function addBooleanField(
  fields: EditorField[],
  root: JsonValue,
  path: Array<string | number>,
  section: string,
  label: string,
  description: string
): void {
  if (fields.length >= MAX_FIELDS) return;
  const value = getJsonValueAtPath(root, path);
  if (typeof value !== "boolean") return;

  fields.push({
    id: JSON.stringify(path),
    path,
    section,
    label,
    kind: "boolean",
    value,
    description
  });
}

export function getJsonValueAtPath(
  root: JsonValue,
  path: Array<string | number>
): JsonValue | undefined {
  let current: JsonValue | undefined = root;

  for (const part of path) {
    if (Array.isArray(current) && typeof part === "number") {
      current = current[part];
      continue;
    }
    if (isJsonRecord(current) && typeof part === "string") {
      current = current[part];
      continue;
    }
    return undefined;
  }

  return current;
}

export function buildEditableFields(data: JsonValue): EditorField[] {
  if (!isJsonRecord(data) || !("system" in data) || !("party" in data)) return [];

  const fields: EditorField[] = [];

  addNumberField(
    fields, data, ["party", "_gold"], "Party", "Gold",
    "The party currency value stored by this save."
  );
  addNumberField(
    fields, data, ["party", "_steps"], "Party", "Steps",
    "The stored party step counter."
  );

  const inventoryTypes = [
    { key: "_items", label: "Items", section: "Inventory" },
    { key: "_weapons", label: "Weapons", section: "Inventory" },
    { key: "_armors", label: "Armors", section: "Inventory" }
  ];

  const party = data.party;
  if (isJsonRecord(party)) {
    for (const inventory of inventoryTypes) {
      const map = party[inventory.key];
      if (!isJsonRecord(map)) continue;

      const entries = Object.entries(map)
        .filter(([id, count]) => /^[1-9]\d*$/.test(id) && typeof count === "number" && Number.isFinite(count))
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(0, MAX_INVENTORY_ENTRIES);

      for (const [id, count] of entries) {
        if (fields.length >= MAX_FIELDS) break;
        addNumberField(
          fields,
          data,
          ["party", inventory.key, id],
          inventory.section,
          inventory.label + " ID " + id,
          "Count for this internal database ID. Item names require the original game's database.",
          0,
          999_999,
          1
        );
      }
    }
  }

  const actors = data.actors;
  if (isJsonRecord(actors) && Array.isArray(actors._data)) {
    let shownActors = 0;
    for (let index = 1; index < actors._data.length && shownActors < MAX_ACTORS; index += 1) {
      const actor = actors._data[index];
      if (!isJsonRecord(actor)) continue;

      const actorId = typeof actor._actorId === "number" ? actor._actorId : index;
      const actorSection = "Actor " + actorId;
      const actorFieldsBefore = fields.length;

      addNumberField(fields, data, ["actors", "_data", index, "_level"], actorSection, "Level",
        "The stored actor level.", 1, 9999, 1);
      addNumberField(fields, data, ["actors", "_data", index, "_exp"], actorSection, "Experience",
        "The stored actor experience value.");
      addNumberField(fields, data, ["actors", "_data", index, "_hp"], actorSection, "HP",
        "The stored actor hit points.");
      addNumberField(fields, data, ["actors", "_data", index, "_mp"], actorSection, "MP",
        "The stored actor magic points.");
      addNumberField(fields, data, ["actors", "_data", index, "_tp"], actorSection, "TP",
        "The stored actor tactical points.", 0, 100, 1);

      if (fields.length > actorFieldsBefore) shownActors += 1;
      if (fields.length >= MAX_FIELDS) break;
    }
  }

  const variables = data.variables;
  if (isJsonRecord(variables) && Array.isArray(variables._data)) {
    let shown = 0;
    for (let index = 1; index < variables._data.length && shown < MAX_VARIABLES; index += 1) {
      const value = variables._data[index];
      if (typeof value !== "number" || !Number.isFinite(value) || value === 0) continue;
      addNumberField(
        fields, data, ["variables", "_data", index], "Variables",
        "Variable ID " + index, "A non-zero numeric game variable. Its meaning is defined by the game.",
        -2_147_483_647, 2_147_483_647, "any" as unknown as number
      );
      shown += 1;
      if (fields.length >= MAX_FIELDS) break;
    }
  }

  const switches = data.switches;
  if (isJsonRecord(switches) && Array.isArray(switches._data)) {
    let shown = 0;
    for (let index = 1; index < switches._data.length && shown < MAX_SWITCHES; index += 1) {
      if (switches._data[index] !== true) continue;
      addBooleanField(
        fields, data, ["switches", "_data", index], "Switches",
        "Switch ID " + index, "An active game switch. Its meaning is defined by the game."
      );
      shown += 1;
      if (fields.length >= MAX_FIELDS) break;
    }
  }

  return fields;
}

export function setJsonValueAtPath(
  root: JsonValue,
  path: Array<string | number>,
  nextValue: number | boolean
): JsonValue {
  if (path.length === 0) throw new Error("A save field path is required.");

  const update = (current: JsonValue, depth: number): JsonValue => {
    const key = path[depth];
    const isLast = depth === path.length - 1;

    if (Array.isArray(current)) {
      if (typeof key !== "number" || key < 0 || key >= current.length) {
        throw new Error("The selected save field no longer exists.");
      }
      const oldValue = current[key];
      if (isLast) {
        if (typeof oldValue !== typeof nextValue) throw new Error("The new value has an incompatible type.");
        const copy = [...current];
        copy[key] = nextValue;
        return copy;
      }
      const copy = [...current];
      copy[key] = update(oldValue, depth + 1);
      return copy;
    }

    if (isJsonRecord(current)) {
      if (typeof key !== "string" || !Object.prototype.hasOwnProperty.call(current, key)) {
        throw new Error("The selected save field no longer exists.");
      }
      const oldValue = current[key];
      if (isLast) {
        if (typeof oldValue !== typeof nextValue) throw new Error("The new value has an incompatible type.");
        return { ...current, [key]: nextValue };
      }
      return { ...current, [key]: update(oldValue, depth + 1) };
    }

    throw new Error("The selected save field path is invalid.");
  };

  return update(root, 0);
}
