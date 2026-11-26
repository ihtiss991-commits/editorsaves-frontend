import assert from "node:assert/strict";
import test from "node:test";
import {
  parseUnrealGvas,
  serializeUnrealGvas,
  UnrealGvasError
} from "../../src/lib/unreal-gvas/index.ts";

const encoder = new TextEncoder();

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function i32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, true);
  return bytes;
}

function u16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function fstring(value) {
  const content = encoder.encode(value);
  const bytes = new Uint8Array(4 + content.length + 1);
  new DataView(bytes.buffer).setInt32(0, content.length + 1, true);
  bytes.set(content, 4);
  return bytes;
}

function join(...parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function intPayload(value) {
  return i32(value);
}

function stringPayload(value) {
  return fstring(value);
}

function legacyTag(name, type, payload, options = {}) {
  const size = options.size ?? payload.length;
  const metadata = [];
  if (type === "BoolProperty") metadata.push(new Uint8Array([options.bool ? 1 : 0]));
  metadata.push(new Uint8Array([0])); // no property GUID
  return join(
    fstring(name),
    fstring(type),
    u32(size),
    u32(0), // array index
    ...metadata,
    payload
  );
}

function modernTypeNode(name, children = []) {
  return join(
    fstring(name),
    u32(children.length),
    ...children.map((child) => modernTypeNode(child.name, child.children))
  );
}

function modernTag(name, type, payload, options = {}) {
  const flags = options.flags ?? 0;
  return join(
    fstring(name),
    modernTypeNode(type, options.children ?? []),
    u32(payload.length),
    new Uint8Array([flags]),
    payload
  );
}

function legacyFixture() {
  const header = join(
    encoder.encode("GVAS"),
    u32(2),
    u32(522),
    u16(4), u16(27), u16(2),
    u32(0),
    fstring("++UE4+Release-4.27"),
    u32(3),
    u32(0),
    fstring("/Game/Test/SG_Test.SG_Test_C")
  );

  const properties = join(
    legacyTag("PlayerLevel", "IntProperty", intPayload(12)),
    legacyTag("bUnlocked", "BoolProperty", new Uint8Array(), { size: 0, bool: true }),
    legacyTag("PlayerName", "StrProperty", stringPayload("Hero")),
    legacyTag("Inventory", "ArrayProperty", new Uint8Array([1, 2, 3, 4]), {
      innerType: "IntProperty"
    }).slice(0, 0)
  );

  // ArrayProperty has a type-name FString between its tag header and GUID marker.
  const array = join(
    fstring("Inventory"),
    fstring("ArrayProperty"),
    u32(4),
    u32(0),
    fstring("IntProperty"),
    new Uint8Array([0]),
    new Uint8Array([1, 2, 3, 4])
  );

  return join(header, properties, array, fstring("None"), new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]));
}

function modernFixture() {
  const header = join(
    encoder.encode("GVAS"),
    u32(3),
    u32(522),
    u32(1012),
    u16(5), u16(4), u16(4),
    u32(123456),
    fstring("++UE5+Release-5.4"),
    u32(3),
    u32(0),
    fstring("/Game/Test/BP_Save.BP_Save_C"),
    new Uint8Array([0]) // UE 5.4+ property header byte
  );

  const nestedStruct = modernTag(
    "PlayerData",
    "StructProperty",
    new Uint8Array([9, 8, 7, 6]),
    { children: [{ name: "FPlayerData", children: [{ name: "Guid", children: [] }] }] }
  );

  return join(
    header,
    modernTag("PlayerLevel", "IntProperty", intPayload(20)),
    modernTag("bUnlocked", "BoolProperty", new Uint8Array(), { flags: 0x10 }),
    modernTag("PlayerName", "StrProperty", stringPayload("Aster")),
    nestedStruct,
    fstring("None"),
    new Uint8Array([0xde, 0xad, 0xbe, 0xef])
  );
}

test("legacy UE4 GVAS reads typed scalar values and preserves opaque payloads", () => {
  const bytes = legacyFixture();
  const parsed = parseUnrealGvas(bytes);

  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;

  assert.equal(parsed.file.header.engineVersion.startsWith("4.27.2"), true);
  assert.equal(parsed.file.header.propertyLayout, "legacy");
  assert.equal(parsed.file.properties.find((p) => p.name === "PlayerLevel")?.value, 12);
  assert.equal(parsed.file.properties.find((p) => p.name === "bUnlocked")?.value, true);
  assert.equal(parsed.file.properties.find((p) => p.name === "PlayerName")?.value, "Hero");
  assert.equal(parsed.file.trailingBytes, 4);
  assert.equal(parsed.file.properties.find((p) => p.name === "Inventory")?.editable, false);
});

test("UE 5.4+ GVAS reads the new property type tree and boolean flags", () => {
  const parsed = parseUnrealGvas(modernFixture());

  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;

  assert.equal(parsed.file.header.propertyLayout, "ue5.4+");
  assert.equal(parsed.file.properties.find((p) => p.name === "PlayerLevel")?.value, 20);
  assert.equal(parsed.file.properties.find((p) => p.name === "bUnlocked")?.value, true);
  assert.equal(parsed.file.properties.find((p) => p.name === "PlayerName")?.value, "Aster");
  assert.equal(parsed.file.properties.find((p) => p.name === "PlayerData")?.editable, false);
  assert.equal(parsed.file.trailingBytes, 4);
});

test("unchanged GVAS output is byte-exact", () => {
  const bytes = modernFixture();
  const parsed = parseUnrealGvas(bytes);
  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;

  const output = serializeUnrealGvas(bytes, parsed.file, []);
  assert.deepEqual(output, bytes);
});

test("legacy edits preserve the rest of the file and support variable-length FString values", () => {
  const bytes = legacyFixture();
  const parsed = parseUnrealGvas(bytes);
  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;

  const output = serializeUnrealGvas(bytes, parsed.file, [
    { propertyIndex: parsed.file.properties.find((p) => p.name === "PlayerLevel").index, value: 99 },
    { propertyIndex: parsed.file.properties.find((p) => p.name === "bUnlocked").index, value: false },
    { propertyIndex: parsed.file.properties.find((p) => p.name === "PlayerName").index, value: "Longer Hero Name" }
  ]);

  const reparsed = parseUnrealGvas(output);
  assert.equal(reparsed.status, "supported");
  if (reparsed.status !== "supported") return;

  assert.equal(reparsed.file.properties.find((p) => p.name === "PlayerLevel")?.value, 99);
  assert.equal(reparsed.file.properties.find((p) => p.name === "bUnlocked")?.value, false);
  assert.equal(reparsed.file.properties.find((p) => p.name === "PlayerName")?.value, "Longer Hero Name");
  assert.deepEqual(output.subarray(-4), new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]));
});

test("UE 5.4+ edits numeric values and boolean tag flags", () => {
  const bytes = modernFixture();
  const parsed = parseUnrealGvas(bytes);
  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;

  const output = serializeUnrealGvas(bytes, parsed.file, [
    { propertyIndex: 0, value: 77 },
    { propertyIndex: 1, value: false },
    { propertyIndex: 2, value: "New Name" }
  ]);

  const reparsed = parseUnrealGvas(output);
  assert.equal(reparsed.status, "supported");
  if (reparsed.status !== "supported") return;

  assert.equal(reparsed.file.properties[0].value, 77);
  assert.equal(reparsed.file.properties[1].value, false);
  assert.equal(reparsed.file.properties[2].value, "New Name");
});

test("64-bit integers retain exact decimal precision", () => {
  const header = join(
    encoder.encode("GVAS"), u32(2), u32(522),
    u16(4), u16(27), u16(2), u32(0),
    fstring("++UE4+Release-4.27"), u32(3), u32(0),
    fstring("/Game/Test/Save")
  );
  const payload = new Uint8Array(8);
  new DataView(payload.buffer).setBigInt64(0, 9007199254740993n, true);
  const bytes = join(
    header,
    legacyTag("BigCounter", "Int64Property", payload),
    fstring("None")
  );
  const parsed = parseUnrealGvas(bytes);

  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;
  const property = parsed.file.properties[0];
  assert.equal(property.value, "9007199254740993");
  const output = serializeUnrealGvas(bytes, parsed.file, [
    { propertyIndex: property.index, value: "9007199254740995" }
  ]);
  const reparsed = parseUnrealGvas(output);
  assert.equal(reparsed.status, "supported");
  if (reparsed.status === "supported") {
    assert.equal(reparsed.file.properties[0].value, "9007199254740995");
  }
});

test("unsupported GVAS header versions are not guessed", () => {
  const bytes = join(encoder.encode("GVAS"), u32(34), new Uint8Array(64));
  const result = parseUnrealGvas(bytes);
  assert.equal(result.status, "unsupported");
  if (result.status === "unsupported") assert.equal(result.saveGameVersion, 34);
});

test("non-GVAS content is not classified from its filename extension", () => {
  const result = parseUnrealGvas(encoder.encode("not a GVAS file"));
  assert.equal(result.status, "unknown");
});

test("truncated property data fails safely", () => {
  const bytes = modernFixture().subarray(0, 72);
  assert.throws(() => parseUnrealGvas(bytes), UnrealGvasError);
});


function doublePayload(value) {
  const payload = new Uint8Array(8);
  new DataView(payload.buffer).setFloat64(0, value, true);
  return payload;
}

test("Half Sword passport nested doubles are parsed and edited without resizing the struct", () => {
  const header = join(
    encoder.encode("GVAS"),
    u32(3),
    u32(522),
    u32(1012),
    u16(5), u16(4), u16(4),
    u32(123456),
    fstring("++UE5+Release-5.4"),
    u32(3),
    u32(0),
    fstring("/Game/Blueprints/SaveGame/SG_GameProgress.SG_GameProgress_C"),
    new Uint8Array([0])
  );

  const heightName = "Height_21_0EB204DF4978B92AD0ED188FD32EEC7B";
  const weightName = "Weight_23_65E4C6534D14653F96EB739F159E58CD";
  const passportPayload = join(
    modernTag(heightName, "DoubleProperty", doublePayload(1.25)),
    modernTag(weightName, "DoubleProperty", doublePayload(2.5)),
    modernTag("UnknownCounter", "IntProperty", intPayload(42)),
    fstring("None")
  );
  const passport = modernTag(
    "Player Character",
    "StructProperty",
    passportPayload,
    {
      children: [
        { name: "Str_Passport_Character1", children: [{ name: "/Game/Blueprints/Structure/Passports/Str_Passport_Character1", children: [] }] },
        { name: "186c699a-4d6a-f0e8-1522-929b3295615b", children: [] }
      ]
    }
  );
  const funds = modernTag("Player Funds", "IntProperty", intPayload(250));
  const bytes = join(header, passport, funds, fstring("None"));

  const parsed = parseUnrealGvas(bytes);
  assert.equal(parsed.status, "supported");
  if (parsed.status !== "supported") return;

  const height = parsed.file.nestedProperties.find((property) => property.name === heightName);
  const weight = parsed.file.nestedProperties.find((property) => property.name === weightName);
  assert.ok(height);
  assert.ok(weight);
  assert.equal(height.path, "Player Character." + heightName);
  assert.equal(height.value, 1.25);
  assert.equal(weight.value, 2.5);
  assert.equal(parsed.file.properties.find((property) => property.name === "Player Character")?.editable, false);

  const originalStructSize = parsed.file.properties.find((property) => property.name === "Player Character")?.size;
  const output = serializeUnrealGvas(bytes, parsed.file, [
    { propertyIndex: height.index, value: 1.75 },
    { propertyIndex: weight.index, value: 3.25 }
  ]);
  const reparsed = parseUnrealGvas(output);
  assert.equal(reparsed.status, "supported");
  if (reparsed.status !== "supported") return;

  assert.equal(reparsed.file.nestedProperties.find((property) => property.name === heightName)?.value, 1.75);
  assert.equal(reparsed.file.nestedProperties.find((property) => property.name === weightName)?.value, 3.25);
  assert.equal(
    reparsed.file.properties.find((property) => property.name === "Player Character")?.size,
    originalStructSize
  );
  assert.equal(
    reparsed.file.nestedProperties.find((property) => property.name === "UnknownCounter")?.value,
    42
  );
});
