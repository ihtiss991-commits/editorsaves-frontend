import { SaveEngineError } from "../errors.ts";
import { assertOutputWithinLimit } from "../limits.ts";

export type MzByteEncoding = "zlib-utf8-byte-string" | "zlib-binary";

export interface DecodedMzPayload {
  text: string;
  decompressedBytes: number;
  encoding: MzByteEncoding;
}

function isZlibHeader(input: Uint8Array): boolean {
  if (input.byteLength < 2) return false;
  const cmf = input[0];
  const flg = input[1];

  return (
    (cmf & 0x0f) === 8 &&
    (cmf >>> 4) <= 7 &&
    (((cmf << 8) | flg) % 31) === 0
  );
}

function recoverUtf8ByteString(input: Uint8Array): Uint8Array | null {
  let text: string;

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input);
  } catch {
    return null;
  }

  const recovered = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code > 0xff) return null;
    recovered[index] = code;
  }

  return recovered;
}

function streamFromBytes(input: Uint8Array): ReadableStream<Uint8Array> {
  const buffer = input.slice().buffer as ArrayBuffer;
  return new Blob([buffer]).stream() as ReadableStream<Uint8Array>;
}

async function collectLimited(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      assertOutputWithinLimit(totalBytes, maxBytes);
      chunks.push(value);
    }
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {
      // Ignore cancellation errors after an underlying decompression failure.
    }
    throw error;
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

async function transformZlib(
  input: Uint8Array,
  mode: "compress" | "decompress",
  maxBytes: number
): Promise<Uint8Array> {
  if (mode === "compress") {
    if (typeof CompressionStream === "undefined") {
      throw new SaveEngineError(
        "CODEC_UNAVAILABLE",
        "This runtime does not provide the required zlib compression API."
      );
    }

    const transform = new CompressionStream("deflate") as unknown as TransformStream<
      Uint8Array,
      Uint8Array
    >;
    const stream = streamFromBytes(input).pipeThrough(transform);
    return collectLimited(stream, maxBytes);
  }

  if (typeof DecompressionStream === "undefined") {
    throw new SaveEngineError(
      "CODEC_UNAVAILABLE",
      "This runtime does not provide the required zlib decompression API."
    );
  }

  const transform = new DecompressionStream("deflate") as unknown as TransformStream<
    Uint8Array,
    Uint8Array
  >;
  const stream = streamFromBytes(input).pipeThrough(transform);
  return collectLimited(stream, maxBytes);
}

function encodeZlibBytesAsUtf8ByteString(compressed: Uint8Array): Uint8Array {
  const parts: string[] = [];
  const chunkSize = 0x4000;

  for (let offset = 0; offset < compressed.byteLength; offset += chunkSize) {
    const chunk = compressed.subarray(offset, Math.min(offset + chunkSize, compressed.byteLength));
    parts.push(String.fromCharCode(...chunk));
  }

  return new TextEncoder().encode(parts.join(""));
}

export async function decodeRpgMakerMz(
  input: Uint8Array,
  maxDecompressedBytes: number
): Promise<DecodedMzPayload | null> {
  const candidates: Array<{ bytes: Uint8Array; encoding: MzByteEncoding }> = [];

  if (isZlibHeader(input)) {
    candidates.push({ bytes: input, encoding: "zlib-binary" });
  }

  const recovered = recoverUtf8ByteString(input);
  if (recovered && isZlibHeader(recovered)) {
    candidates.push({ bytes: recovered, encoding: "zlib-utf8-byte-string" });
  }

  for (const candidate of candidates) {
    try {
      const decompressed = await transformZlib(
        candidate.bytes,
        "decompress",
        maxDecompressedBytes
      );
      const text = new TextDecoder("utf-8", { fatal: true }).decode(decompressed);

      return {
        text,
        decompressedBytes: decompressed.byteLength,
        encoding: candidate.encoding
      };
    } catch (error) {
      if (
        error instanceof SaveEngineError &&
        (error.code === "DECOMPRESSED_TOO_LARGE" || error.code === "CODEC_UNAVAILABLE")
      ) {
        throw error;
      }
    }
  }

  return null;
}

export async function encodeRpgMakerMz(
  jsonText: string,
  maxDecompressedBytes: number,
  maxInputBytes: number
): Promise<Uint8Array> {
  const jsonBytes = new TextEncoder().encode(jsonText);
  assertOutputWithinLimit(jsonBytes.byteLength, maxDecompressedBytes);

  const compressed = await transformZlib(jsonBytes, "compress", maxInputBytes);
  const output = encodeZlibBytesAsUtf8ByteString(compressed);

  if (output.byteLength > maxInputBytes) {
    throw new SaveEngineError("INPUT_TOO_LARGE", "The encoded RPG Maker MZ save exceeds the configured output limit.");
  }

  return output;
}
