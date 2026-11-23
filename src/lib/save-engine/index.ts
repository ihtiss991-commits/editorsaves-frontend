import { SaveEngineError } from "./errors.ts";
import { assertInputWithinLimit, resolveSaveEngineLimits } from "./limits.ts";
import { classifyRpgMakerData, parseJsonPayload } from "./json.ts";
import { decodeRpgMakerMv, encodeRpgMakerMv } from "./codecs/rpg-maker-mv.ts";
import { decodeRpgMakerMz, encodeRpgMakerMz } from "./codecs/rpg-maker-mz.ts";
import type {
  JsonValue,
  ParsedSaveFile,
  RpgMakerFormat,
  SaveEngineOptions,
  SaveFileInspection
} from "./types.ts";

function startsWithAscii(input: Uint8Array, prefix: string): boolean {
  if (input.byteLength < prefix.length) return false;

  for (let index = 0; index < prefix.length; index += 1) {
    if (input[index] !== prefix.charCodeAt(index)) return false;
  }

  return true;
}

function parseDecodedJson(text: string, maxBytes: number): JsonValue {
  const actualBytes = new TextEncoder().encode(text).byteLength;
  if (actualBytes > maxBytes) {
    throw new SaveEngineError("DECOMPRESSED_TOO_LARGE", "The decoded JSON exceeds the configured safety limit.");
  }

  try {
    return parseJsonPayload(text);
  } catch {
    throw new SaveEngineError("INVALID_JSON", "The decoded save payload is not valid JSON.");
  }
}

function isLimitOrRuntimeError(error: unknown): boolean {
  return (
    error instanceof SaveEngineError &&
    ["INPUT_TOO_LARGE", "DECOMPRESSED_TOO_LARGE", "CODEC_UNAVAILABLE"].includes(error.code)
  );
}

export async function inspectSaveFile(
  input: Uint8Array,
  options: SaveEngineOptions = {}
): Promise<SaveFileInspection> {
  if (!(input instanceof Uint8Array)) {
    throw new SaveEngineError("INVALID_INPUT", "The save file must be provided as a Uint8Array.");
  }

  const limits = resolveSaveEngineLimits(options);
  assertInputWithinLimit(input, limits.maxInputBytes);

  if (startsWithAscii(input, "MZSEC1:")) {
    return {
      status: "unsupported",
      format: "rpg-maker-mz-encrypted",
      reason: "This file uses an MZSEC1 custom encryption wrapper. Its key and game-specific implementation are not available in this parser.",
      evidence: ["The file begins with the MZSEC1 wrapper marker."]
    };
  }

  try {
    const decoded = await decodeRpgMakerMz(input, limits.maxDecompressedBytes);

    if (decoded) {
      const data = parseDecodedJson(decoded.text, limits.maxDecompressedBytes);
      const kind = classifyRpgMakerData(data, options.filename);

      if (kind) {
        const evidence = [
          "The payload decompresses as a valid zlib stream.",
          "The decompressed payload is valid JSON with a recognised RPG Maker data structure.",
          decoded.encoding === "zlib-utf8-byte-string"
            ? "The compressed bytes were recovered from the UTF-8 byte-string representation."
            : "The input contains a raw zlib byte stream."
        ];

        if (options.filename?.toLowerCase().endsWith(".rmmzsave")) {
          evidence.push("The filename extension is consistent with RPG Maker MZ.");
        }

        return {
          status: "supported",
          format: "rpg-maker-mz",
          kind,
          encoding: decoded.encoding,
          data,
          inputBytes: input.byteLength,
          decompressedBytes: decoded.decompressedBytes,
          evidence
        };
      }
    }
  } catch (error) {
    if (isLimitOrRuntimeError(error)) throw error;
  }

  try {
    const decoded = decodeRpgMakerMv(input, limits.maxDecompressedBytes);

    if (decoded) {
      const data = parseDecodedJson(decoded.text, limits.maxDecompressedBytes);
      const kind = classifyRpgMakerData(data, options.filename);

      if (kind) {
        const evidence = [
          "The payload decompresses with the LZ-String Base64 codec.",
          "The decompressed payload is valid JSON with a recognised RPG Maker data structure."
        ];

        if (options.filename?.toLowerCase().endsWith(".rpgsave")) {
          evidence.push("The filename extension is consistent with RPG Maker MV.");
        }

        return {
          status: "supported",
          format: "rpg-maker-mv",
          kind,
          encoding: "lz-string-base64",
          data,
          inputBytes: input.byteLength,
          decompressedBytes: decoded.decompressedBytes,
          evidence
        };
      }
    }
  } catch (error) {
    if (isLimitOrRuntimeError(error)) throw error;
  }

  const filename = options.filename?.toLowerCase() ?? "";
  const hints: string[] = [];

  if (filename.endsWith(".rpgsave")) {
    hints.push("The filename suggests RPG Maker MV, but the content did not validate as an MV save.");
  }
  if (filename.endsWith(".rmmzsave")) {
    hints.push("The filename suggests RPG Maker MZ, but the content did not validate as an MZ save.");
  }

  return {
    status: "unknown",
    format: null,
    reason: "No supported RPG Maker MV or MZ codec and save-data structure matched this file.",
    hints
  };
}

export async function parseSaveFile(
  input: Uint8Array,
  options: SaveEngineOptions = {}
): Promise<ParsedSaveFile> {
  const inspection = await inspectSaveFile(input, options);

  if (inspection.status === "unsupported") {
    throw new SaveEngineError("UNSUPPORTED_ENCRYPTION", inspection.reason);
  }
  if (inspection.status === "unknown") {
    throw new SaveEngineError("UNKNOWN_FORMAT", inspection.reason);
  }

  return {
    format: inspection.format,
    kind: inspection.kind,
    encoding: inspection.encoding,
    data: inspection.data,
    inputBytes: inspection.inputBytes,
    decompressedBytes: inspection.decompressedBytes,
    evidence: inspection.evidence
  };
}

export async function serializeSaveFile(
  format: RpgMakerFormat,
  data: JsonValue,
  options: Pick<SaveEngineOptions, "maxInputBytes" | "maxDecompressedBytes"> = {}
): Promise<Uint8Array> {
  const limits = resolveSaveEngineLimits(options);
  if (!classifyRpgMakerData(data)) {
    throw new SaveEngineError(
      "INVALID_SAVE_DATA",
      "The data does not match a recognised RPG Maker slot, global, or config structure."
    );
  }

  let jsonText: string;
  try {
    jsonText = JSON.stringify(data);
  } catch {
    throw new SaveEngineError("INVALID_SAVE_DATA", "The save data could not be serialised as JSON.");
  }

  if (typeof jsonText !== "string") {
    throw new SaveEngineError("INVALID_SAVE_DATA", "The save data did not produce a JSON string.");
  }

  const jsonBytes = new TextEncoder().encode(jsonText);
  if (jsonBytes.byteLength > limits.maxDecompressedBytes) {
    throw new SaveEngineError("DECOMPRESSED_TOO_LARGE", "The JSON save data exceeds the configured safety limit.");
  }

  return format === "rpg-maker-mv"
    ? encodeRpgMakerMv(jsonText, limits.maxInputBytes)
    : encodeRpgMakerMz(jsonText, limits.maxDecompressedBytes, limits.maxInputBytes);
}

export { SaveEngineError } from "./errors.ts";
export { DEFAULT_MAX_DECOMPRESSED_BYTES, DEFAULT_MAX_INPUT_BYTES } from "./limits.ts";
export type {
  JsonPrimitive,
  JsonValue,
  ParsedSaveFile,
  RpgMakerFormat,
  SaveEncoding,
  SaveEngineOptions,
  SaveFileInspection,
  SaveKind,
  SupportedSaveInspection,
  UnknownSaveInspection,
  UnsupportedSaveInspection
} from "./types.ts";
