import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import {
  parseUnrealGvas,
  serializeUnrealGvas
} from "../src/lib/unreal-gvas/index.ts";

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

async function findCorpusRoot(argument) {
  const candidates = [resolve(argument), join(resolve(argument), "Downloads")];
  for (const candidate of candidates) {
    if ((await listFiles(join(candidate, "unreal_gvas"))).length) return candidate;
  }
  throw new Error("Could not find an unreal_gvas folder. Extract Downloads(6).zip and pass its Downloads directory.");
}

const argument = process.argv[2];
if (!argument) {
  console.error("Usage: npm run validate:unreal-gvas -- <extracted-Downloads-folder>");
  process.exit(2);
}

const root = await findCorpusRoot(argument);
const paths = (await listFiles(join(root, "unreal_gvas"))).sort();
const summary = {
  files: paths.length,
  standardDecoded: 0,
  unsupportedVersions: 0,
  byteExactUnchanged: 0,
  editedRoundTrips: 0,
  properties: 0,
  editableProperties: 0
};
const failures = [];

for (const path of paths) {
  const input = new Uint8Array(await readFile(path));

  try {
    const parsed = parseUnrealGvas(input);

    if (parsed.status === "unsupported") {
      summary.unsupportedVersions += 1;
      continue;
    }

    assert.equal(parsed.status, "supported", basename(path) + ": expected a supported GVAS header");
    if (parsed.status !== "supported") continue;

    summary.standardDecoded += 1;
    summary.properties += parsed.file.properties.length;
    summary.editableProperties += parsed.file.properties.filter((property) => property.editable).length;

    const unchanged = serializeUnrealGvas(input, parsed.file, []);
    assert.deepEqual(unchanged, input, "Unchanged serialization must be byte-exact");
    summary.byteExactUnchanged += 1;

    const property = parsed.file.properties.find((candidate) =>
      candidate.editable && candidate.editKind === "number" && typeof candidate.value === "number"
    );

    if (property && typeof property.value === "number") {
      const nextValue = property.integer ? property.value + 1 : property.value + 0.25;
      const edited = serializeUnrealGvas(input, parsed.file, [
        { propertyIndex: property.index, value: nextValue }
      ]);
      const reparsed = parseUnrealGvas(edited);

      assert.equal(reparsed.status, "supported", "Edited output must parse");
      if (reparsed.status === "supported") {
        assert.equal(reparsed.file.properties[property.index].value, nextValue);
        summary.editedRoundTrips += 1;
      }
    }
  } catch (error) {
    failures.push(error && error.message ? error.message : "Unknown validation failure");
  }
}

console.log("EditorSaves private Unreal GVAS corpus validation");
console.log("GVAS files inspected: " + summary.files);
console.log("Standard header/property streams decoded: " + summary.standardDecoded);
console.log("Unsupported GVAS header versions: " + summary.unsupportedVersions);
console.log("Unchanged byte-exact round-trips: " + summary.byteExactUnchanged);
console.log("Edited scalar round-trips: " + summary.editedRoundTrips);
console.log("Properties inspected: " + summary.properties);
console.log("Editable scalar properties: " + summary.editableProperties);
console.log("Source filenames and save values are intentionally not printed.");

if (failures.length) {
  console.error("Validation failures: " + failures.length);
  for (const failure of failures.slice(0, 20)) console.error("- " + failure);
  process.exit(1);
}
assert.equal(summary.standardDecoded + summary.unsupportedVersions, summary.files);
