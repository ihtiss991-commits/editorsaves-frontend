'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  buildEditableFields,
  setJsonValueAtPath,
  type EditorField
} from "@/lib/save-engine/editor-fields";
import type {
  JsonValue,
  ParsedSaveFile,
  RpgMakerFormat,
  SaveFileInspection
} from "@/lib/save-engine/types";

type WorkerReply =
  | { id: number; action: "inspect"; inspection: SaveFileInspection }
  | { id: number; action: "serialize"; buffer: ArrayBuffer }
  | { id: number; action: "error"; message: string; code?: string };

type WorkerRequest =
  | { id: number; action: "inspect"; filename: string; buffer: ArrayBuffer }
  | { id: number; action: "serialize"; format: RpgMakerFormat; data: JsonValue };

type FileSummary = {
  name: string;
  size: number;
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatName(format: RpgMakerFormat): string {
  return format === "rpg-maker-mv" ? "RPG Maker MV" : "RPG Maker MZ";
}

function outputFilename(filename: string, format: RpgMakerFormat): string {
  const dot = filename.lastIndexOf(".");
  if (dot > 0) {
    return filename.slice(0, dot) + "-edited" + filename.slice(dot);
  }
  return filename + "-edited" + (format === "rpg-maker-mv" ? ".rpgsave" : ".rmmzsave");
}

export default function SaveEditorClient() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef(0);
  const downloadFilenameRef = useRef("edited-save.rpgsave");

  const [workerReady, setWorkerReady] = useState(false);
  const [workerFailed, setWorkerFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileSummary, setFileSummary] = useState<FileSummary | null>(null);
  const [inspection, setInspection] = useState<SaveFileInspection | null>(null);
  const [parsedSave, setParsedSave] = useState<ParsedSaveFile | null>(null);
  const [originalData, setOriginalData] = useState<JsonValue | null>(null);
  const [workingData, setWorkingData] = useState<JsonValue | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"info" | "success" | "error">("info");

  const fields = useMemo(
    () => (workingData === null ? [] : buildEditableFields(workingData)),
    [workingData]
  );

  const groupedFields = useMemo(() => {
    const groups = new Map<string, EditorField[]>();
    for (const field of fields) {
      const current = groups.get(field.section) ?? [];
      current.push(field);
      groups.set(field.section, current);
    }
    return Array.from(groups.entries());
  }, [fields]);

  const hasChanges = useMemo(() => {
    if (workingData === null || originalData === null) return false;
    return JSON.stringify(workingData) !== JSON.stringify(originalData);
  }, [workingData, originalData]);

  useEffect(() => {
    let mounted = true;
    let worker: Worker;

    try {
      worker = new Worker(new URL("../workers/save-editor.worker.ts", import.meta.url), {
        type: "module"
      });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        if (!mounted || event.data.id !== activeRequestRef.current) return;
        const reply = event.data;

        if (reply.action === "error") {
          setBusy(false);
          setNotice(reply.message);
          setNoticeKind("error");
          return;
        }

        if (reply.action === "inspect") {
          setInspection(reply.inspection);
          if (reply.inspection.status === "supported") {
            const parsed: ParsedSaveFile = {
              format: reply.inspection.format,
              kind: reply.inspection.kind,
              encoding: reply.inspection.encoding,
              data: reply.inspection.data,
              inputBytes: reply.inspection.inputBytes,
              decompressedBytes: reply.inspection.decompressedBytes,
              evidence: reply.inspection.evidence
            };
            setParsedSave(parsed);
            setOriginalData(reply.inspection.data);
            setWorkingData(reply.inspection.data);
            setNotice(
              reply.inspection.kind === "slot"
                ? "Save data recognized. Review the available fields before making changes."
                : "This RPG Maker file was recognized, but this editor currently edits slot saves only."
            );
            setNoticeKind("success");
          } else if (reply.inspection.status === "unsupported") {
            setParsedSave(null);
            setOriginalData(null);
            setWorkingData(null);
            setNotice(reply.inspection.reason);
            setNoticeKind("error");
          } else {
            setParsedSave(null);
            setOriginalData(null);
            setWorkingData(null);
            setNotice(reply.inspection.reason);
            setNoticeKind("error");
          }
          setBusy(false);
          return;
        }

        const blob = new Blob([reply.buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = downloadFilenameRef.current;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setBusy(false);
        setNotice("Your edited save file has been generated and downloaded. Keep your original save as a backup.");
        setNoticeKind("success");
      };

      worker.onerror = () => {
        if (!mounted) return;
        setWorkerReady(false);
        setWorkerFailed(true);
        setBusy(false);
        setNotice("The isolated editor worker could not start. Please reload the page or try a current browser.");
        setNoticeKind("error");
      };

      setWorkerReady(true);
    } catch {
      setWorkerFailed(true);
      setNotice("This browser could not start the isolated editor worker. Please try a current browser.");
      setNoticeKind("error");
    }

    return () => {
      mounted = false;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const resetEditor = () => {
    setInspection(null);
    setParsedSave(null);
    setOriginalData(null);
    setWorkingData(null);
    setFileSummary(null);
    setNotice("");
    setNoticeKind("info");
    if (inputRef.current) inputRef.current.value = "";
  };

  const inspectFile = async (file: File) => {
    if (!file) return;
    if (file.size === 0) {
      setNotice("The selected file is empty. Choose a valid save file.");
      setNoticeKind("error");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setNotice("This editor accepts files up to 25 MB.");
      setNoticeKind("error");
      return;
    }
    if (!workerRef.current || workerFailed) {
      setNotice("The isolated editor worker is unavailable. Reload the page and try again.");
      setNoticeKind("error");
      return;
    }

    resetEditor();
    setFileSummary({ name: file.name, size: file.size });
    setBusy(true);
    setNotice("Reading and identifying the save file in your browser...");
    setNoticeKind("info");

    try {
      const buffer = await file.arrayBuffer();
      const id = ++requestIdRef.current;
      activeRequestRef.current = id;
      const request: WorkerRequest = {
        id,
        action: "inspect",
        filename: file.name,
        buffer
      };
      workerRef.current.postMessage(request, [buffer]);
    } catch {
      setBusy(false);
      setNotice("The selected file could not be read by this browser.");
      setNoticeKind("error");
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void inspectFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void inspectFile(file);
  };

  const updateField = (field: EditorField, value: number | boolean | string) => {
    setWorkingData((current) => {
      if (current === null) return current;
      try {
        return setJsonValueAtPath(current, field.path, value);
      } catch {
        setNotice("This field could not be updated because the save structure changed.");
        setNoticeKind("error");
        return current;
      }
    });
  };

  const serializeEditedSave = () => {
    if (
      !workingData ||
      !parsedSave ||
      parsedSave.kind !== "slot" ||
      !hasChanges ||
      !workerRef.current ||
      busy
    ) return;

    const id = ++requestIdRef.current;
    activeRequestRef.current = id;
    setBusy(true);
    setNotice("Validating and encoding your edited save in the browser...");
    setNoticeKind("info");

    downloadFilenameRef.current = fileSummary
      ? outputFilename(fileSummary.name, parsedSave.format)
      : (parsedSave.format === "rpg-maker-mv" ? "edited-save.rpgsave" : "edited-save.rmmzsave");

    const request: WorkerRequest = {
      id,
      action: "serialize",
      format: parsedSave.format,
      data: workingData
    };
    workerRef.current.postMessage(request);
  };

  const restoreOriginal = () => {
    if (originalData === null) return;
    setWorkingData(originalData);
    setNotice("All edits have been reset to the values from the selected file.");
    setNoticeKind("info");
  };

  return (
    <div className="save-editor-page">
      <div className="save-editor-shell">
        <header className="save-editor-heading">
          <div className="save-editor-eyebrow"><span className="save-editor-live-dot" /> Experimental editor beta</div>
          <h1>RPG Maker Save Editor</h1>
          <p>
            Open a recognized RPG Maker MV or MZ slot save, change selected values,
            and download a separate edited copy. Your file is processed locally in your browser.
          </p>
          <div className="save-editor-trust">
            <span><strong>25 MB</strong> file limit</span>
            <span><strong>Browser-local</strong> processing</span>
            <span><strong>Original</strong> never overwritten</span>
          </div>
        </header>

        <section
          className={"save-editor-dropzone" + (dragging ? " is-dragging" : "")}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDragging(false);
            }
          }}
          onDrop={onDrop}
          aria-label="Save file upload area"
        >
          <input
            ref={inputRef}
            className="save-editor-file-input"
            type="file"
            accept=".rpgsave,.rmmzsave,.sav,.save,.dat,.json,.rvdata,.rvdata2,.rxdata,.lsd,.sol,.sgs,.es3,.db,application/octet-stream"
            onChange={onInputChange}
          />
          <div className="save-editor-upload-icon" aria-hidden="true"><span>↑</span></div>
          <h2>{fileSummary ? "Selected save file" : "Choose a save file to begin"}</h2>
          <p className="save-editor-drop-copy">
            {fileSummary
              ? fileSummary.name + " · " + formatBytes(fileSummary.size)
              : "Drag and drop a save file here, or select one from your device."}
          </p>
          <div className="save-editor-upload-actions">
            <button
              type="button"
              className="save-editor-button save-editor-button-primary"
              onClick={() => inputRef.current?.click()}
              disabled={!workerReady || busy}
            >
              {fileSummary ? "Choose another file" : "Select save file"}
            </button>
            {fileSummary && (
              <button type="button" className="save-editor-button save-editor-button-light" onClick={resetEditor} disabled={busy}>
                Remove file
              </button>
            )}
          </div>
          <p className="save-editor-format-note">Content is checked before editing; filename extensions alone are not trusted.</p>
        </section>

        {notice && (
          <div className={"save-editor-notice is-" + noticeKind} role="status" aria-live="polite">
            <span className="save-editor-notice-mark" aria-hidden="true">
              {noticeKind === "success" ? "✓" : noticeKind === "error" ? "!" : "i"}
            </span>
            <span>{notice}</span>
          </div>
        )}

        {busy && (
          <div className="save-editor-processing" role="status" aria-live="polite">
            <span className="save-editor-spinner" aria-hidden="true" />
            <div>
              <strong>Processing save data</strong>
              <span>Parsing or encoding the file in a background worker.</span>
            </div>
          </div>
        )}

        {inspection?.status === "supported" && parsedSave && (
          <>
            <section className="save-editor-summary">
              <div className="save-editor-summary-main">
                <span className="save-editor-summary-label">Detected format</span>
                <h2>{formatName(parsedSave.format)}</h2>
                <p>{parsedSave.kind === "slot" ? "Game slot save" : parsedSave.kind === "global" ? "Global save metadata" : "Configuration data"}</p>
              </div>
              <div className="save-editor-summary-stat">
                <span>File size</span>
                <strong>{formatBytes(parsedSave.inputBytes)}</strong>
              </div>
              <div className="save-editor-summary-stat">
                <span>Decoded data</span>
                <strong>{formatBytes(parsedSave.decompressedBytes)}</strong>
              </div>
              <div className="save-editor-summary-stat">
                <span>Codec</span>
                <strong>{parsedSave.format === "rpg-maker-mv" ? "LZ-String" : "Zlib"}</strong>
              </div>
            </section>

            <section className="save-editor-evidence">
              <details>
                <summary>Why this file was identified</summary>
                <ul>
                  {parsedSave.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </details>
            </section>

            {parsedSave.kind !== "slot" ? (
              <section className="save-editor-empty-state">
                <h2>This file can be inspected, but not edited here yet</h2>
                <p>
                  The current editor exposes selected fields from RPG Maker slot saves.
                  Global metadata and configuration files are recognized but remain read-only.
                </p>
              </section>
            ) : (
              <>
                <div className="save-editor-workspace-heading">
                  <div>
                    <span className="save-editor-section-kicker">Edit recognized values</span>
                    <h2>Save data controls</h2>
                    <p>Only known numeric and boolean fields are editable. Unrecognized data is preserved.</p>
                  </div>
                  <span className="save-editor-field-count">{fields.length} fields found</span>
                </div>

                {fields.length > 0 ? (
                  <div className="save-editor-groups">
                    {groupedFields.map(([section, sectionFields]) => (
                      <section className="save-editor-field-card" key={section}>
                        <div className="save-editor-field-card-heading">
                          <h3>{section}</h3>
                          <span>{sectionFields.length} {sectionFields.length === 1 ? "field" : "fields"}</span>
                        </div>
                        <div className="save-editor-field-grid">
                          {sectionFields.map((field) => (
                            <div className="save-editor-field" key={field.id}>
                              <label htmlFor={"field-" + field.id}>
                                <span>{field.label}</span>
                                <small>{field.description}</small>
                              </label>
                              {field.kind === "boolean" ? (
                                <input
                                  id={"field-" + field.id}
                                  className="save-editor-checkbox"
                                  type="checkbox"
                                  checked={field.value === true}
                                  onChange={(event) => updateField(field, event.target.checked)}
                                  disabled={busy}
                                />
                              ) : field.kind === "text" ? (
                                <input
                                  id={"field-" + field.id}
                                  className="save-editor-number save-editor-text"
                                  type="text"
                                  value={typeof field.value === "string" ? field.value : ""}
                                  maxLength={field.maxLength}
                                  autoComplete="off"
                                  spellCheck={false}
                                  onChange={(event) => updateField(field, event.target.value)}
                                  disabled={busy}
                                />
                              ) : (
                                <input
                                  id={"field-" + field.id}
                                  className="save-editor-number"
                                  type="number"
                                  value={typeof field.value === "number" ? field.value : ""}
                                  min={field.min}
                                  max={field.max}
                                  step={field.step === "any" ? "any" : field.step ?? 1}
                                  onChange={(event) => {
                                    if (event.target.value.trim() === "") return;
                                    const nextValue = Number(event.target.value);
                                    if (!Number.isFinite(nextValue)) return;
                                    if (field.min !== undefined && nextValue < field.min) return;
                                    if (field.max !== undefined && nextValue > field.max) return;
                                    if (field.step !== "any" && !Number.isInteger(nextValue)) return;
                                    updateField(field, nextValue);
                                  }}
                                  disabled={busy}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <section className="save-editor-empty-state">
                    <h2>No editable fields were found</h2>
                    <p>
                      The save structure was recognized, but it does not contain any of the
                      currently supported field paths. The file has not been changed.
                    </p>
                  </section>
                )}

                <div className="save-editor-item-note">
                  <strong>About inventory IDs:</strong> item, weapon and armor names are not embedded
                  in every save. This beta shows internal database IDs and counts; it does not guess
                  names or descriptions without the original game database.
                </div>

                <section className="save-editor-actions">
                  <div>
                    <strong>{hasChanges ? "Unsaved changes" : "No changes made"}</strong>
                    <span>
                      {hasChanges
                        ? "Your original file remains unchanged. Download to create a separate edited copy."
                        : "Change one or more recognized fields to enable the download."}
                    </span>
                  </div>
                  <div className="save-editor-action-buttons">
                    <button
                      type="button"
                      className="save-editor-button save-editor-button-light"
                      onClick={restoreOriginal}
                      disabled={!hasChanges || busy}
                    >
                      Reset edits
                    </button>
                    <button
                      type="button"
                      className="save-editor-button save-editor-button-primary"
                      onClick={serializeEditedSave}
                      disabled={!hasChanges || busy || fields.length === 0}
                    >
                      {busy ? "Working..." : "Download edited save"}
                      <span aria-hidden="true">↓</span>
                    </button>
                  </div>
                </section>
              </>
            )}

            <details className="save-editor-raw-data">
              <summary>Advanced: view complete save data (read-only)</summary>
              <p>Unknown fields and plugin data are retained in the working save structure.</p>
              <pre>{JSON.stringify(workingData, null, 2)}</pre>
            </details>
          </>
        )}

        {workerFailed && (
          <div className="save-editor-browser-warning">
            Your browser could not run the editor worker. Update your browser and reload this page.
          </div>
        )}

        <section className="save-editor-limitations">
          <h2>What this beta supports today</h2>
          <div className="save-editor-limit-grid">
            <div><strong>Supported codecs</strong><span>RPG Maker MV LZ-String and RPG Maker MZ zlib data.</span></div>
            <div><strong>Editable file type</strong><span>Recognized RPG Maker slot saves only. Global and config files are read-only.</span></div>
            <div><strong>Not supported yet</strong><span>MZSEC1 encrypted saves, game-specific item names, custom plugin editors and other engines.</span></div>
            <div><strong>Validation status</strong><span>Codec and synthetic regression tests pass. Original-game acceptance testing is still required for each game.</span></div>
          </div>
        </section>

        <p className="save-editor-footnote">
          Use a copy of your save file and keep a backup. A file that parses successfully is not automatically
          proven compatible with every game, plugin or game version using the same engine.
        </p>
      </div>
    </div>
  );
}
