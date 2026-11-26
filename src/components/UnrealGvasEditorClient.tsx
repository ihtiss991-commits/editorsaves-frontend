"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type {
  GvasScalar,
  UnrealGvasPublicInspection,
  UnrealGvasProperty
} from "@/lib/unreal-gvas";
import {
  detectUnrealGvasGameProfile,
  getUnrealGvasProfileField,
  isUnrealGvasProfileFieldEditable,
  type UnrealGvasGameProfileId
} from "@/lib/unreal-gvas/game-profiles";

type WorkerReply =
  | { id: number; action: "inspect"; status: "supported"; inspection: UnrealGvasPublicInspection }
  | { id: number; action: "inspect"; status: "unsupported"; reason: string; saveGameVersion?: number }
  | { id: number; action: "inspect"; status: "unknown"; reason: string }
  | { id: number; action: "serialize"; buffer: ArrayBuffer }
  | { id: number; action: "error"; message: string };

type WorkerRequest =
  | { id: number; action: "inspect"; filename: string; buffer: ArrayBuffer }
  | { id: number; action: "serialize"; edits: Array<{ propertyIndex: number; value: GvasScalar }> };

type EditValue = GvasScalar;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function editedFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot > 0) return filename.slice(0, dot) + "-edited" + filename.slice(dot);
  return filename + "-edited.sav";
}

function currentValue(property: UnrealGvasProperty, edits: Record<number, EditValue>): EditValue | null {
  return Object.prototype.hasOwnProperty.call(edits, property.index)
    ? edits[property.index]
    : property.value;
}

function displayValue(value: EditValue | null, fallback: string): string {
  return value === null ? fallback : String(value);
}

function fieldDescription(property: UnrealGvasProperty): string {
  if (property.detail) return property.detail;
  if (property.type === "BoolProperty") return "Boolean value serialized by the Unreal property tag.";
  if (property.type === "StrProperty") return "Length-prefixed Unreal string. Its byte length is updated when saved.";
  if (property.integer) return "Typed integer. The editor keeps the original integer width and signedness.";
  return "Typed numeric value. The editor retains the original scalar type.";
}

interface UnrealGvasEditorClientProps {
  profileOnly?: UnrealGvasGameProfileId;
}

export default function UnrealGvasEditorClient({ profileOnly }: UnrealGvasEditorClientProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef(0);
  const filenameRef = useRef("edited-save.sav");

  const [workerReady, setWorkerReady] = useState(false);
  const [workerFailed, setWorkerFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [inspection, setInspection] = useState<UnrealGvasPublicInspection | null>(null);
  const [unsupportedReason, setUnsupportedReason] = useState("");
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<number, EditValue>>({});
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"info" | "success" | "error">("info");

  const detectedProfile = inspection
    ? detectUnrealGvasGameProfile(inspection.header.saveGameClassName)
    : null;
  const activeProfile = detectedProfile && (!profileOnly || detectedProfile.id === profileOnly)
    ? detectedProfile
    : null;
  const profileMismatch = Boolean(profileOnly && inspection && !activeProfile);
  const canEditProperty = (property: UnrealGvasProperty): boolean => {
    if (!property.editable || profileMismatch) return false;
    if (activeProfile) return isUnrealGvasProfileFieldEditable(activeProfile, property);
    // The generic GVAS page keeps nested fields read-only until a game-specific map exists.
    return !profileOnly && (property.depth ?? 0) === 0;
  };

  const visibleProperties = useMemo(() => {
    if (!inspection) return [];
    const available = activeProfile
      ? [...inspection.properties, ...inspection.nestedProperties]
      : inspection.properties;
    const query = search.trim().toLowerCase();
    if (!query) return available;

    return available.filter((property) => {
      const value = currentValue(property, edits);
      const haystack = [
        property.path ?? property.name,
        property.name,
        property.type,
        property.detail ?? "",
        value === null ? property.displayValue : String(value)
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [inspection, search, edits, activeProfile]);

  const editablePropertyCount = inspection
    ? (activeProfile ? [...inspection.properties, ...inspection.nestedProperties] : inspection.properties)
        .filter(canEditProperty).length
    : 0;
  const changedCount = Object.keys(edits).length;

  useEffect(() => {
    let mounted = true;
    try {
      const worker = new Worker(new URL("../workers/unreal-gvas.worker.ts", import.meta.url), {
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
          setBusy(false);
          setEdits({});
          if (reply.status === "supported") {
            setInspection(reply.inspection);
            setUnsupportedReason("");
            const profile = detectUnrealGvasGameProfile(reply.inspection.header.saveGameClassName);
            setNotice(
              profile
                ? "Half Sword progression save identified. Player Funds, Character Height and Character Weight are mapped; other nested data remains read-only."
                : "GVAS properties were parsed locally. Only supported primitive fields can be edited; complex and unknown payloads remain unchanged."
            );
            setNoticeKind("success");
          } else {
            setInspection(null);
            setUnsupportedReason(reply.reason);
            setNotice(reply.reason);
            setNoticeKind(reply.status === "unknown" ? "error" : "info");
          }
          return;
        }

        const blob = new Blob([reply.buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = editedFilename(filenameRef.current);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        setBusy(false);
        setNotice("Your edited GVAS file was generated and structurally verified. Keep the original save as a backup.");
        setNoticeKind("success");
      };

      worker.onerror = () => {
        if (!mounted) return;
        setWorkerReady(false);
        setWorkerFailed(true);
        setBusy(false);
        setNotice("The isolated GVAS worker could not start. Reload the page or try an up-to-date browser.");
        setNoticeKind("error");
      };

      setWorkerReady(true);
    } catch {
      setWorkerFailed(true);
      setNotice("This browser could not start the isolated GVAS worker. Try an up-to-date browser.");
      setNoticeKind("error");
    }

    return () => {
      mounted = false;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const reset = () => {
    setInspection(null);
    setUnsupportedReason("");
    setFileName("");
    setFileSize(0);
    setEdits({});
    setSearch("");
    setNotice("");
    setNoticeKind("info");
    if (inputRef.current) inputRef.current.value = "";
  };

  const inspectFile = async (file: File) => {
    if (!file) return;
    if (file.size === 0) {
      setNotice("The selected file is empty.");
      setNoticeKind("error");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setNotice("This beta accepts files up to 25 MB.");
      setNoticeKind("error");
      return;
    }
    if (!workerRef.current || workerFailed) {
      setNotice("The isolated GVAS worker is unavailable. Reload the page and try again.");
      setNoticeKind("error");
      return;
    }

    setInspection(null);
    setUnsupportedReason("");
    setEdits({});
    setFileName(file.name);
    setFileSize(file.size);
    filenameRef.current = file.name;
    setBusy(true);
    setNotice("Reading GVAS header and tagged properties locally...");
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

  const setPropertyValue = (property: UnrealGvasProperty, value: EditValue) => {
    if (!canEditProperty(property)) return;
    setEdits((current) => {
      const next = { ...current };
      if (value === property.value) {
        delete next[property.index];
      } else {
        next[property.index] = value;
      }
      return next;
    });
  };

  const downloadEdited = () => {
    if (!inspection || !workerRef.current || busy || changedCount === 0 || profileMismatch) return;
    const id = ++requestIdRef.current;
    activeRequestRef.current = id;
    setBusy(true);
    setNotice("Applying type-safe edits and verifying the rewritten GVAS property stream...");
    setNoticeKind("info");

    const message: WorkerRequest = {
      id,
      action: "serialize",
      edits: Object.entries(edits).map(([propertyIndex, value]) => ({
        propertyIndex: Number(propertyIndex),
        value
      }))
    };
    workerRef.current.postMessage(message);
  };

  return (
    <main className="unreal-gvas-page">
      <div className="unreal-gvas-shell">
        <header className="unreal-gvas-heading">
          <div className="unreal-gvas-eyebrow"><span /> {profileOnly === "half-sword" ? "Half Sword game editor · Limited beta" : "Unreal Engine save tool · Experimental beta"}</div>
          <h1>{profileOnly === "half-sword" ? "Half Sword Save Editor" : "Unreal GVAS Save Editor"}</h1>
          <p>
            {profileOnly === "half-sword"
              ? "Edit Player Funds, Character Height and Character Weight in a supported Half Sword progression save. Other nested character, equipment and inventory data remain read-only; processing stays local in your browser."
              : "Inspect a raw Unreal Engine GVAS save, search its tagged properties, edit supported scalar values, and download a separate copy. Parsing and editing run locally in your browser."}
          </p>
          <div className="unreal-gvas-trust">
            <span><strong>UE4 / UE5</strong> validated header layouts</span>
            <span><strong>25 MB</strong> file limit</span>
            <span><strong>Local</strong> processing</span>
          </div>
        </header>

        <section
          className={"unreal-gvas-dropzone" + (dragging ? " is-dragging" : "")}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
          aria-label="Unreal GVAS file upload area"
        >
          <input
            ref={inputRef}
            className="unreal-gvas-file-input"
            type="file"
            accept=".sav,.gvas,application/octet-stream"
            onChange={onInputChange}
          />
          <div className="unreal-gvas-upload-icon" aria-hidden="true">↑</div>
          <h2>{fileName ? "Selected save file" : "Choose an Unreal save file"}</h2>
          <p>{fileName ? fileName + " · " + formatBytes(fileSize) : "Drop a .sav or .gvas file here, or choose one from your device."}</p>
          <div className="unreal-gvas-buttons">
            <button
              type="button"
              className="unreal-gvas-button unreal-gvas-primary"
              onClick={() => inputRef.current?.click()}
              disabled={!workerReady || busy}
            >
              {fileName ? "Choose another file" : "Select GVAS file"}
            </button>
            {fileName && (
              <button type="button" className="unreal-gvas-button unreal-gvas-secondary" onClick={reset} disabled={busy}>
                Remove file
              </button>
            )}
          </div>
          <small>File extensions are not trusted. The raw GVAS signature and serialized header are checked.</small>
        </section>

        {notice && (
          <div className={"unreal-gvas-notice is-" + noticeKind} role="status" aria-live="polite">
            <span>{noticeKind === "success" ? "✓" : noticeKind === "error" ? "!" : "i"}</span>
            {notice}
          </div>
        )}

        {busy && (
          <div className="unreal-gvas-processing" role="status" aria-live="polite">
            <span className="unreal-gvas-spinner" />
            <div><strong>Processing save data</strong><small>Working in an isolated browser worker.</small></div>
          </div>
        )}

        {unsupportedReason && !inspection && (
          <section className="unreal-gvas-empty">
            <h2>This GVAS variant is not supported yet</h2>
            <p>{unsupportedReason}</p>
            <p>The original file has not been modified.</p>
          </section>
        )}

        {inspection && (
          <>
            <section className="unreal-gvas-summary">
              <div className="unreal-gvas-summary-main">
                <small>Detected Unreal Engine version</small>
                <strong>{inspection.header.engineVersion}</strong>
                <span>{inspection.header.propertyLayout === "legacy" ? "Legacy tagged-property layout" : "UE 5.4+ type-tree layout"}</span>
              </div>
              <div><small>Properties</small><strong>{inspection.properties.length + (activeProfile ? inspection.nestedProperties.length : 0)}</strong></div>
              <div><small>Editable</small><strong>{editablePropertyCount}</strong></div>
              <div><small>File size</small><strong>{formatBytes(inspection.fileSize)}</strong></div>
            </section>

            <section className="unreal-gvas-class">
              <small>Save game class</small>
              <code>{inspection.header.saveGameClassName || "Class name not provided"}</code>
              <span>
                UE4 package {inspection.header.packageFileVersionUE4}
                {inspection.header.packageFileVersionUE5 !== null
                  ? " · UE5 package " + inspection.header.packageFileVersionUE5
                  : ""}
                {" · " + inspection.header.customVersionCount + " custom versions"}
                {" · " + inspection.trailingBytes + " trailing bytes retained"}
              </span>
            </section>

            {activeProfile && (
              <section className="unreal-gvas-game-profile">
                <small>Game-specific profile detected</small>
                <h2>{activeProfile.gameName} · {activeProfile.saveType}</h2>
                <p>{activeProfile.description}</p>
                <p><strong>Enabled fields:</strong> {activeProfile.fields.map((field) => field.label).join(", ")}</p>
                <p>Only these exact paths and serialized types are enabled. Equipment, appearance, inventory and other unverified properties remain read-only.</p>
              </section>
            )}
            {profileMismatch && (
              <section className="unreal-gvas-profile-mismatch" role="status">
                <strong>This file does not match the Half Sword profile.</strong>
                <span>Upload a save whose exact class is {"/Game/Blueprints/SaveGame/SG_GameProgress.SG_GameProgress_C"} to enable the Half Sword field map. This file remains inspect-only on this page.</span>
              </section>
            )}
            <section className="unreal-gvas-warning">
              <strong>{activeProfile ? "Half Sword fields are deliberately restricted." : "Important: property names are game-defined."}</strong>
              <span>
                {activeProfile
                  ? "Only Player Funds (IntProperty), Character Height (DoubleProperty) and Character Weight (DoubleProperty) at their exact mapped paths are editable. Other nested structs, arrays, maps, enums, equipment, inventory and unknown payloads remain unchanged and read-only. A structurally verified file is not guaranteed to load in the original game."
                  : "Unreal does not define standard meanings for fields such as Gold, Level or Inventory. This beta edits typed top-level scalar properties only. Arrays, maps, structs, native data and unknown payloads remain unchanged. A successful rewrite does not guarantee that a game will accept the modified save."}
              </span>
            </section>

            <div className="unreal-gvas-list-heading">
              <div>
                <small>Property explorer</small>
                <h2>Tagged save properties</h2>
                <p>{activeProfile ? "Only fields in the verified Half Sword map are editable; all other properties remain read-only." : "Search by property name, type or current value. Complex properties are preserved read-only."}</p>
              </div>
              <div className="unreal-gvas-search-wrap">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search properties..."
                  aria-label="Search GVAS properties"
                />
              </div>
            </div>

            <section className="unreal-gvas-property-list">
              {visibleProperties.length === 0 ? (
                <div className="unreal-gvas-no-results">No properties match your search.</div>
              ) : visibleProperties.map((property) => {
                const value = currentValue(property, edits);
                const editable = canEditProperty(property);
                const profileField = activeProfile ? getUnrealGvasProfileField(activeProfile, property) : null;
                return (
                  <article className={"unreal-gvas-property" + (editable ? " is-editable" : " is-readonly")} key={property.index}>
                    <div className="unreal-gvas-property-meta">
                      <strong>{profileField?.label ?? property.name}</strong>
                      <span>{property.type} · {property.size} bytes{property.depth ? " · Player Character" : ""}</span>
                      {(profileField?.description || property.detail || (editable ? fieldDescription(property) : "")) && <small>{profileField?.description || property.detail || fieldDescription(property)}</small>}
                    </div>
                    <div className="unreal-gvas-property-control">
                      {editable && property.editKind === "boolean" ? (
                        <label className="unreal-gvas-toggle">
                          <input
                            type="checkbox"
                            checked={value === true}
                            disabled={busy}
                            onChange={(event) => setPropertyValue(property, event.target.checked)}
                          />
                          <span>{value === true ? "True" : "False"}</span>
                        </label>
                      ) : editable && property.editKind === "text" ? (
                        <input
                          className="unreal-gvas-value-input is-text"
                          type="text"
                          value={value === null ? "" : String(value)}
                          maxLength={property.type === "StrProperty" ? 16000 : 21}
                          disabled={busy}
                          onChange={(event) => setPropertyValue(property, event.target.value)}
                          aria-label={"Edit " + property.name}
                        />
                      ) : editable && property.editKind === "number" ? (
                        <input
                          className="unreal-gvas-value-input"
                          type="number"
                          step={property.integer ? 1 : "any"}
                          value={typeof value === "number" ? value : ""}
                          disabled={busy}
                          onChange={(event) => {
                            if (!event.target.value.trim()) return;
                            const number = Number(event.target.value);
                            if (!Number.isFinite(number)) return;
                            if (property.integer && !Number.isSafeInteger(number)) return;
                            setPropertyValue(property, number);
                          }}
                          aria-label={"Edit " + property.name}
                        />
                      ) : (
                        <span className="unreal-gvas-raw-value">{displayValue(value, property.displayValue)}</span>
                      )}
                      {!editable && <small>Read-only</small>}
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="unreal-gvas-actions">
              <div>
                <strong>{changedCount ? changedCount + " unsaved changes" : "No changes made"}</strong>
                <span>{changedCount ? "The original file remains unchanged. Download creates a separate edited copy." : "Change an editable scalar field to enable download."}</span>
              </div>
              <div className="unreal-gvas-buttons">
                <button
                  type="button"
                  className="unreal-gvas-button unreal-gvas-secondary"
                  onClick={() => setEdits({})}
                  disabled={changedCount === 0 || busy}
                >
                  Reset edits
                </button>
                <button
                  type="button"
                  className="unreal-gvas-button unreal-gvas-primary"
                  onClick={downloadEdited}
                  disabled={changedCount === 0 || busy || profileMismatch}
                >
                  {busy ? "Working..." : "Download edited save"} <span aria-hidden="true">↓</span>
                </button>
              </div>
            </section>
          </>
        )}

        {workerFailed && (
          <div className="unreal-gvas-empty">
            Your browser could not start the GVAS worker. Please update your browser and reload.
          </div>
        )}

        <section className="unreal-gvas-limitations">
          <h2>Current format coverage</h2>
          <div>
            <p><strong>Validated headers:</strong> standard GVAS save-game versions 2 and 3.</p>
            <p><strong>Property layouts:</strong> UE4/UE5 legacy tagged properties and UE5.4+ type-tree tags.</p>
            <p><strong>Editable:</strong> typed integer, 64-bit integer, float, double, boolean and FString scalar properties.</p>
            <p><strong>Read-only:</strong> arrays, maps, sets, structs, enums, name references, object references, native/binary properties and unknown payloads.</p>
            <p><strong>Not supported:</strong> non-GVAS wrappers, compressed/encrypted variants, save header versions outside 2/3 and property-tag extensions.</p>
          </div>
        </section>

        <p className="unreal-gvas-footnote">
          Always work on a copy and keep a backup. Some games add their own checksums, encryption,
          validation or game-specific constraints. Test a downloaded save in the original game before
          relying on it.
        </p>
      </div>
    </main>
  );
}
