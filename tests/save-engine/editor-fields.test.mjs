import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEditableFields,
  setJsonValueAtPath
} from "../../src/lib/save-engine/editor-fields.ts";

const fixture = {
  system: { _versionId: 12 },
  party: {
    _gold: 120,
    _steps: 9,
    _items: { "1": 2 },
    _weapons: {},
    _armors: {}
  },
  actors: {
    _data: [
      null,
      {
        _actorId: 1,
        _name: "Hero",
        _nickname: "Ace",
        _level: 12,
        _exp: 500,
        _hp: 30,
        _mp: 8,
        _tp: 4
      }
    ]
  },
  variables: { _data: [null, 0, 12, 0] },
  switches: { _data: [null, false, true, false] },
  pluginData: { nested: { retain: true }, custom: ["x", 7] }
};

test("field mapping includes zero-valued variables and both switch states", () => {
  const fields = buildEditableFields(fixture);
  const variableFields = fields.filter((field) => field.section === "Variables");
  const switchFields = fields.filter((field) => field.section === "Switches");

  assert.deepEqual(variableFields.map((field) => field.value), [0, 12, 0]);
  assert.deepEqual(switchFields.map((field) => field.value), [false, true, false]);
});

test("field mapping exposes actor name and nickname as bounded text fields", () => {
  const fields = buildEditableFields(fixture);
  const actorFields = fields.filter((field) => field.section === "Actor 1");

  assert.equal(actorFields.find((field) => field.label === "Name")?.value, "Hero");
  assert.equal(actorFields.find((field) => field.label === "Nickname")?.value, "Ace");
  assert.equal(actorFields.find((field) => field.label === "Name")?.maxLength, 80);
});

test("immutable updates preserve plugin data and the original object", () => {
  const edited = setJsonValueAtPath(fixture, ["variables", "_data", 1], 99);

  assert.equal(edited.variables._data[1], 99);
  assert.deepEqual(edited.pluginData, fixture.pluginData);
  assert.equal(fixture.variables._data[1], 0);
});

test("switch values can be toggled without changing unrelated data", () => {
  const edited = setJsonValueAtPath(fixture, ["switches", "_data", 1], true);

  assert.equal(edited.switches._data[1], true);
  assert.equal(fixture.switches._data[1], false);
  assert.deepEqual(edited.pluginData, fixture.pluginData);
});

test("actor text fields are editable without changing their types", () => {
  const edited = setJsonValueAtPath(fixture, ["actors", "_data", 1, "_name"], "New Hero");

  assert.equal(edited.actors._data[1]._name, "New Hero");
  assert.throws(() =>
    setJsonValueAtPath(fixture, ["actors", "_data", 1, "_name"], 4)
  );
});
