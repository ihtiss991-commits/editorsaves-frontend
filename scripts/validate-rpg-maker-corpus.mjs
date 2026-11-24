import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { inspectSaveFile, serializeSaveFile } from "../src/lib/save-engine/index.ts";
import { buildEditableFields } from "../src/lib/save-engine/editor-fields.ts";

async function listFiles(directory) {
  const found = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return found;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await listFiles(path));
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

async function resolveRoot(argument) {
  const candidates = [resolve(argument), join(resolve(argument), "Downloads")];
  for (const candidate of candidates) {
    const mv = await listFiles(join(candidate, "rpgmaker_mv"));
    const mz = await listFiles(join(candidate, "rpgmaker_mz"));
    if (mv.length || mz.length) return candidate;
  }
  throw new Error("Could not find rpgmaker_mv and rpgmaker_mz directories. Extract the research ZIP and pass its Downloads folder.");
}

const argument = process.argv[2];
if (!argument) {
  console.error("Usage: npm run validate:real-samples -- <extracted-Downloads-folder>");
  process.exit(2);
}

const root = await resolveRoot(argument);
const sets = [
  { label: "MV", format: "rpg-maker-mv", directory: join(root, "rpgmaker_mv") },
  { label: "MZ", format: "rpg-maker-mz", directory: join(root, "rpgmaker_mz") }
];
const hashes = new Set();
const failures = [];
const summary = {
  files: 0, decoded: 0, roundTrips: 0, bytes: 0, duplicates: 0,
  slots: { MV: 0, MZ: 0 }, nonSlot: { global: 0, config: 0 },
  fields: { min: null, max: 0, total: 0 }
};

for (const set of sets) {
  const paths = (await listFiles(set.directory)).sort();
  for (const path of paths) {
    summary.files += 1;
    const bytes = new Uint8Array(await readFile(path));
    summary.bytes += bytes.byteLength;
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (hashes.has(digest)) summary.duplicates += 1;
    hashes.add(digest);

    try {
      const inspection = await inspectSaveFile(bytes, { filename: basename(path) });
      assert.equal(inspection.status, "supported", set.label + ": content was not recognized");
      assert.equal(inspection.format, set.format, set.label + ": detected format mismatch");
      summary.decoded += 1;

      if (inspection.kind === "slot") {
        summary.slots[set.label] += 1;
        const count = buildEditableFields(inspection.data).length;
        summary.fields.min = summary.fields.min === null ? count : Math.min(summary.fields.min, count);
        summary.fields.max = Math.max(summary.fields.max, count);
        summary.fields.total += count;
      } else {
        summary.nonSlot[inspection.kind] += 1;
      }

      const output = await serializeSaveFile(set.format, inspection.data);
      const reparsed = await inspectSaveFile(output, { filename: basename(path) });
      assert.equal(reparsed.status, "supported", set.label + ": serialized output could not be parsed");
      assert.equal(reparsed.format, inspection.format, set.label + ": format changed after serialization");
      assert.equal(reparsed.kind, inspection.kind, set.label + ": save kind changed after serialization");
      assert.deepStrictEqual(reparsed.data, inspection.data, set.label + ": data changed during round-trip");
      summary.roundTrips += 1;
    } catch (error) {
      failures.push({ family: set.label, message: error && error.message ? error.message : "Unknown validation failure" });
    }
  }
}

const encryptedFiles = await listFiles(join(root, "rmmz_encrypted"));
let encryptedIdentified = 0;
for (const path of encryptedFiles) {
  try {
    const bytes = new Uint8Array(await readFile(path));
    const inspection = await inspectSaveFile(bytes, { filename: basename(path) });
    assert.equal(inspection.status, "unsupported");
    assert.equal(inspection.format, "rpg-maker-mz-encrypted");
    encryptedIdentified += 1;
  } catch (error) {
    failures.push({ family: "MZ encrypted", message: error && error.message ? error.message : "Encrypted wrapper check failed" });
  }
}

console.log("EditorSaves private RPG Maker corpus validation");
console.log("Input: " + summary.files + " files (" + (summary.bytes / 1024 / 1024).toFixed(2) + " MiB)");
console.log("Decoded: " + summary.decoded + "/" + summary.files);
console.log("Round-tripped with exact JSON data preservation: " + summary.roundTrips + "/" + summary.files);
console.log("Slot saves: MV " + summary.slots.MV + ", MZ " + summary.slots.MZ);
console.log("Recognized non-slot saves: global " + summary.nonSlot.global + ", config " + summary.nonSlot.config);
const slotCount = summary.slots.MV + summary.slots.MZ;
const averageFields = slotCount ? (summary.fields.total / slotCount).toFixed(1) : "0";
console.log("Editable fields per slot: min " + (summary.fields.min ?? 0) + ", max " + summary.fields.max + ", average " + averageFields);
console.log("Exact duplicate payloads within the slot corpus: " + summary.duplicates);
console.log("MZ encrypted wrappers identified but not decrypted: " + encryptedIdentified);
console.log("Sample filenames and save contents are intentionally not printed.");

if (failures.length) {
  console.error("Failures: " + failures.length);
  for (const failure of failures.slice(0, 20)) {
    console.error("- " + failure.family + ": " + failure.message);
  }
  process.exit(1);
}
