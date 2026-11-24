import assert from "node:assert/strict";
import test from "node:test";
import {
  detectUnrealGvasGameProfile,
  getUnrealGvasProfileField,
  HALF_SWORD_GAME_PROGRESS_CLASS,
  isUnrealGvasProfileFieldEditable
} from "../../src/lib/unreal-gvas/game-profiles.ts";

test("detects Half Sword only by its exact progression save class", () => {
  const profile = detectUnrealGvasGameProfile(HALF_SWORD_GAME_PROGRESS_CLASS);
  assert.equal(profile?.id, "half-sword");
  assert.equal(detectUnrealGvasGameProfile("SG_GameProgress_C"), null);
  assert.equal(detectUnrealGvasGameProfile("/Game/Other/SG_GameProgress.SG_GameProgress_C"), null);
  assert.equal(detectUnrealGvasGameProfile(null), null);
});

test("maps the top-level Player Funds IntProperty", () => {
  const profile = detectUnrealGvasGameProfile(HALF_SWORD_GAME_PROGRESS_CLASS);
  assert.ok(profile);
  const property = { name: "Player Funds", type: "IntProperty" };
  assert.equal(isUnrealGvasProfileFieldEditable(profile, property), true);
  assert.equal(getUnrealGvasProfileField(profile, property)?.label, "Player Funds");
});

test("does not expose nested or similarly named fields through the Half Sword map", () => {
  const profile = detectUnrealGvasGameProfile(HALF_SWORD_GAME_PROGRESS_CLASS);
  assert.ok(profile);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: "Player Character", type: "StructProperty" }), false);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: "Weight_23_example", type: "DoubleProperty" }), false);
  assert.equal(isUnrealGvasProfileFieldEditable(profile, { name: "Player Funds", type: "FloatProperty" }), false);
});
