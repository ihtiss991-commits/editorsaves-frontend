import {
  parseUnrealGvas,
  serializeUnrealGvas,
  summarizeUnrealGvasError,
  toPublicUnrealGvasInspection,
  type ParsedUnrealGvasFile,
  type UnrealGvasEdit,
  type UnrealGvasPublicInspection
} from "../lib/unreal-gvas/index.ts";

type Request =
  | { id: number; action: "inspect"; filename: string; buffer: ArrayBuffer }
  | { id: number; action: "serialize"; edits: UnrealGvasEdit[] };

type Reply =
  | { id: number; action: "inspect"; status: "supported"; inspection: UnrealGvasPublicInspection }
  | { id: number; action: "inspect"; status: "unsupported"; reason: string; saveGameVersion?: number }
  | { id: number; action: "inspect"; status: "unknown"; reason: string }
  | { id: number; action: "serialize"; buffer: ArrayBuffer }
  | { id: number; action: "error"; message: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<Request>) => void) | null;
  postMessage(message: Reply, transfer?: Transferable[]): void;
};

let sourceBytes: Uint8Array | null = null;
let parsedFile: ParsedUnrealGvasFile | null = null;

workerScope.onmessage = async (event) => {
  const request = event.data;

  try {
    if (request.action === "inspect") {
      sourceBytes = new Uint8Array(request.buffer);
      parsedFile = null;

      const result = parseUnrealGvas(sourceBytes);
      if (result.status === "supported") {
        parsedFile = result.file;
        workerScope.postMessage({
          id: request.id,
          action: "inspect",
          status: "supported",
          inspection: toPublicUnrealGvasInspection(result.file)
        });
        return;
      }

      sourceBytes = null;
      workerScope.postMessage({
        id: request.id,
        action: "inspect",
        status: result.status,
        reason: result.reason,
        ...(result.status === "unsupported" ? { saveGameVersion: result.saveGameVersion } : {})
      });
      return;
    }

    if (!sourceBytes || !parsedFile) {
      throw new Error("Open a supported GVAS file before requesting a download.");
    }

    const output = serializeUnrealGvas(sourceBytes, parsedFile, request.edits);
    const buffer = output.buffer.slice(
      output.byteOffset,
      output.byteOffset + output.byteLength
    ) as ArrayBuffer;

    workerScope.postMessage(
      { id: request.id, action: "serialize", buffer },
      [buffer]
    );
  } catch (error) {
    workerScope.postMessage({
      id: request.id,
      action: "error",
      message: summarizeUnrealGvasError(error)
    });
  }
};

export {};
