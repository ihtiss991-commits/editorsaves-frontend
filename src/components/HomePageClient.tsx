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
<style>
  /* FIX: Reduce excessive padding between Header and Badge, and reveal the buttons */
  .editorsaves-home .hero {
    padding: 60px 0 80px !important;
  }
  @media (max-width: 720px) {
    .editorsaves-home .hero {
      padding: 40px 0 60px !important;
    }
  }
</style>

<!-- Hero -->
<header class="hero">
<div class="wrap">
<span class="badge">Free · Browser‑based · No install</span>
<h1>Editorsaves — Edit Game Saves Safely and Easily</h1>
<p>
          Save Editor is a powerful, free online tool that lets you modify game save files in seconds.
          Change money, items, skills, and more — without risking your progress. Built for players
          who want control, speed, and peace of mind.
        </p>
<div class="hero-actions">
<a class="btn" href="#upload-box">Upload file now</a>
<a class="btn secondary" href="/blog">Blog — Coming Soon</a>
</div>
</div>
</header>

<!-- Upload Box Section -->
<section class="upload-section">
<div class="wrap">
<div class="upload-container" id="upload-box">
<div class="upload-topline" aria-hidden="true">
  <span class="upload-topline-pill"><span class="upload-topline-spark"></span> Secure save-file collection</span>
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
<h3>Upload your save file</h3>
<p>Drag &amp; drop your save file here, or click to browse</p>
<input accept=".rpgsave,.rmmzsave,.save,.rvdata2,.rvdata,.rxdata,.sav,.dat,.json,.xml,.sqlite,.db,.plr,.wld,.rsv,.sol,.sgs,.qsp,.ksd,.pkl,.pickle,.es3,.lsd" aria-label="Choose a game save file" class="file-input" id="save-file" name="file" type="file"/>
<div class="upload-select-row">
  <label aria-controls="save-file" class="btn" for="save-file" role="button" tabindex="0">Select File</label>
  <span class="upload-select-hint">or drop it anywhere in this box</span>
</div>
<div aria-live="polite" data-state="idle" hidden="" id="esUploadStatus" role="status"></div>
<div aria-label="Security verification" id="turnstileMount"></div>
<button class="btn" disabled="" hidden="" id="upload-file-btn" type="button">Upload Save File</button>
<div class="upload-trustline" aria-hidden="true">
  <span class="upload-trustline-item"><svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="4" y="10" width="16" height="11" rx="2"/><path d="m9 15 2 2 4-4"/></svg> Secure upload</span>
  <span class="upload-trustline-divider"></span>
  <span class="upload-trustline-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg> No account required</span>
</div>
</div>
</div>
</section>

<!-- Introduction / What is a save editor -->
<section>
<div class="wrap prose">
<h2>What Is a Save Editor — and Why Do You Need One?</h2>
<p>
          A save editor is a specialized tool that reads and modifies the save files created by video
          games. Every time you play a game, it stores your progress — your character’s level, your
          inventory, your in‑game currency, quest states, and much more — in a save file. A save editor
          gives you direct, structured access to that data so you can change it deliberately.
        </p>
<p>
          Whether you want to recover from a corrupted save, experiment with a build you would not
          normally try, or simply skip the grind after a long day, a save editor puts the control back
          in your hands. Unlike cheat codes or memory editors, a save editor works on the save file
          itself — it does not touch the game’s running process, which makes it cleaner and generally
          safer when used correctly.
        </p>
<div class="highlight-block">
<p>
            Our <strong>Save Editor</strong> is designed to be approachable for beginners and powerful
            enough for advanced users. It runs entirely in your browser, so there is nothing to install,
            no shady executables to trust, and no background processes running on your machine. You
            upload a save file, choose what you want to change, and download the edited file. That is it.
          </p>
</div>
<div class="note">
<strong>Important:</strong> Always back up your original save file before editing. Even
          the best tools can produce unexpected results if a value is outside the range the game
          expects. A simple copy‑paste of your save folder takes seconds and can save you hours.
        </div>
</div>
</section>

<!-- How it works -->
<section class="alt" id="how-it-works">
<div class="wrap">
<h2>How the Save Editor Works — Three Simple Steps</h2>
<p class="section-lead">
          You do not need to be a programmer or a modder. The workflow is intentionally simple, and
          every step is reversible because you keep your original file.
        </p>
<div class="grid cols-3">
<div class="card">
<span class="badge">Step 1</span>
<h3>Upload your save file</h3>
<p>
              Locate your game’s save folder (we provide guides for popular titles in our
              <a href="/blog">blog</a>) and upload the file. The editor reads the structure and
              shows you the editable values it recognizes.
            </p>
</div>
<div class="card">
<span class="badge">Step 2</span>
<h3>Change what you want</h3>
<p>
              Adjust currency, experience, item quantities, skill points, and other supported fields.
              You see the exact values before you commit — no guesswork.
            </p>
</div>
<div class="card">
<span class="badge">Step 3</span>
<h3>Download and play</h3>
<p>
              Export the edited save, place it back in the game’s save folder, and launch the game.
              Your changes are applied. If anything looks wrong, restore your backup and try again.
            </p>
</div>
</div>
</div>
</section>

<!-- Features -->
<section>
<div class="wrap">
<h2>Everything You Need in a Save Editor</h2>
<p class="section-lead">
          We built Save Editor around the features players actually use — not a bloated list of
          half‑working options.
        </p>
<div class="grid cols-3">
<div class="card icon-card feature-card">
<h3>Smart value detection</h3>
<p>
              The editor identifies common data types and highlights fields that are safe to modify.
              You do not need to understand hex offsets or binary structures.
            </p>
</div>
<div class="card icon-card feature-card">
<h3>Privacy‑first, browser‑based</h3>
<p>
              Your save file is processed locally in your browser whenever possible. We do not
              permanently store your saves, and we never ask for account credentials.
            </p>
</div>
<div class="card icon-card feature-card">
<h3>Backup and restore built in</h3>
<p>
              Before applying any change, the tool creates a reversible copy of the original state
              in your session. You can undo edits without leaving the page.
            </p>
</div>
<div class="card icon-card feature-card">
<h3>Broad game support</h3>
<p>
              We actively maintain support for popular single‑player titles and are transparent
              about what is and is not editable. Check our <a href="/blog">blog</a> for the
              latest compatibility notes.
            </p>
</div>
<div class="card icon-card feature-card">
<h3>No installation, no bloat</h3>
<p>
              There is no desktop app to download, no browser extension to grant permissions to,
              and no “pro” version that removes basic features. The core editor is free.
            </p>
</div>
<div class="card icon-card feature-card">
<h3>Guides and documentation</h3>
<p>
              New to save editing? Our <a href="/blog">blog</a> publishes step‑by‑step guides,
              safety checklists, and explanations of how save files work under the hood.
            </p>
</div>
</div>
</div>
</section>

<!-- Supported games & use cases -->
<section class="alt">
<div class="wrap">
<h2>What Can You Edit — and Which Games Are Supported?</h2>
<div class="prose">
<p>
            Save Editor is not a one‑game tool. It is built on a flexible parsing engine that we
            extend over time. The table below shows the categories of data we support most reliably.
            For a current list of specific games, see the compatibility section on our
            <a href="/blog">blog</a>.
          </p>
</div>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Data category</th>
<th>What you can change</th>
<th>Typical use case</th>
</tr>
</thead>
<tbody>
<tr>
<td>Currency &amp; resources</td>
<td>Gold, credits, gems, crafting materials</td>
<td>Skip repetitive farming; recover from a bad purchase</td>
</tr>
<tr>
<td>Character progression</td>
<td>Level, XP, skill points, attribute points</td>
<td>Try a late‑game build without a full playthrough</td>
</tr>
<tr>
<td>Inventory &amp; items</td>
<td>Item quantities, durability, unlock flags</td>
<td>Replace a lost quest item; experiment with gear</td>
</tr>
<tr>
<td>Quest &amp; world state</td>
<td>Quest stages, discovered locations, faction standing</td>
<td>Recover from a broken quest trigger</td>
</tr>
</tbody>
</table>
</div>
<div class="prose">
<h3>Common reasons players use a save editor</h3>
<ul>
<li>
<strong>Recovery:</strong> A quest item disappeared, a save corrupted after a crash,
              or an NPC is stuck. Editing the save can sometimes repair the state without starting over.
            </li>
<li>
<strong>Experimentation:</strong> You want to test a build, weapon, or playstyle
              before committing dozens of hours to it.
            </li>
<li>
<strong>Time respect:</strong> You have limited play time and want to focus on the
              parts of the game you enjoy, not the grind.
            </li>
<li>
<strong>Accessibility:</strong> Some players use save editing to adjust difficulty
              or remove barriers that make the game less enjoyable for them.
            </li>
</ul>
<p>
            We believe save editing is a legitimate way to engage with single‑player games. It is
            your save file, on your machine, and your experience. Our role is to make the process
            transparent and safe, not to judge why you want to use it.
          </p>
</div>
</div>
</section>

<!-- Safety and ethics -->
<section>
<div class="wrap">
<h2>Safety, Ethics, and Responsible Editing</h2>
<div class="grid cols-2 safety-grid">
<div class="card icon-card">
<h3>Always back up first</h3>
<p>
              This cannot be said enough: copy your original save file to a separate folder before
              you edit. If the game updates, if the editor misreads a value, or if you simply change
              your mind, the backup is your safety net.
            </p>
</div>
<div class="card icon-card">
<h3>Single‑player only</h3>
<p>
              Save editing is intended for single‑player, offline experiences. Using edited saves in
              multiplayer modes can violate the game’s terms of service, disrupt other players, or
              trigger anti‑cheat systems. We do not support or encourage that use.
            </p>
</div>
<div class="card icon-card">
<h3>Respect the developers</h3>
<p>
              Save editing is not about piracy or bypassing payments. It is about modifying a file
              you already own, for a game you already bought. If you enjoy a game, support the
              developers by buying it legitimately and recommending it to others.
            </p>
</div>
<div class="card icon-card">
<h3>Understand the limits</h3>
<p>
              Not every value is safe to change. Some games use checksums, encrypted sections, or
              server‑side validation. Our editor will warn you when a file appears to use these
              protections, but no tool can guarantee compatibility with every game version. If a
              game receives a major update, wait for compatibility notes before editing.
            </p>
</div>
</div>
<div class="note">
<strong>Transparency:</strong> We publish known limitations and compatibility updates
          on our <a href="/blog">blog</a>. If you are unsure whether a specific edit is safe,
          ask in the comments or <a href="/contact">contact us</a> before applying it.
        </div>
</div>
</section>

<!-- Comparison / why us -->
<section class="alt">
<div class="wrap">
<h2>Why Choose Save Editor Over Other Tools?</h2>
<div class="prose">
<p>
            There is no shortage of save editors, cheat engines, and modding tools. Here is how we
            approach the problem differently.
          </p>
</div>
<div class="grid cols-4 why">
<div class="card icon-card">
<h3>Browser‑first, not install‑first</h3>
<p>
              Many save editors require you to download an executable from an unknown source. We
              run in your browser, which means fewer permissions, easier updates, and no leftover
              files on your system.
            </p>
</div>
<div class="card icon-card">
<h3>Safety is a feature, not an afterthought</h3>
<p>
              We build reversible edits, clear warnings, and backup reminders into the workflow.
              A tool that lets you edit without understanding the risk is not helping you.
            </p>
</div>
<div class="card icon-card">
<h3>No dark patterns</h3>
<p>
              The core editor is free. We do not hide basic functionality behind a paywall, and we
              do not require an account to edit a file. If we add premium features in the future,
              they will be clearly optional.
            </p>
</div>
<div class="card icon-card">
<h3>Documentation you can actually read</h3>
<p>
              Our <a href="/blog">blog</a> explains how save files work, what different data types
              mean, and how to troubleshoot common issues. We want you to understand what you are
              doing, not just click buttons.
            </p>
</div>
</div>
</div>
</section>

<!-- FAQ -->
<section>
<div class="wrap">
<h2>Frequently Asked Questions</h2>
<div class="prose" style="margin-top: 8px;">
<details class="faq-item" open="">
<summary>Is Save Editor really free?</summary>
<p>
              Yes. The core save editing features are free to use. You do not need an account, a
              subscription, or a credit card. We may introduce optional premium features later, but
              basic editing will remain available at no cost.
            </p>
</details>
<details class="faq-item">
<summary>Will editing my save get me banned?</summary>
<p>
              In single‑player games, save editing is generally not a bannable offense because
              there is no multiplayer server to enforce rules. However, using edited saves in
              multiplayer or online modes can violate terms of service and may lead to penalties.
              Always keep edits offline.
            </p>
</details>
<details class="faq-item">
<summary>Do you store my save files?</summary>
<p>
              Whenever technically possible, processing happens locally in your browser. We do not
              permanently store your save files on our servers, and we do not share them with third
              parties. See our <a href="/privacy">privacy policy</a> for details.
            </p>
</details>
<details class="faq-item">
<summary>What if my game is not supported?</summary>
<p>
              Check the <a href="/blog">blog</a> for the current compatibility list. If your game
              is not listed, you can <a href="/contact">contact us</a> and request it. We prioritize
              games based on demand and technical feasibility.
            </p>
</details>
<details class="faq-item">
<summary>Can I undo an edit?</summary>
<p>
              Yes — if you kept a backup of your original save, you can always restore it. Within
              the editor, reversible changes are held in your session so you can undo before
              downloading. Once you overwrite the original file without a backup, recovery may not
              be possible.
            </p>
</details>
<details class="faq-item">
<summary>Is save editing legal?</summary>
<p>
              Modifying a save file on your own device for a game you legally own is generally
              lawful in most jurisdictions. It may violate a game’s end‑user license agreement in
              some cases, especially if used online. We encourage responsible, offline use. This is
              not legal advice; consult a professional if you have specific concerns.
            </p>
</details>
</div>
</div>
</section>

<!-- Closing / CTA -->
<section style="padding-bottom: 120px;">
<div class="wrap">
<div class="cta-panel">
<h2>Take Control of Your Save Files</h2>
<p>
            Whether you are recovering from a bug, testing a build, or simply playing the game on
            your own terms, Save Editor gives you a clean, safe, and fast way to edit your saves.
            No install. No account. Just your file, your rules.
          </p>
<div class="hero-actions">
<a class="btn" href="#upload-box">Upload a Save File</a>
<a class="btn secondary" href="/about">Learn About Us</a>
</div>
</div>
</div>
</section>
`;

function ensureTurnstileLoaded(): Promise<TurnstileInstance> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  const existing = document.querySelector<HTMLScriptElement>('script[data-editorsaves-turnstile]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Security verification could not be loaded.')), 15000);
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
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Security verification loaded without its API.'));
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
    const submitButton = root?.querySelector<HTMLButtonElement>('#upload-file-btn');
    const status = root?.querySelector<HTMLElement>('#esUploadStatus');
    const turnstileMount = root?.querySelector<HTMLElement>('#turnstileMount');
    if (!root || !input || !uploadBox || !submitButton || !status || !turnstileMount) return;

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
      submitButton.hidden = false;
      submitButton.disabled = true;
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
      if (selectedFile && !submitButton.hidden && !isUploading) {
        submitButton.disabled = false;
        // Preserve a clear error until the visitor tries again, while still making a refreshed token ready.
        if (status.dataset.state !== 'error') {
          uploadBox.classList.remove('is-processing');
          setStatus('info', 'The background security check is ready. Your file has not been uploaded yet. Select “Upload Save File” when you are ready.');
        }
      }
    };

    const startVerification = async () => {
      if (disposed || widgetId || isInitializing) return;
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        verificationIssue = 'Upload verification is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY in Vercel Environment Variables, then redeploy.';
        if (selectedFile) {
          uploadBox.classList.remove('is-processing');
          submitButton.hidden = true;
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
            submitButton.disabled = true;
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
          submitButton.hidden = true;
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
      submitButton.disabled = true;
      input.disabled = true;
      uploadBox.classList.add('is-processing');
      setStatus('uploading', 'Transferring your file securely and saving its collection record. Please keep this page open.');
      try {
        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);
        formData.append('turnstileToken', token);
        // The existing homepage does not collect a game title; the API accepts it as optional.
        formData.append('gameTitle', '');
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const payload = await response.json() as { success?: boolean; message?: string; error?: string };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'The upload could not be completed. Please try again.');
        }

        clearTokenRefreshTimer();
        setStatus('success', payload.message || 'Thank you! Your file was uploaded successfully.');
        uploadBox.classList.remove('is-processing');
        submitButton.hidden = true;
        submitButton.disabled = true;
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
        if (selectedFile && !submitButton.hidden && token && Date.now() - tokenCreatedAt < TOKEN_REFRESH_AFTER_MS) {
          submitButton.disabled = false;
        }
      }
    };

    const handleFile = (file?: File) => {
      if (!file || isUploading) return;
      selectedFile = file;
      uploadBox.classList.remove('is-processing');

      if (file.size <= 0) {
        submitButton.hidden = true;
        setStatus('error', 'The selected file is empty. Please choose a valid save file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        submitButton.hidden = true;
        setStatus('error', `The selected file exceeds the ${MAX_FILE_SIZE_LABEL} size limit.`);
        return;
      }
      if (!isAllowedExtension(file.name)) {
        submitButton.hidden = true;
        setStatus('error', `Unsupported file type: ${getExtension(file.name) || 'no extension'}. Please choose a supported save-file format.`);
        return;
      }

      submitButton.hidden = false;
      const tokenIsFresh = Boolean(token) && Date.now() - tokenCreatedAt < TOKEN_REFRESH_AFTER_MS;
      if (tokenIsFresh) {
        submitButton.disabled = false;
        setStatus('info', 'The background security check is ready. Your file has not been uploaded yet. Select “Upload Save File” when you are ready.');
      } else {
        showVerificationPending(verificationIssue || 'Finishing the background security check. Your file has not been uploaded yet.');
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
    const onSubmitClick = () => { void uploadFile(); };
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
    submitButton.addEventListener('click', onSubmitClick);
    uploadBox.addEventListener('dragover', onDragOver);
    uploadBox.addEventListener('dragleave', onDragLeave);
    uploadBox.addEventListener('drop', onDrop);
    pickerLabel?.addEventListener('keydown', onLabelKeydown);

    // Start Turnstile as soon as the homepage mounts; the visitor does not need to reach the upload box first.
    void startVerification();

    return () => {
      disposed = true;
      clearTokenRefreshTimer();
      input.removeEventListener('change', onInputChange);
      submitButton.removeEventListener('click', onSubmitClick);
      uploadBox.removeEventListener('dragover', onDragOver);
      uploadBox.removeEventListener('dragleave', onDragLeave);
      uploadBox.removeEventListener('drop', onDrop);
      pickerLabel?.removeEventListener('keydown', onLabelKeydown);
      if (widgetId && window.turnstile?.remove) window.turnstile.remove(widgetId);
    };
  }, []);

  return <div className="editorsaves-home" dangerouslySetInnerHTML={{ __html: HOME_HTML }} />;
}
