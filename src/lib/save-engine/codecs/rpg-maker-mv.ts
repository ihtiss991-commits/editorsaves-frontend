import * as LZStringModule from "lz-string";
import { SaveEngineError } from "../errors.ts";
import { assertOutputWithinLimit } from "../limits.ts";

const LZString = (
  LZStringModule as unknown as { default?: typeof LZStringModule }
).default ?? LZStringModule;

export interface DecodedMvPayload {
  text: string;
  decompressedBytes: number;
}

const BASE64_PATTERN = /^[A-Za-z0-9+/=\s]+$/;

export function decodeRpgMakerMv(
  input: Uint8Array,
  maxDecompressedBytes: number
): DecodedMvPayload | null {
  let encoded: string;

  try {
    encoded = new TextDecoder("utf-8", { fatal: true })
      .decode(input)
      .replace(/\s+/g, "");
  } catch {
    return null;
  }

  if (!encoded || !BASE64_PATTERN.test(encoded)) return null;

  let text: string | null;
  try {
    text = LZString.decompressFromBase64(encoded);
  } catch {
    return null;
  }

  if (!text) return null;

  const decompressedBytes = new TextEncoder().encode(text).byteLength;
  assertOutputWithinLimit(decompressedBytes, maxDecompressedBytes);

  return { text, decompressedBytes };
}

export function encodeRpgMakerMv(jsonText: string, maxInputBytes: number): Uint8Array {
  const output = new TextEncoder().encode(LZString.compressToBase64(jsonText));

  if (output.byteLength > maxInputBytes) {
    throw new SaveEngineError("INPUT_TOO_LARGE", "The encoded RPG Maker MV save exceeds the configured output limit.");
  }

  return output;
}
