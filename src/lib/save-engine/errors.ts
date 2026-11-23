export type SaveEngineErrorCode =
  | "EMPTY_FILE"
  | "INVALID_INPUT"
  | "INPUT_TOO_LARGE"
  | "DECOMPRESSED_TOO_LARGE"
  | "INVALID_JSON"
  | "INVALID_SAVE_DATA"
  | "UNKNOWN_FORMAT"
  | "UNSUPPORTED_ENCRYPTION"
  | "CODEC_UNAVAILABLE";

export class SaveEngineError extends Error {
  readonly code: SaveEngineErrorCode;

  constructor(code: SaveEngineErrorCode, message: string) {
    super(message);
    this.name = "SaveEngineError";
    this.code = code;
  }
}
