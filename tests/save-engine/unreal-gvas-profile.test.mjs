import assert from "node:assert/strict";
import test from "node:test";
import {
  detectUnrealGvasGameProfile,
  getUnrealGvasProfileField,
  HALF_SWORD_GAME_PROGRESS_CLASS,
  isUnrealGvasProfileFieldEditable
} from "../../src/lib/unreal-gvas/game-profiles.ts";

const heightName = "Height_21_0EB204DF4978B92AD0ED188FD32EEC7B";
const weightName = "Weight_23_65E4C6534D14653F96EB739F159E58CD";

test("detects Half Sword only by its exact progression save class", () => {
  const profile = detectUnrealGvasGameProfile(HALF_SWORD_GAME_PROGRESS_CLASS);
  assert.equal(profile?.id, "half-sword");
  assert.equal(detectUnrealGvasGameProfile("SG_GameProgress_C"), null);
  assert.equal(detectUnrealGvasGameProfile("/Game/Other/SG_GameProgress.SG_GameProgress_C"), null);
  assert.equal(detectUnrealGvasGameProfile(null), null);
});

test("maps Player Funds, Character Height and Character Weight by exact path and type", () => {
  const profile = detectUnrealGvasGameProfile(HALF_SWORD_GAME_PROGRESS_CLASS);
  assert.ok(profile);
  const fields = [
    { name: "Player Funds", type: "IntProperty", path: "Player Funds", label: "Player Funds" },
    { name: heightName, type: "DoubleProperty", path: "Player Character." + heightName, label: "Character Height" },
    { name: weightName, type: "DoubleProperty", path: "Player Character." + weightName, label: "Character Weight / Strength" }
  ];
  for (const field of fields) {
    assert.equal(isUnrealGvasProfileFieldEditable(profile, field), true);
    assert.equal(getUnrealGvasProfileField(profile, field)?.label, field.label);
  }
});

test("does not expose similarly named, wrong-type or wrong-path fields", () => {
  const profile = detectUnrealGvasGameProfile(HALF_SWORD_GAME_PROGRESS_CLASS);
  assert.ok(profile);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: heightName, type: "FloatProperty", path: "Player Character." + heightName }), false);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: weightName, type: "DoubleProperty", path: "Merchant Inventory." + weightName }), false);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: "Weight_23_example", type: "DoubleProperty", path: "Player Character.Weight_23_example" }), false);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: "Player Character", type: "StructProperty", path: "Player Character" }), false);
});
