import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEditableFields,
  getJsonValueAtPath,
  setJsonValueAtPath
} from "../../src/lib/save-engine/editor-fields.ts";

const fixture = {
  system: { _saveEnabled: true },
  party: {
    _gold: 500,
    _steps: 45,
    _items: { "1": 3, "7": 0 },
    _weapons: { "2": 1 },
    _armors: { "4": 2 }
  },
  actors: {
    _data: [
      null,
      { _actorId: 1, _level: 12, _exp: 2500, _hp: 50, _mp: 20 },
      { _actorId: 2, _level: 8 }
    ]
  },
  variables: { _data: [null, 0, 42] },
  switches: { _data: [null, true, false, true] },
  pluginData: { secretFlag: true, nested: { keep: "unchanged" } }
};

test("only recognized RPG Maker slot fields are exposed for editing", () => {
  const fields = buildEditableFields(fixture);
  assert.ok(fields.some((field) => field.label === "Gold"));
  assert.ok(fields.some((field) => field.label === "Items ID 1"));
  assert.ok(fields.some((field) => field.label === "Level" && field.section === "Actor 1"));
  assert.ok(fields.some((field) => field.label === "Variable ID 2"));
  assert.ok(fields.some((field) => field.label === "Switch ID 1"));
  assert.ok(!fields.some((field) => field.label.includes("secretFlag")));
});

test("updates are immutable and preserve unknown plugin data", () => {
  const original = fixture;
  const edited = setJsonValueAtPath(original, ["party", "_gold"], 999999);
  assert.equal(getJsonValueAtPath(edited, ["party", "_gold"]), 999999);
  assert.equal(getJsonValueAtPath(original, ["party", "_gold"]), 500);
  assert.deepEqual(
    getJsonValueAtPath(edited, ["pluginData"]),
    getJsonValueAtPath(original, ["pluginData"])
  );
});

test("array fields can be changed without altering neighboring values", () => {
  const edited = setJsonValueAtPath(fixture, ["variables", "_data", 2], 77);
  assert.equal(getJsonValueAtPath(edited, ["variables", "_data", 2]), 77);
  assert.equal(getJsonValueAtPath(edited, ["variables", "_data", 1]), 0);
});

test("boolean switches retain boolean type", () => {
  const edited = setJsonValueAtPath(fixture, ["switches", "_data", 1], false);
  assert.equal(getJsonValueAtPath(edited, ["switches", "_data", 1]), false);
  assert.throws(
    () => setJsonValueAtPath(fixture, ["switches", "_data", 1], 1),
    /incompatible type/
  );
});

test("non-slot data does not receive slot editing controls", () => {
  assert.deepEqual(buildEditableFields([{ title: "Game", playtime: "00:10", timestamp: 1 }]), []);
  assert.deepEqual(buildEditableFields({ bgmVolume: 80, seVolume: 70 }), []);
});

test("invalid paths are rejected rather than creating unknown structures", () => {
  assert.throws(
    () => setJsonValueAtPath(fixture, ["party", "_unknown"], 4),
    /no longer exists/
  );
});
