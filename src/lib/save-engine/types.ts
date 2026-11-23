export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RpgMakerFormat = "rpg-maker-mv" | "rpg-maker-mz";
export type SaveKind = "slot" | "global" | "config";
export type SaveEncoding =
  | "lz-string-base64"
  | "zlib-utf8-byte-string"
  | "zlib-binary";

export interface SaveEngineOptions {
  filename?: string;
  maxInputBytes?: number;
  maxDecompressedBytes?: number;
}

export interface SupportedSaveInspection {
  status: "supported";
  format: RpgMakerFormat;
  kind: SaveKind;
  encoding: SaveEncoding;
  data: JsonValue;
  inputBytes: number;
  decompressedBytes: number;
  evidence: string[];
}

export interface UnsupportedSaveInspection {
  status: "unsupported";
  format: "rpg-maker-mz-encrypted";
  reason: string;
  evidence: string[];
}

export interface UnknownSaveInspection {
  status: "unknown";
  format: null;
  reason: string;
  hints: string[];
}

export type SaveFileInspection =
  | SupportedSaveInspection
  | UnsupportedSaveInspection
  | UnknownSaveInspection;

export interface ParsedSaveFile {
  format: RpgMakerFormat;
  kind: SaveKind;
  encoding: SaveEncoding;
  data: JsonValue;
  inputBytes: number;
  decompressedBytes: number;
  evidence: string[];
}
