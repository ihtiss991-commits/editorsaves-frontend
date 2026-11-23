import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectSaveFile,
  parseSaveFile,
  serializeSaveFile,
  SaveEngineError
} from "../../src/lib/save-engine/index.ts";

const slotFixture = {
  system: { _saveEnabled: true, _versionId: 17 },
  screen: { _brightness: 255 },
  timer: { _frames: 0, _working: false },
  switches: { _data: [null, true] },
  variables: { _data: [null, 123] },
  selfSwitches: { _data: {} },
  actors: { _data: [null, { _actorId: 1, _level: 12 }] },
  party: { _gold: 4321, _items: { "1": 3 } },
  map: { _mapId: 2, _events: {} },
  player: { _x: 5, _y: 8 },
  pluginData: { customInventory: ["kept", 7], nested: { flag: true } }
};

const globalFixture = [{
  title: "Fixture Game",
  characters: [["Hero", 12]],
  faces: [["HeroFace", 0]],
  playtime: "01:23:45",
  timestamp: 1790000000000
}];

test("RPG Maker MV: LZ-String Base64 round-trip preserves plugin fields", async () => {
  const encoded = await serializeSaveFile("rpg-maker-mv", slotFixture);
  const result = await inspectSaveFile(encoded, { filename: "renamed.dat" });

  assert.equal(result.status, "supported");
  assert.equal(result.format, "rpg-maker-mv");
  assert.equal(result.kind, "slot");
  assert.deepEqual((await parseSaveFile(encoded)).data, slotFixture);
});

test("RPG Maker MZ: zlib byte-string round-trip preserves plugin fields", async () => {
  const encoded = await serializeSaveFile("rpg-maker-mz", slotFixture);
  const result = await inspectSaveFile(encoded, { filename: "renamed.sav" });

  assert.equal(result.status, "supported");
  assert.equal(result.format, "rpg-maker-mz");
  assert.equal(result.kind, "slot");
  assert.deepEqual((await parseSaveFile(encoded)).data, slotFixture);
});

test("RPG Maker global metadata arrays are classified", async () => {
  const encoded = await serializeSaveFile("rpg-maker-mz", globalFixture);
  const parsed = await parseSaveFile(encoded, { filename: "global.rmmzsave" });
  assert.equal(parsed.kind, "global");
  assert.deepEqual(parsed.data, globalFixture);
});

test("format detection is content-based, not extension-only", async () => {
  const encoded = await serializeSaveFile("rpg-maker-mv", slotFixture);
  const result = await inspectSaveFile(encoded, { filename: "backup.bin" });
  assert.equal(result.status, "supported");
  assert.equal(result.format, "rpg-maker-mv");
});

test("MZSEC1 custom encryption wrapper is identified but not decoded", async () => {
  const input = new TextEncoder().encode("MZSEC1:encrypted-payload");
  const result = await inspectSaveFile(input, { filename: "file.rmmzsave" });
  assert.equal(result.status, "unsupported");
  assert.equal(result.format, "rpg-maker-mz-encrypted");
  await assert.rejects(
    () => parseSaveFile(input),
    (error) => error instanceof SaveEngineError && error.code === "UNSUPPORTED_ENCRYPTION"
  );
});

test("invalid content is not falsely classified from its extension", async () => {
  const input = new TextEncoder().encode("not an RPG Maker save");
  const result = await inspectSaveFile(input, { filename: "file.rpgsave" });
  assert.equal(result.status, "unknown");
  assert.equal(result.format, null);
  assert.ok(result.hints.some((hint) => hint.includes("filename suggests")));
});

test("empty and oversized files fail before decoding", async () => {
  await assert.rejects(
    () => inspectSaveFile(new Uint8Array()),
    (error) => error instanceof SaveEngineError && error.code === "EMPTY_FILE"
  );
  await assert.rejects(
    () => inspectSaveFile(new Uint8Array(11), { maxInputBytes: 10 }),
    (error) => error instanceof SaveEngineError && error.code === "INPUT_TOO_LARGE"
  );
});

test("decompressed output limit is enforced", async () => {
  const encoded = await serializeSaveFile("rpg-maker-mz", slotFixture);
  await assert.rejects(
    () => inspectSaveFile(encoded, { maxDecompressedBytes: 64 }),
    (error) => error instanceof SaveEngineError && error.code === "DECOMPRESSED_TOO_LARGE"
  );
});
