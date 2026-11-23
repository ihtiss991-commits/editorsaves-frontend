import { SaveEngineError } from "./errors.ts";
import type { SaveEngineOptions } from "./types.ts";

export const DEFAULT_MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const DEFAULT_MAX_DECOMPRESSED_BYTES = 64 * 1024 * 1024;

export interface ResolvedSaveEngineLimits {
  maxInputBytes: number;
  maxDecompressedBytes: number;
}

export function resolveSaveEngineLimits(
  options: Pick<SaveEngineOptions, "maxInputBytes" | "maxDecompressedBytes"> = {}
): ResolvedSaveEngineLimits {
  const maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
  const maxDecompressedBytes =
    options.maxDecompressedBytes ?? DEFAULT_MAX_DECOMPRESSED_BYTES;

  if (!Number.isSafeInteger(maxInputBytes) || maxInputBytes <= 0) {
    throw new SaveEngineError("INVALID_INPUT", "The maximum input size must be a positive safe integer.");
  }

  if (!Number.isSafeInteger(maxDecompressedBytes) || maxDecompressedBytes <= 0) {
    throw new SaveEngineError("INVALID_INPUT", "The maximum decompressed size must be a positive safe integer.");
  }

  return { maxInputBytes, maxDecompressedBytes };
}

export function assertInputWithinLimit(input: Uint8Array, maxInputBytes: number): void {
  if (input.byteLength === 0) {
    throw new SaveEngineError("EMPTY_FILE", "The selected save file is empty.");
  }

  if (input.byteLength > maxInputBytes) {
    throw new SaveEngineError("INPUT_TOO_LARGE", "The file exceeds the configured save-file size limit.");
  }
}

export function assertOutputWithinLimit(byteLength: number, maxBytes: number): void {
  if (byteLength > maxBytes) {
    throw new SaveEngineError(
      "DECOMPRESSED_TOO_LARGE",
      "The decoded save data exceeds the configured safety limit."
    );
  }
}
