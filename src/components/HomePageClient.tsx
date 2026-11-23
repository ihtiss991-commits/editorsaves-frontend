'use client';

import { useEffect } from 'react';
import { ALLOWED_EXTENSIONS, getExtension, isAllowedExtension, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '@/lib/constants';

type TurnstileInstance = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'error-callback'?: () => void;
    'expired-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact' | 'invisible';
    execution?: 'render' | 'execute';
    appearance?: 'always' | 'execute' | 'interaction-only';
  }) => string;
  reset?: (widgetId?: string) => void;
  remove?: (widgetId?: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileInstance; }
}

const HOME_HTML = `
<header class="hero">
  <div class="wrap">
    <span class="badge">Free · Browser-based · No account required</span>
    <h1>Contribute Game Save Files to Help Build a Universal Save Editor</h1>
    <p>EditorSaves is collecting real game save files to research how different games store progress, inventory, quests, and other player data. This research will guide development of a future universal game save editor.</p>
    <div class="hero-actions">
      <a class="btn" href="#upload-box">Contribute a save file</a>
      <a class="btn secondary" href="/about">How the project works</a>
    </div>
    <p class="hero-note">Current status: file collection and format research. Parsing, editing, and exporting saves are not available yet.</p>
  </div>
</header>

<section class="upload-section">
  <div class="wrap">
    <div class="upload-container" id="upload-box">
      <div class="upload-topline" aria-hidden="true">
        <span class="upload-topline-pill"><span class="upload-topline-spark"></span> Save-file research collection</span>
        <span class="upload-background-note"><span class="upload-background-dot"></span> Background security check</span>
      </div>
      <div class="upload-art" aria-hidden="true">
        <span class="upload-art-ring upload-art-ring-one"></span>
        <span class="upload-art-ring upload-art-ring-two"></span>
        <div class="upload-icon"></div>
        <span class="upload-floating-tag upload-floating-tag-one">.SAV</span>
        <span class="upload-floating-tag upload-floating-tag-two">.JSON</span>
        <span class="upload-floating-tag upload-floating-tag-three">SAVE</span>
      </div>
      <h2>Contribute a game save file</h2>
      <p>Select a save file from a game you are allowed to share, or drag it into this area.</p>
      <input accept=".rpgsave,.rmmzsave,.save,.rvdata2,.rvdata,.rxdata,.sav,.dat,.json,.xml,.sqlite,.db,.plr,.wld,.rsv,.sol,.sgs,.qsp,.ksd,.pkl,.pickle,.es3,.lsd" aria-label="Choose a game save file" class="file-input" id="save-file" name="file" type="file" />
      <div class="upload-select-row">
        <label aria-controls="save-file" class="btn" for="save-file" role="button" tabindex="0">Choose save file</label>
        <span class="upload-select-hint">or drop it anywhere in this box</span>
      </div>
      <div aria-live="polite" data-state="idle" hidden="" id="esUploadStatus" role="status"></div>
      <div aria-label="Security verification" id="turnstileMount"></div>
      <div class="upload-trustline" aria-hidden="true">
        <span class="upload-trustline-item"><svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="4" y="10" width="16" height="11" rx="2"/><path d="m9 15 2 2 4-4"/></svg> Private file storage</span>
        <span class="upload-trustline-divider"></span>
        <span class="upload-trustline-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg> No account required</span>
      </div>
      <p class="upload-footnote">An accepted file extension only means the upload passes the current intake filter. It does not mean EditorSaves can read or edit that game's save format.</p>
    </div>
  </div>
</section>

<section>
  <div class="wrap prose">
    <h2>What Is EditorSaves?</h2>
    <p>EditorSaves is an independent game save-file research project with a long-term goal: make save editing more understandable, reliable, and accessible through a future universal save editor. The project starts with real-world file collection because game saves are not interchangeable. Two games can use the same filename extension while storing completely different data internally.</p>
    <p>Games may use JSON, XML, SQLite, serialized objects, binary records, compression, custom encodings, checksums, or proprietary containers. An extension can offer a clue, but it cannot reliably identify the complete format or prove that a file can be edited safely.</p>
    <div class="highlight-block">
      <p><strong>What the live website does today:</strong> EditorSaves accepts eligible save-file submissions, performs basic intake and security checks, calculates a SHA-256 file hash, and stores the submission in private project storage for research. The current release does not inspect file contents for visitors, change game values, or generate an edited download.</p>
    </div>
  </div>
</section>

<section class="alt" id="how-it-works">
  <div class="wrap">
    <h2>How the Save-File Collection Works</h2>
    <p class="section-lead">The current workflow is deliberately limited and transparent. Submitting a sample contributes to research; it does not start an editing session.</p>
    <div class="grid cols-3">
      <div class="card">
        <span class="badge">Step 1</span>
        <h3>Choose a save file</h3>
        <p>Find a save file created by a game you own or are otherwise authorized to share. Keep a separate copy on your device and submit only a file that does not contain information you want to keep private.</p>
      </div>
      <div class="card">
        <span class="badge">Step 2</span>
        <h3>Complete the intake checks</h3>
        <p>The upload service checks file size and filename extension, verifies a Cloudflare Turnstile token on the server, and calculates a SHA-256 hash to help identify duplicate file contents.</p>
      </div>
      <div class="card">
        <span class="badge">Step 3</span>
        <h3>Contribute to format research</h3>
        <p>Eligible submissions are stored in private project storage with associated upload metadata. Samples can help investigate serialization, compression, version differences, and other format characteristics.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap prose">
    <h2>Which Game Save File Extensions Can You Submit?</h2>
    <p>The current intake filter accepts the filename extensions below. This list describes upload eligibility only. It is not a supported-editor list, compatibility matrix, or promise that every file with one of these extensions can be decoded.</p>
    <h3>Engine-associated and game-specific extensions</h3>
    <p><code>.rpgsave</code>, <code>.rmmzsave</code>, <code>.rvdata</code>, <code>.rvdata2</code>, <code>.rxdata</code>, <code>.lsd</code>, <code>.rsv</code>, <code>.sol</code>, <code>.sgs</code>, <code>.qsp</code>, <code>.ksd</code>, <code>.plr</code>, and <code>.wld</code>.</p>
    <h3>General and structured-data extensions</h3>
    <p><code>.sav</code>, <code>.save</code>, <code>.dat</code>, <code>.json</code>, <code>.xml</code>, <code>.sqlite</code>, <code>.db</code>, <code>.pkl</code>, <code>.pickle</code>, and <code>.es3</code>.</p>
    <p>Some games use the same extension for unrelated formats. Others use a familiar extension but wrap the data in compression or a game-specific container. The actual format must be identified from file contents and context, not the extension alone.</p>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <h2>Why Real Save-File Samples Matter</h2>
    <p class="section-lead">Reliable format support starts with evidence. Samples can expose differences that a generic extension list or engine name cannot describe.</p>
    <div class="grid cols-3">
      <article class="card icon-card"><h3>Serialization and structure</h3><p>Research can reveal whether a game stores data as JSON, XML, SQLite, serialized objects, binary records, or a custom structure—and how fields relate to one another.</p></article>
      <article class="card icon-card"><h3>Compression and encoding</h3><p>A save may contain compressed, encoded, or wrapped data. Understanding those layers is necessary before a future tool can safely inspect or rewrite the contents.</p></article>
      <article class="card icon-card"><h3>Game and version differences</h3><p>Updates can change field layouts, identifiers, checksums, and serialization behavior. Samples from different games and versions help distinguish shared patterns from game-specific rules.</p></article>
      <article class="card icon-card"><h3>Validation requirements</h3><p>Future parsers will need tests that detect malformed data and preserve important structures. A file that can be read is not automatically safe to rewrite.</p></article>
      <article class="card icon-card"><h3>Honest compatibility reporting</h3><p>Long-term support should be documented per game and format, including tested versions, known limitations, and workflows that are not yet editable.</p></article>
      <article class="card icon-card"><h3>Better development priorities</h3><p>Understanding which games, formats, and variations appear in real submissions helps prioritize future research instead of guessing from extensions alone.</p></article>
    </div>
  </div>
</section>

<section>
  <div class="wrap prose">
    <h2>Privacy, File Safety, and Responsible Contributions</h2>
    <p>Save files may contain player names, progression details, profile identifiers, or other information that is not obvious from the filename. Only submit files you have permission to share. Do not upload account credentials, private documents, or data belonging to someone else without permission.</p>
    <p>Submitted files are uploaded to a private Supabase Storage bucket, and the project records metadata needed to manage and research submissions. Cloudflare Turnstile is used as an anti-abuse check. These controls do not guarantee that an uploaded file is harmless or that its contents have been fully inspected.</p>
    <p>Keep your original save file on your own device. EditorSaves does not modify the original file in your game folder, and the current website does not return a modified save. For details about collected metadata, storage, and retention, read the <a href="/privacy">EditorSaves Privacy Policy</a>. The <a href="/terms">Terms of Use</a> explain what you may submit and your responsibilities.</p>
    <div class="note"><strong>Important:</strong> Upload only a copy of a save file you are authorized to provide. Do not rely on EditorSaves as the only copy of valuable game progress.</div>
  </div>
</section>

<section class="alt">
  <div class="wrap">
    <h2>EditorSaves Development Roadmap</h2>
    <p class="section-lead">The long-term goal is a dependable universal game save editor. Each stage must be built and tested before the site describes it as an available feature.</p>
    <div class="grid cols-3">
      <article class="card"><span class="badge">Current stage</span><h3>Collection and research</h3><p>Collect eligible samples, verify submissions, maintain private storage, identify duplicate contents, and organize evidence about game and format diversity.</p></article>
      <article class="card"><span class="badge">Planned work</span><h3>Format identification and parsers</h3><p>Investigate file signatures, compression, serialization, and game-specific structures. Build automated test fixtures and document what can be identified reliably.</p></article>
      <article class="card"><span class="badge">Long-term goal</span><h3>Validated editing and export</h3><p>Develop game-aware editing workflows with backups, validation, clear compatibility limits, and safe export only after each supported format has been tested.</p></article>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Frequently Asked Questions About EditorSaves</h2>
    <div class="prose" style="margin-top: 8px;">
      <details class="faq-item" open=""><summary>Can I edit a game save on EditorSaves right now?</summary><p>Not yet. The current live release is a save-file collection service for format research. It does not parse save contents for visitors, change money or inventory, or export modified files. Editing features will only be described as available after they are implemented and tested.</p></details>
      <details class="faq-item"><summary>Does an accepted file extension mean my game is supported?</summary><p>No. The extension list is an intake filter, not a compatibility guarantee. Different games can use the same extension for different internal formats, and some files need game-specific decompression, decoding, or validation.</p></details>
      <details class="faq-item"><summary>Will uploading a save change or overwrite my original file?</summary><p>No. The website receives an uploaded copy. It does not write to your game folder or modify the original file on your device. Keep your own backup and original copy.</p></details>
      <details class="faq-item"><summary>Do I need an account or payment to contribute?</summary><p>No account or payment is currently required to submit an eligible research sample. The upload flow includes an automated security check and intake validation.</p></details>
      <details class="faq-item"><summary>Where are uploaded files stored?</summary><p>Eligible files are stored in private project storage, with database metadata used to manage submissions. Read the <a href="/privacy">Privacy Policy</a> for the current data-handling and retention details.</p></details>
      <details class="faq-item"><summary>Can you guarantee that my file will be supported by the future editor?</summary><p>No. A submission helps with research but does not guarantee compatibility or a future parser. Support depends on the game's format, versions, encryption, compression, and whether reliable editing can be validated.</p></details>
    </div>
  </div>
</section>

<section>
  <div class="wrap prose">
    <h2>Questions or a Game Format to Suggest?</h2>
    <p>Tell us which game or save format you are interested in. Suggestions help us understand what players want researched, but they are not a promise of a release date or compatibility.</p>
    <p>Contact the project at <a href="mailto:contact@editorsaves.com">contact@editorsaves.com</a> or visit the <a href="/about">About EditorSaves</a> page to learn more about the research approach.</p>
  </div>
</section>
`;

function ensureTurnstileLoaded(): Promise<TurnstileInstance> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  const existing = document.querySelector<HTMLScriptElement>('script[data-editorsaves-turnstile]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error('Security verification could not be loaded.')),
        15000,
      );
      const poll = window.setInterval(() => {
        if (!window.turnstile) return;
        window.clearTimeout(timeout);
        window.clearInterval(poll);
        resolve(window.turnstile);
      }, 50);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.editorsavesTurnstile = 'true';
    script.onload = () => window.turnstile
      ? resolve(window.turnstile)
      : reject(new Error('Security verification loaded without its API.'));
    script.onerror = () => reject(new Error('Security verification could not be loaded.'));
    document.head.appendChild(script);
  });
}

export default function HomePageClient() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.editorsaves-home');
    const input = root?.querySelector<HTMLInputElement>('#save-file');
    const uploadBox = root?.querySelector<HTMLElement>('#upload-box');
    const pickerLabel = root?.querySelector<HTMLElement>('label[for="save-file"]');
    const status = root?.querySelector<HTMLElement>('#esUploadStatus');
    const turnstileMount = root?.querySelector<HTMLElement>('#turnstileMount');
    if (!root || !input || !uploadBox || !status || !turnstileMount) return;

    input.accept = ALLOWED_EXTENSIONS.join(',');
    const TOKEN_REFRESH_AFTER_MS = 4 * 60 * 1000;
    let selectedFile: File | null = null;
    let token: string | null = null;
    let tokenCreatedAt = 0;
    let widgetId: string | undefined;
    let isUploading = false;
    let isInitializing = false;
    let disposed = false;
    let tokenRefreshTimer: number | undefined;
    let verificationIssue: string | null = null;

    const makeElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };

    const appendFileChip = (parent: HTMLElement) => {
      if (!selectedFile) return;
      const chip = makeElement('span', 'es-upload-file');
      chip.append(
        makeElement('span', 'es-upload-file-icon', '✓'),
        makeElement('span', 'es-upload-file-name', selectedFile.name),
      );
      parent.append(chip);
    };

    const setStatus = (state: 'info' | 'verifying' | 'uploading' | 'success' | 'error', message: string) => {
      status.dataset.state = state;
      status.hidden = false;
      status.setAttribute('aria-busy', String(state === 'verifying' || state === 'uploading'));
      status.replaceChildren();

      if (state === 'verifying' || state === 'uploading') {
        const stage = makeElement('div', 'es-upload-stage');
        const animation = makeElement('div', 'es-upload-processing-icon');
        animation.setAttribute('aria-hidden', 'true');
        animation.append(makeElement('span', 'es-upload-processing-icon-core'));
        const copy = makeElement('div', 'es-upload-processing-copy');
        const title = state === 'verifying' ? 'Securing your upload' : 'Uploading your save file';
        copy.append(
          makeElement('strong', 'es-upload-processing-title', title),
          makeElement('span', 'es-upload-processing-detail', message),
        );
        if (selectedFile) appendFileChip(copy);
        const progress = makeElement('div', 'es-upload-progress');
        progress.setAttribute('aria-hidden', 'true');
        progress.append(makeElement('span'));
        stage.append(animation, copy, progress);
        status.append(stage);
        return;
      }

      const card = makeElement('div', `es-upload-result-card ${state}`);
      const icon = makeElement(
        'span',
        `es-upload-result-icon ${state === 'error' ? 'error' : state === 'success' ? 'success' : 'ready'}`,
        state === 'error' ? '!' : '✓',
      );
      icon.setAttribute('aria-hidden', 'true');
      const copy = makeElement('div', 'es-upload-result-copy');
      const title = state === 'success'
        ? 'Upload complete'
        : state === 'error'
          ? 'We could not complete that step'
          : 'Your file is ready';
      copy.append(
        makeElement('strong', 'es-upload-result-title', title),
        makeElement('span', 'es-upload-result-detail', message),
      );
      if (selectedFile) appendFileChip(copy);
      card.append(icon, copy);
      status.append(card);
    };

    const clearTokenRefreshTimer = () => {
      if (tokenRefreshTimer !== undefined) {
        window.clearTimeout(tokenRefreshTimer);
        tokenRefreshTimer = undefined;
      }
    };

    const showVerificationPending = (message: string) => {
      if (!selectedFile || isUploading) return;
      uploadBox.classList.add('is-processing');
      setStatus('verifying', message);
    };

    const scheduleTokenRefresh = () => {
      clearTokenRefreshTimer();
      tokenRefreshTimer = window.setTimeout(() => {
        if (disposed || isUploading || !widgetId) return;
        token = null;
        tokenCreatedAt = 0;
        showVerificationPending('Refreshing the background security check so your upload stays protected.');
        if (window.turnstile?.reset) window.turnstile.reset(widgetId);
      }, TOKEN_REFRESH_AFTER_MS);
    };

    const onTokenReady = (challengeToken: string) => {
      token = challengeToken;
      tokenCreatedAt = Date.now();
      verificationIssue = null;
      scheduleTokenRefresh();
      
      // AUTO-START UPLOAD: If a file is waiting and we have a token, upload immediately
      if (selectedFile && !isUploading && status.dataset.state !== 'error' && status.dataset.state !== 'success') {
        void uploadFile();
      }
    };

    const startVerification = async () => {
      if (disposed || widgetId || isInitializing) return;
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        verificationIssue = 'Upload verification is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY in Vercel Environment Variables, then redeploy.';
        if (selectedFile) {
          uploadBox.classList.remove('is-processing');
          setStatus('error', verificationIssue);
        }
        return;
      }

      isInitializing = true;
      try {
        const turnstile = await ensureTurnstileLoaded();
        if (disposed) return;
        widgetId = turnstile.render(turnstileMount, {
          sitekey: siteKey,
          theme: 'light',
          size: 'invisible',
          execution: 'render',
          appearance: 'interaction-only',
          callback: onTokenReady,
          'error-callback': () => {
            token = null;
            tokenCreatedAt = 0;
            verificationIssue = 'The background security check could not be completed. Please try again.';
            if (selectedFile && !isUploading) {
              uploadBox.classList.remove('is-processing');
              setStatus('error', verificationIssue);
            }
          },
          'expired-callback': () => {
            token = null;
            tokenCreatedAt = 0;
            clearTokenRefreshTimer();
            if (selectedFile && !isUploading) {
              showVerificationPending('Refreshing the background security check before upload.');
            }
            if (!disposed && widgetId && window.turnstile?.reset) {
              window.setTimeout(() => {
                if (!disposed && widgetId && window.turnstile?.reset) window.turnstile.reset(widgetId);
              }, 0);
            }
          },
        });
      } catch (error) {
        verificationIssue = error instanceof Error
          ? error.message
          : 'Security verification could not be loaded.';
        if (selectedFile) {
          uploadBox.classList.remove('is-processing');
          setStatus('error', verificationIssue);
        }
      } finally {
        isInitializing = false;
      }
    };

    const requestFreshToken = () => {
      token = null;
      tokenCreatedAt = 0;
      clearTokenRefreshTimer();
      if (widgetId && window.turnstile?.reset) {
        window.turnstile.reset(widgetId);
      } else {
        void startVerification();
      }
    };

    const uploadFile = async () => {
      if (!selectedFile || !token || isUploading) return;
      if (Date.now() - tokenCreatedAt >= TOKEN_REFRESH_AFTER_MS) {
        showVerificationPending('Refreshing the background security check before upload.');
        requestFreshToken();
        return;
      }

      isUploading = true;
      input.disabled = true;
      uploadBox.classList.add('is-processing');
      setStatus('uploading', 'Transferring your file securely and saving its collection record. Please keep this page open.');
      try {
        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);
        formData.append('turnstileToken', token);
        formData.append('gameTitle', '');
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const payload = await response.json() as { success?: boolean; message?: string; error?: string };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'The upload could not be completed. Please try again.');
        }

        clearTokenRefreshTimer();
        setStatus('success', payload.message || 'Thank you! Your file was uploaded successfully.');
        uploadBox.classList.remove('is-processing');
        
        // Clear the selected file so it doesn't auto-upload again on token refresh
        selectedFile = null; 
        token = null;
        tokenCreatedAt = 0;
        
        if (widgetId && window.turnstile?.remove) window.turnstile.remove(widgetId);
        widgetId = undefined;
      } catch (error) {
        uploadBox.classList.remove('is-processing');
        setStatus('error', error instanceof Error ? error.message : 'The upload could not be completed. Please try again.');
        requestFreshToken();
      } finally {
        isUploading = false;
        input.disabled = false;
      }
    };

    const handleFile = (file?: File) => {
      if (!file || isUploading) return;
      selectedFile = file;
      uploadBox.classList.remove('is-processing');
      
      // Clear previous error state when a new file is selected
      if (status.dataset.state === 'error') {
        status.dataset.state = 'idle';
      }

      if (file.size <= 0) {
        setStatus('error', 'The selected file is empty. Please choose a valid save file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setStatus('error', `The selected file exceeds the ${MAX_FILE_SIZE_LABEL} size limit.`);
        return;
      }
      if (!isAllowedExtension(file.name)) {
        setStatus('error', `Unsupported file type: ${getExtension(file.name) || 'no extension'}. Please choose a supported save-file format.`);
        return;
      }

      const tokenIsFresh = Boolean(token) && Date.now() - tokenCreatedAt < TOKEN_REFRESH_AFTER_MS;
      if (tokenIsFresh) {
        // Token is already ready, upload immediately
        void uploadFile();
      } else {
        // Token isn't ready, show verifying state. Turnstile will trigger the upload via onTokenReady
        showVerificationPending(verificationIssue || 'Verifying secure connection...');
        if (widgetId && token) {
          requestFreshToken();
        } else if (widgetId && verificationIssue && !isInitializing) {
          requestFreshToken();
        } else if (!widgetId && !isInitializing) {
          void startVerification();
        }
      }
    };

    const onInputChange = () => handleFile(input.files?.[0]);
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      uploadBox.classList.add('is-dragover');
    };
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget instanceof Node && uploadBox.contains(event.relatedTarget)) return;
      uploadBox.classList.remove('is-dragover');
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      uploadBox.classList.remove('is-dragover');
      handleFile(event.dataTransfer?.files?.[0]);
    };
    const onLabelKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
      }
    };

    input.addEventListener('change', onInputChange);
    uploadBox.addEventListener('dragover', onDragOver);
    uploadBox.addEventListener('dragleave', onDragLeave);
    uploadBox.addEventListener('drop', onDrop);
    pickerLabel?.addEventListener('keydown', onLabelKeydown);

    void startVerification();

    return () => {
      disposed = true;
      clearTokenRefreshTimer();
      input.removeEventListener('change', onInputChange);
      uploadBox.removeEventListener('dragover', onDragOver);
      uploadBox.removeEventListener('dragleave', onDragLeave);
      uploadBox.removeEventListener('drop', onDrop);
      pickerLabel?.removeEventListener('keydown', onLabelKeydown);
      if (widgetId && window.turnstile?.remove) window.turnstile.remove(widgetId);
    };
  }, []);

  return <div className="editorsaves-home" dangerouslySetInnerHTML={{ __html: HOME_HTML }} />;
}
