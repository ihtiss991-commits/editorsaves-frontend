import {
  inspectSaveFile,
  serializeSaveFile,
  type JsonValue,
  type RpgMakerFormat
} from "../lib/save-engine/index.ts";

type WorkerRequest =
  | { id: number; action: "inspect"; filename: string; buffer: ArrayBuffer }
  | { id: number; action: "serialize"; format: RpgMakerFormat; data: JsonValue };

type WorkerReply =
  | { id: number; action: "inspect"; inspection: Awaited<ReturnType<typeof inspectSaveFile>> }
  | { id: number; action: "serialize"; buffer: ArrayBuffer }
  | { id: number; action: "error"; message: string; code?: string };

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerReply, transfer?: Transferable[]): void;
};

workerScope.onmessage = async (event) => {
  const request = event.data;

  try {
    if (request.action === "inspect") {
      const inspection = await inspectSaveFile(new Uint8Array(request.buffer), {
        filename: request.filename
      });
      workerScope.postMessage({
        id: request.id,
        action: "inspect",
        inspection
      });
      return;
    }

    const bytes = await serializeSaveFile(request.format, request.data);
    const output = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(output).set(bytes);
    workerScope.postMessage(
      { id: request.id, action: "serialize", buffer: output },
      [output]
    );
  } catch (error) {
    const candidate = error as { message?: unknown; code?: unknown };
    workerScope.postMessage({
      id: request.id,
      action: "error",
      message: typeof candidate?.message === "string"
        ? candidate.message
        : "The save file could not be processed.",
      code: typeof candidate?.code === "string" ? candidate.code : undefined
    });
  }
};

export {};
