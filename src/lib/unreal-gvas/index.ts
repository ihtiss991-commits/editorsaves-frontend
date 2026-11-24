export type GvasScalar = number | boolean | string;

export interface UnrealGvasHeader {
  saveGameVersion: number;
  packageFileVersionUE4: number;
  packageFileVersionUE5: number | null;
  engineVersion: string;
  engineBranch: string;
  customVersionFormat: number;
  customVersionCount: number;
  saveGameClassName: string;
  propertyLayout: "legacy" | "ue5.4+";
  propertyHeaderByte: number | null;
}

export interface UnrealGvasProperty {
  index: number;
  name: string;
  type: string;
  size: number;
  value: GvasScalar | null;
  displayValue: string;
  editable: boolean;
  editKind: "number" | "boolean" | "text" | null;
  integer: boolean;
  detail: string | null;
}

interface InternalProperty extends UnrealGvasProperty {
  valueOffset: number;
  sizeOffset: number;
  flagsOffset: number | null;
  legacyBoolOffset: number | null;
  stringEncoding: "utf8" | "utf16le" | null;
}

export interface ParsedUnrealGvasFile {
  header: UnrealGvasHeader;
  properties: InternalProperty[];
  fileSize: number;
  trailingBytes: number;
  terminatorEndOffset: number;
}

export type UnrealGvasParseResult =
  | { status: "supported"; file: ParsedUnrealGvasFile }
  | { status: "unsupported"; reason: string; saveGameVersion?: number }
  | { status: "unknown"; reason: string };

export interface UnrealGvasPublicInspection {
  header: UnrealGvasHeader;
  properties: UnrealGvasProperty[];
  fileSize: number;
  trailingBytes: number;
  editablePropertyCount: number;
}

export interface UnrealGvasEdit {
  propertyIndex: number;
  value: GvasScalar;
}

export class UnrealGvasError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "UnrealGvasError";
    this.code = code;
  }
}

const MAGIC = new Uint8Array([0x47, 0x56, 0x41, 0x53]);
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_FSTRING_UNITS = 1_000_000;
const MAX_CUSTOM_VERSIONS = 4096;
const MAX_PROPERTIES = 20_000;
const MAX_PROPERTY_SIZE = 25 * 1024 * 1024;
const MAX_TYPE_DEPTH = 16;
const MAX_TYPE_CHILDREN = 64;
const MAX_OUTPUT_BYTES = 25 * 1024 * 1024;

interface FStringValue {
  value: string;
  encoding: "utf8" | "utf16le";
  start: number;
  end: number;
}

class BinaryReader {
  readonly bytes: Uint8Array;
  readonly view: DataView;
  offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  ensure(length: number, label: string): void {
    if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > this.bytes.byteLength) {
      throw new UnrealGvasError("TRUNCATED_FILE", "The GVAS file is truncated while reading " + label + ".");
    }
  }

  u8(label = "byte"): number {
    this.ensure(1, label);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  u16(label = "uint16"): number {
    this.ensure(2, label);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  u32(label = "uint32"): number {
    this.ensure(4, label);
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  i32(label = "int32"): number {
    this.ensure(4, label);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  bytesOf(length: number, label = "bytes"): Uint8Array {
    this.ensure(length, label);
    const result = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  fstring(label = "FString"): FStringValue {
    const start = this.offset;
    const length = this.i32(label + " length");

    if (length === 0) {
      return { value: "", encoding: "utf8", start, end: this.offset };
    }

    if (Math.abs(length) > MAX_FSTRING_UNITS) {
      throw new UnrealGvasError("STRING_TOO_LARGE", "A GVAS string exceeds the configured safety limit.");
    }

    if (length > 0) {
      const raw = this.bytesOf(length, label);
      if (raw[raw.length - 1] !== 0) {
        throw new UnrealGvasError("INVALID_FSTRING", "A GVAS UTF-8 string is missing its null terminator.");
      }

      let value: string;
      try {
        value = new TextDecoder("utf-8", { fatal: true }).decode(raw.subarray(0, raw.length - 1));
      } catch {
        throw new UnrealGvasError("INVALID_FSTRING", "A GVAS string contains invalid UTF-8 data.");
      }

      return { value, encoding: "utf8", start, end: this.offset };
    }

    const byteLength = -length * 2;
    const raw = this.bytesOf(byteLength, label);
    if (
      raw.length < 2 ||
      raw[raw.length - 1] !== 0 ||
      raw[raw.length - 2] !== 0
    ) {
      throw new UnrealGvasError("INVALID_FSTRING", "A GVAS UTF-16 string is missing its null terminator.");
    }

    let value: string;
    try {
      value = new TextDecoder("utf-16le", { fatal: true }).decode(raw.subarray(0, raw.length - 2));
    } catch {
      throw new UnrealGvasError("INVALID_FSTRING", "A GVAS string contains invalid UTF-16 data.");
    }

    return { value, encoding: "utf16le", start, end: this.offset };
  }
}

function bytesEqualAt(bytes: Uint8Array, expected: Uint8Array): boolean {
  if (bytes.byteLength < expected.byteLength) return false;
  for (let index = 0; index < expected.byteLength; index += 1) {
    if (bytes[index] !== expected[index]) return false;
  }
  return true;
}

function hex(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) result += byte.toString(16).padStart(2, "0");
  return result;
}

function parseHeader(reader: BinaryReader): {
  header: UnrealGvasHeader;
  propertyStart: number;
} {
  reader.bytesOf(4, "GVAS signature");

  const saveGameVersion = reader.u32("save game file version");
  if (saveGameVersion !== 2 && saveGameVersion !== 3) {
    throw new UnrealGvasError(
      "UNSUPPORTED_SAVE_VERSION",
      "This GVAS file uses save-game header version " + saveGameVersion +
        ". This editor has validated header versions 2 and 3 only."
    );
  }

  const packageFileVersionUE4 = reader.u32("UE4 package file version");
  const packageFileVersionUE5 = saveGameVersion === 3
    ? reader.u32("UE5 package file version")
    : null;

  const engineMajor = reader.u16("engine major version");
  const engineMinor = reader.u16("engine minor version");
  const enginePatch = reader.u16("engine patch version");
  const engineBuild = reader.u32("engine changelist");
  const branch = reader.fstring("engine branch").value;

  const customVersionFormat = reader.u32("custom version format");
  if (customVersionFormat !== 3) {
    throw new UnrealGvasError(
      "UNSUPPORTED_CUSTOM_VERSION_FORMAT",
      "This GVAS file uses custom-version format " + customVersionFormat +
        ". Only format 3 has been validated."
    );
  }

  const customVersionCount = reader.u32("custom version count");
  if (customVersionCount > MAX_CUSTOM_VERSIONS) {
    throw new UnrealGvasError("INVALID_HEADER", "The custom-version table exceeds the safety limit.");
  }

  for (let index = 0; index < customVersionCount; index += 1) {
    reader.bytesOf(16, "custom version GUID");
    reader.i32("custom version value");
  }

  const saveGameClassName = reader.fstring("save game class name").value;
  const modern = engineMajor === 5 && engineMinor >= 4;
  let propertyHeaderByte: number | null = null;

  if (modern) {
    propertyHeaderByte = reader.u8("UE 5.4+ property header byte");
  }

  return {
    header: {
      saveGameVersion,
      packageFileVersionUE4,
      packageFileVersionUE5,
      engineVersion: engineMajor + "." + engineMinor + "." + enginePatch + " (" + engineBuild + ")",
      engineBranch: branch,
      customVersionFormat,
      customVersionCount,
      saveGameClassName,
      propertyLayout: modern ? "ue5.4+" : "legacy",
      propertyHeaderByte
    },
    propertyStart: reader.offset
  };
}

interface TypeTreeNode {
  name: string;
  children: TypeTreeNode[];
}

function readTypeTree(reader: BinaryReader, depth: number, budget: { count: number }): TypeTreeNode {
  if (depth > MAX_TYPE_DEPTH) {
    throw new UnrealGvasError("TYPE_TREE_TOO_DEEP", "A GVAS property type tree exceeds the nesting limit.");
  }

  budget.count += 1;
  if (budget.count > MAX_PROPERTIES * 4) {
    throw new UnrealGvasError("TYPE_TREE_TOO_LARGE", "A GVAS property type tree exceeds the node limit.");
  }

  const name = reader.fstring("property type name").value;
  const childCount = reader.u32("property type child count");

  if (childCount > MAX_TYPE_CHILDREN) {
    throw new UnrealGvasError("TYPE_TREE_TOO_LARGE", "A GVAS property type has too many children.");
  }

  const children: TypeTreeNode[] = [];
  for (let index = 0; index < childCount; index += 1) {
    children.push(readTypeTree(reader, depth + 1, budget));
  }

  return { name, children };
}

function typeTreeDescription(node: TypeTreeNode): string | null {
  if (node.children.length === 0) return null;
  const values: string[] = [];

  const visit = (child: TypeTreeNode): void => {
    values.push(child.name);
    for (const nested of child.children) visit(nested);
  };

  for (const child of node.children) visit(child);
  return values.slice(0, 12).join(" → ");
}

function parseLegacyTag(reader: BinaryReader, index: number, name: string): InternalProperty {
  const type = reader.fstring("property type").value;
  if (!type) throw new UnrealGvasError("INVALID_PROPERTY_TAG", "A GVAS property has an empty type name.");

  const sizeOffset = reader.offset;
  const size = reader.u32("property payload size");
  if (size > MAX_PROPERTY_SIZE) {
    throw new UnrealGvasError("PROPERTY_TOO_LARGE", "A GVAS property exceeds the configured size limit.");
  }

  reader.u32("property array index");

  let detail: string | null = null;
  let legacyBoolOffset: number | null = null;
  let legacyBoolValue: boolean | null = null;

  if (type === "StructProperty") {
    const structName = reader.fstring("struct type name").value;
    reader.bytesOf(16, "struct type GUID");
    detail = "Struct: " + structName;
  } else if (type === "ArrayProperty" || type === "SetProperty") {
    const innerType = reader.fstring("container inner type").value;
    detail = "Element type: " + innerType;
  } else if (type === "MapProperty") {
    const keyType = reader.fstring("map key type").value;
    const valueType = reader.fstring("map value type").value;
    detail = "Key: " + keyType + "; value: " + valueType;
  } else if (type === "ByteProperty" || type === "EnumProperty") {
    const enumName = reader.fstring("enum type name").value;
    if (enumName) detail = "Enum: " + enumName;
  }

  if (type === "BoolProperty") {
    legacyBoolOffset = reader.offset;
    legacyBoolValue = reader.u8("boolean property value") !== 0;
  }

  const hasPropertyGuid = reader.u8("property GUID marker");
  if (hasPropertyGuid !== 0 && hasPropertyGuid !== 1) {
    throw new UnrealGvasError("INVALID_PROPERTY_TAG", "A legacy GVAS property has an invalid GUID marker.");
  }
  if (hasPropertyGuid === 1) reader.bytesOf(16, "property GUID");

  const valueOffset = reader.offset;
  reader.bytesOf(size, "property payload");

  const decoded = decodePropertyValue(
    reader.bytes,
    type,
    size,
    valueOffset,
    false,
    null,
    legacyBoolValue
  );

  return {
    index,
    name,
    type,
    size,
    value: decoded.value,
    displayValue: decoded.displayValue,
    editable: decoded.editable,
    editKind: decoded.editKind,
    integer: decoded.integer,
    detail: detail ?? decoded.detail,
    valueOffset,
    sizeOffset,
    flagsOffset: null,
    legacyBoolOffset,
    stringEncoding: decoded.stringEncoding
  };
}

function parseModernTag(reader: BinaryReader, index: number, name: string): InternalProperty {
  const tree = readTypeTree(reader, 0, { count: 0 });
  const type = tree.name;

  const sizeOffset = reader.offset;
  const size = reader.u32("property payload size");
  if (size > MAX_PROPERTY_SIZE) {
    throw new UnrealGvasError("PROPERTY_TOO_LARGE", "A GVAS property exceeds the configured size limit.");
  }

  const flagsOffset = reader.offset;
  const flags = reader.u8("property tag flags");

  if ((flags & 0xe0) !== 0) {
    throw new UnrealGvasError("UNSUPPORTED_PROPERTY_FLAGS", "A UE 5.4+ property uses unknown tag flags.");
  }
  if ((flags & 0x04) !== 0) {
    throw new UnrealGvasError(
      "UNSUPPORTED_PROPERTY_EXTENSIONS",
      "This UE 5.4+ property uses tag extensions that this beta does not yet decode."
    );
  }

  if ((flags & 0x01) !== 0) reader.i32("property array index");
  if ((flags & 0x02) !== 0) reader.bytesOf(16, "property GUID");

  const valueOffset = reader.offset;
  reader.bytesOf(size, "property payload");

  let detail = typeTreeDescription(tree);
  if ((flags & 0x08) !== 0) {
    detail = detail
      ? detail + "; native/binary payload"
      : "Native/binary payload";
  }

  const decoded = decodePropertyValue(
    reader.bytes,
    type,
    size,
    valueOffset,
    true,
    flags,
    null,
    (flags & 0x08) !== 0
  );

  return {
    index,
    name,
    type,
    size,
    value: decoded.value,
    displayValue: decoded.displayValue,
    editable: decoded.editable,
    editKind: decoded.editKind,
    integer: decoded.integer,
    detail: detail ?? decoded.detail,
    valueOffset,
    sizeOffset,
    flagsOffset,
    legacyBoolOffset: null,
    stringEncoding: decoded.stringEncoding
  };
}

function numericKind(type: string): {
  bytes: number;
  integer: boolean;
  signed: boolean;
  big: boolean;
} | null {
  switch (type) {
    case "Int8Property": return { bytes: 1, integer: true, signed: true, big: false };
    case "UInt8Property": return { bytes: 1, integer: true, signed: false, big: false };
    case "Int16Property": return { bytes: 2, integer: true, signed: true, big: false };
    case "UInt16Property": return { bytes: 2, integer: true, signed: false, big: false };
    case "IntProperty":
    case "Int32Property": return { bytes: 4, integer: true, signed: true, big: false };
    case "UInt32Property": return { bytes: 4, integer: true, signed: false, big: false };
    case "Int64Property": return { bytes: 8, integer: true, signed: true, big: true };
    case "UInt64Property": return { bytes: 8, integer: true, signed: false, big: true };
    case "FloatProperty": return { bytes: 4, integer: false, signed: true, big: false };
    case "DoubleProperty": return { bytes: 8, integer: false, signed: true, big: false };
    default: return null;
  }
}

interface DecodedProperty {
  value: GvasScalar | null;
  displayValue: string;
  editable: boolean;
  editKind: "number" | "boolean" | "text" | null;
  integer: boolean;
  detail: string | null;
  stringEncoding: "utf8" | "utf16le" | null;
}

function decodePropertyValue(
  bytes: Uint8Array,
  type: string,
  size: number,
  valueOffset: number,
  modern: boolean,
  flags: number | null,
  legacyBoolValue: boolean | null,
  nativeBinary = false
): DecodedProperty {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (type === "BoolProperty") {
    if (size === 0 && modern && flags !== null) {
      const value = (flags & 0x10) !== 0;
      return {
        value,
        displayValue: value ? "true" : "false",
        editable: !nativeBinary,
        editKind: nativeBinary ? null : "boolean",
        integer: false,
        detail: nativeBinary ? "Native boolean payload is read-only." : null,
        stringEncoding: null
      };
    }
    if (size === 0 && !modern && legacyBoolValue !== null) {
      return {
        value: legacyBoolValue,
        displayValue: legacyBoolValue ? "true" : "false",
        editable: true,
        editKind: "boolean",
        integer: false,
        detail: null,
        stringEncoding: null
      };
    }
    if (size === 1 && !modern) {
      const value = bytes[valueOffset] !== 0;
      return {
        value,
        displayValue: value ? "true" : "false",
        editable: !nativeBinary,
        editKind: nativeBinary ? null : "boolean",
        integer: false,
        detail: nativeBinary ? "Native boolean payload is read-only." : null,
        stringEncoding: null
      };
    }
    return readOnlyValue(type, size, "Boolean property uses an unrecognized serialized representation.");
  }

  if (nativeBinary) {
    return readOnlyValue(type, size, "Native/binary payload is preserved but not decoded.");
  }

  const numeric = numericKind(type);
  if (numeric) {
    if (size !== numeric.bytes) {
      return readOnlyValue(type, size, "Payload size does not match the declared scalar type.");
    }

    let value: number | string;
    if (numeric.big) {
      value = (numeric.signed ? view.getBigInt64(valueOffset, true) : view.getBigUint64(valueOffset, true)).toString();
      return {
        value,
        displayValue: value,
        editable: true,
        editKind: "text",
        integer: true,
        detail: "64-bit integer is represented as decimal text to avoid JavaScript precision loss.",
        stringEncoding: null
      };
    }

    switch (type) {
      case "Int8Property": value = view.getInt8(valueOffset); break;
      case "UInt8Property": value = view.getUint8(valueOffset); break;
      case "Int16Property": value = view.getInt16(valueOffset, true); break;
      case "UInt16Property": value = view.getUint16(valueOffset, true); break;
      case "IntProperty":
      case "Int32Property": value = view.getInt32(valueOffset, true); break;
      case "UInt32Property": value = view.getUint32(valueOffset, true); break;
      case "FloatProperty": value = view.getFloat32(valueOffset, true); break;
      case "DoubleProperty": value = view.getFloat64(valueOffset, true); break;
      default: return readOnlyValue(type, size, "Scalar type is not supported for editing.");
    }

    if (!Number.isFinite(value)) {
      return readOnlyValue(type, size, "Non-finite numeric values are preserved but not editable.");
    }

    return {
      value,
      displayValue: String(value),
      editable: true,
      editKind: "number",
      integer: numeric.integer,
      detail: null,
      stringEncoding: null
    };
  }

  if (type === "StrProperty") {
    try {
      const reader = new BinaryReader(bytes);
      reader.offset = valueOffset;
      const text = reader.fstring("string property");
      if (reader.offset !== valueOffset + size) {
        return readOnlyValue(type, size, "String payload contains trailing data and is read-only.");
      }
      return {
        value: text.value,
        displayValue: text.value.length > 180 ? text.value.slice(0, 177) + "..." : text.value,
        editable: true,
        editKind: "text",
        integer: false,
        detail: null,
        stringEncoding: text.encoding
      };
    } catch {
      return readOnlyValue(type, size, "String payload could not be safely decoded.");
    }
  }

  if (type === "ByteProperty" && size === 1) {
    return {
      value: bytes[valueOffset],
      displayValue: String(bytes[valueOffset]),
      editable: false,
      editKind: null,
      integer: true,
      detail: "Byte properties may represent enumerations; editing is disabled until the enum mapping is known.",
      stringEncoding: null
    };
  }

  return readOnlyValue(type, size, null);
}

function readOnlyValue(type: string, size: number, detail: string | null): DecodedProperty {
  return {
    value: null,
    displayValue: size === 0
      ? "Structured value"
      : size + " bytes · preserved without decoding",
    editable: false,
    editKind: null,
    integer: false,
    detail: detail ?? "Nested or game-specific property is preserved as raw bytes.",
    stringEncoding: null
  };
}

function parsePropertyStream(
  reader: BinaryReader,
  modern: boolean
): { properties: InternalProperty[]; terminatorEndOffset: number } {
  const properties: InternalProperty[] = [];

  for (let index = 0; index < MAX_PROPERTIES; index += 1) {
    const name = reader.fstring("property name").value;

    if (name === "None") {
      return {
        properties,
        terminatorEndOffset: reader.offset
      };
    }
    if (!name) {
      throw new UnrealGvasError("INVALID_PROPERTY_TAG", "The GVAS property stream contains an empty property name.");
    }

    const property = modern
      ? parseModernTag(reader, index, name)
      : parseLegacyTag(reader, index, name);

    properties.push(property);
  }

  throw new UnrealGvasError("TOO_MANY_PROPERTIES", "The GVAS file exceeds the property-count safety limit.");
}

export function parseUnrealGvas(input: Uint8Array): UnrealGvasParseResult {
  if (!(input instanceof Uint8Array)) {
    throw new UnrealGvasError("INVALID_INPUT", "The GVAS input must be a Uint8Array.");
  }
  if (input.byteLength === 0) {
    throw new UnrealGvasError("EMPTY_FILE", "The selected file is empty.");
  }
  if (input.byteLength > MAX_INPUT_BYTES) {
    throw new UnrealGvasError("INPUT_TOO_LARGE", "The GVAS file exceeds the 25 MB editor limit.");
  }
  if (!bytesEqualAt(input, MAGIC)) {
    return {
      status: "unknown",
      reason: "This file does not begin with the raw GVAS signature. Compressed, encrypted and game-wrapped saves are not supported by this beta."
    };
  }

  try {
    const reader = new BinaryReader(input);
    const parsedHeader = parseHeader(reader);
    const modern = parsedHeader.header.propertyLayout === "ue5.4+";
    const parsedStream = parsePropertyStream(reader, modern);

    return {
      status: "supported",
      file: {
        header: parsedHeader.header,
        properties: parsedStream.properties,
        fileSize: input.byteLength,
        trailingBytes: input.byteLength - parsedStream.terminatorEndOffset,
        terminatorEndOffset: parsedStream.terminatorEndOffset
      }
    };
  } catch (error) {
    if (error instanceof UnrealGvasError && error.code === "UNSUPPORTED_SAVE_VERSION") {
      const version = new DataView(input.buffer, input.byteOffset, input.byteLength).getUint32(4, true);
      return {
        status: "unsupported",
        reason: error.message,
        saveGameVersion: version
      };
    }
    if (error instanceof UnrealGvasError && error.code === "UNSUPPORTED_CUSTOM_VERSION_FORMAT") {
      return { status: "unsupported", reason: error.message };
    }
    if (error instanceof UnrealGvasError && error.code === "UNSUPPORTED_PROPERTY_EXTENSIONS") {
      return { status: "unsupported", reason: error.message };
    }
    throw error;
  }
}

export function toPublicUnrealGvasInspection(file: ParsedUnrealGvasFile): UnrealGvasPublicInspection {
  const properties: UnrealGvasProperty[] = file.properties.map((property) => ({
    index: property.index,
    name: property.name,
    type: property.type,
    size: property.size,
    value: property.value,
    displayValue: property.displayValue,
    editable: property.editable,
    editKind: property.editKind,
    integer: property.integer,
    detail: property.detail
  }));

  return {
    header: file.header,
    properties,
    fileSize: file.fileSize,
    trailingBytes: file.trailingBytes,
    editablePropertyCount: properties.filter((property) => property.editable).length
  };
}

function encodeFString(value: string, encoding: "utf8" | "utf16le"): Uint8Array {
  if (value.includes("\u0000")) {
    throw new UnrealGvasError("INVALID_EDIT", "String values cannot contain null characters.");
  }
  if (value.length > 16_000) {
    throw new UnrealGvasError("INVALID_EDIT", "String values are limited to 16,000 characters.");
  }

  let payload: Uint8Array;
  let length: number;

  if (encoding === "utf16le") {
    length = -(value.length + 1);
    payload = new Uint8Array((value.length + 1) * 2);
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      payload[index * 2] = code & 0xff;
      payload[index * 2 + 1] = code >>> 8;
    }
  } else {
    const text = new TextEncoder().encode(value);
    payload = new Uint8Array(text.byteLength + 1);
    payload.set(text, 0);
    length = payload.byteLength;
  }

  const output = new Uint8Array(4 + payload.byteLength);
  new DataView(output.buffer).setInt32(0, length, true);
  output.set(payload, 4);
  return output;
}

function integerBounds(type: string): { min: bigint; max: bigint } | null {
  switch (type) {
    case "Int8Property": return { min: BigInt("-128"), max: BigInt("127") };
    case "UInt8Property": return { min: BigInt("0"), max: BigInt("255") };
    case "Int16Property": return { min: BigInt("-32768"), max: BigInt("32767") };
    case "UInt16Property": return { min: BigInt("0"), max: BigInt("65535") };
    case "IntProperty":
    case "Int32Property": return { min: BigInt("-2147483648"), max: BigInt("2147483647") };
    case "UInt32Property": return { min: BigInt("0"), max: BigInt("4294967295") };
    case "Int64Property": return { min: BigInt("-9223372036854775808"), max: BigInt("9223372036854775807") };
    case "UInt64Property": return { min: BigInt("0"), max: BigInt("18446744073709551615") };
    default: return null;
  }
}

function encodeNumeric(type: string, value: GvasScalar): Uint8Array {
  const kind = numericKind(type);
  if (!kind) throw new UnrealGvasError("INVALID_EDIT", "This GVAS property type is not editable as a number.");

  if (kind.integer) {
    let integer: bigint;
    try {
      if (kind.big) {
        if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
          throw new Error("invalid integer text");
        }
        integer = BigInt(value);
      } else {
        if (typeof value !== "number" || !Number.isSafeInteger(value)) {
          throw new Error("invalid safe integer");
        }
        integer = BigInt(value);
      }
    } catch {
      throw new UnrealGvasError("INVALID_EDIT", "Enter a valid whole number for this GVAS property.");
    }

    const bounds = integerBounds(type);
    if (bounds && (integer < bounds.min || integer > bounds.max)) {
      throw new UnrealGvasError("INVALID_EDIT", "The number is outside the range of " + type + ".");
    }

    const output = new Uint8Array(kind.bytes);
    const view = new DataView(output.buffer);

    switch (type) {
      case "Int8Property": view.setInt8(0, Number(integer)); break;
      case "UInt8Property": view.setUint8(0, Number(integer)); break;
      case "Int16Property": view.setInt16(0, Number(integer), true); break;
      case "UInt16Property": view.setUint16(0, Number(integer), true); break;
      case "IntProperty":
      case "Int32Property": view.setInt32(0, Number(integer), true); break;
      case "UInt32Property": view.setUint32(0, Number(integer), true); break;
      case "Int64Property": view.setBigInt64(0, integer, true); break;
      case "UInt64Property": view.setBigUint64(0, integer, true); break;
    }

    return output;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new UnrealGvasError("INVALID_EDIT", "Enter a finite numeric value.");
  }

  const output = new Uint8Array(kind.bytes);
  const view = new DataView(output.buffer);

  if (type === "FloatProperty") {
    view.setFloat32(0, value, true);
    if (!Number.isFinite(view.getFloat32(0, true))) {
      throw new UnrealGvasError("INVALID_EDIT", "The number is outside the range of a 32-bit float.");
    }
  } else {
    view.setFloat64(0, value, true);
  }

  return output;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  if (total > MAX_OUTPUT_BYTES) {
    throw new UnrealGvasError("OUTPUT_TOO_LARGE", "The edited GVAS output exceeds the 25 MB editor limit.");
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

export function serializeUnrealGvas(
  original: Uint8Array,
  file: ParsedUnrealGvasFile,
  edits: UnrealGvasEdit[]
): Uint8Array {
  if (edits.length === 0) return original.slice();

  const seen = new Set<number>();
  const patches: Array<{
    start: number;
    end: number;
    bytes: Uint8Array;
    sizeOffset?: number;
    flagsOffset?: number;
    boolFlags?: number;
  }> = [];

  for (const edit of edits) {
    if (!Number.isSafeInteger(edit.propertyIndex) || seen.has(edit.propertyIndex)) {
      throw new UnrealGvasError("INVALID_EDIT", "The edit list contains an invalid or duplicate property index.");
    }
    seen.add(edit.propertyIndex);

    const property = file.properties.find((item) => item.index === edit.propertyIndex);
    if (!property || !property.editable || !property.editKind) {
      throw new UnrealGvasError("INVALID_EDIT", "One of the selected GVAS properties is read-only.");
    }

    if (property.editKind === "boolean") {
      if (typeof edit.value !== "boolean") {
        throw new UnrealGvasError("INVALID_EDIT", "Boolean GVAS properties require true or false.");
      }

      if (file.header.propertyLayout === "ue5.4+") {
        if (property.flagsOffset === null) {
          throw new UnrealGvasError("INVALID_EDIT", "The property flags required for this boolean are missing.");
        }
        const currentFlags = original[property.flagsOffset];
        const nextFlags = edit.value ? (currentFlags | 0x10) : (currentFlags & ~0x10);
        patches.push({
          start: property.flagsOffset,
          end: property.flagsOffset + 1,
          bytes: new Uint8Array([nextFlags])
        });
      } else {
        if (property.legacyBoolOffset === null) {
          throw new UnrealGvasError("INVALID_EDIT", "The legacy boolean value offset is missing.");
        }
        patches.push({
          start: property.legacyBoolOffset,
          end: property.legacyBoolOffset + 1,
          bytes: new Uint8Array([edit.value ? 1 : 0])
        });
      }
      continue;
    }

    if (property.type === "StrProperty") {
      if (typeof edit.value !== "string" || property.stringEncoding === null) {
        throw new UnrealGvasError("INVALID_EDIT", "String GVAS properties require text values.");
      }
      const encoded = encodeFString(edit.value, property.stringEncoding);
      patches.push({
        start: property.valueOffset,
        end: property.valueOffset + property.size,
        bytes: encoded,
        sizeOffset: property.sizeOffset
      });
      continue;
    }

    if (property.editKind === "number" || property.editKind === "text") {
      const encoded = encodeNumeric(property.type, edit.value);
      if (encoded.byteLength !== property.size) {
        throw new UnrealGvasError("INVALID_EDIT", "The numeric property size changed unexpectedly.");
      }
      patches.push({
        start: property.valueOffset,
        end: property.valueOffset + property.size,
        bytes: encoded
      });
      continue;
    }

    throw new UnrealGvasError("INVALID_EDIT", "The selected GVAS property type cannot be edited.");
  }

  patches.sort((a, b) => b.start - a.start);

  let output = original.slice();
  for (const patch of patches) {
    if (patch.start < 0 || patch.end < patch.start || patch.end > output.byteLength) {
      throw new UnrealGvasError("INVALID_EDIT", "A GVAS property edit points outside the original file.");
    }

    if (patch.start === patch.end) {
      const next = output.slice();
      next.set(patch.bytes, patch.start);
      output = next;
    } else {
      output = concatBytes([
        output.subarray(0, patch.start),
        patch.bytes,
        output.subarray(patch.end)
      ]);
    }

    if (patch.sizeOffset !== undefined) {
      new DataView(output.buffer, output.byteOffset, output.byteLength)
        .setUint32(patch.sizeOffset, patch.bytes.byteLength, true);
    }
  }

  if (output.byteLength > MAX_OUTPUT_BYTES) {
    throw new UnrealGvasError("OUTPUT_TOO_LARGE", "The edited GVAS output exceeds the 25 MB editor limit.");
  }

  const reparsed = parseUnrealGvas(output);
  if (reparsed.status !== "supported") {
    throw new UnrealGvasError("SERIALIZATION_FAILED", "The edited GVAS file failed its structural verification.");
  }

  for (const edit of edits) {
    const updated = reparsed.file.properties.find((item) => item.index === edit.propertyIndex);
    const expectedValue = updated?.type === "FloatProperty" && typeof edit.value === "number"
      ? Math.fround(edit.value)
      : edit.value;
    if (!updated || updated.value !== expectedValue) {
      throw new UnrealGvasError("SERIALIZATION_FAILED", "The edited GVAS value did not survive the verification pass.");
    }
  }

  return output;
}

export function summarizeUnrealGvasError(error: unknown): string {
  if (error instanceof UnrealGvasError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "The GVAS file could not be processed safely.";
}
