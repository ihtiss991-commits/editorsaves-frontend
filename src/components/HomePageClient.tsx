'use client';

import { useEffect } from 'react';
import { getExtension, isAllowedExtension, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL } from '@/lib/constants';

type TurnstileInstance = {
  render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'error-callback'?: () => void; 'expired-callback'?: () => void; theme?: 'light' | 'dark' | 'auto' }) => string;
  reset?: (widgetId?: string) => void;
  remove?: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

const HOME_HTML = String.raw`<!-- ============================================
     SCROLL PROGRESS BAR
     ============================================ -->
<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

<!-- ============================================
     HERO SECTION
     ============================================ -->
<section class="hero" aria-label="Upload your save file">
    <div class="hero-bg" aria-hidden="true">
        <div class="grid-lines"></div>
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="orb orb-4"></div>
    </div>

    <div class="container">
        <div class="hero-content">
            <h1>
                <span class="line">Universal Save Editor Online —</span>
                <span class="line"><span class="gradient-text">Built for Game Save Files</span></span>
            </h1>

            <p class="hero-subtitle">
                <strong>EditorSaves</strong> is building a universal game save editor for RPG Maker, Ren'Py, Unity, Unreal Engine, and other save formats. During Phase 1, upload real save files for format research as we build the editing system.
            </p>

            <div class="upload-wrapper">
                <div class="upload-card">
                    <div class="upload-inner" id="uploadInner" role="button" tabindex="0" aria-label="Upload your save file">
                        <div class="upload-icon-wrapper">
                            <div class="upload-icon-bg"></div>
                            <svg class="upload-icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                        </div>

                        <div class="upload-title">Drop your save file here</div>
                        <div class="upload-subtitle">We'll automatically detect the format and open the editor</div>

                        <div class="upload-actions">
                            <button class="btn-primary" type="button" id="uploadBtn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                Upload Save File
                            </button>
                            <span class="upload-or">or click anywhere in this box</span>
                        </div>

                        <div class="upload-limits">
                            <span class="limit-item">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                Max 25MB per file
                            </span>
                            <span class="limit-item">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                .rpgsave · .rmmzsave · .sav · .rvdata2 · .json
                            </span>
                            <span class="limit-item">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                23 supported formats
                            </span>
                        </div>

                        <div class="trust-badge">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Your files are processed securely and never shared with third parties
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     SOCIAL PROOF BAR
     ============================================ -->
<section class="social-proof" aria-label="Trust statistics">
    <div class="container">
        <div class="social-proof-inner">
            <div class="proof-stat" data-value="23" data-suffix="+">
                <div class="proof-icon green">
                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                </div>
                <div class="proof-number">0+</div>
                <div class="proof-label">Supported Formats</div>
            </div>

            <div class="proof-stat" data-value="100" data-suffix="%">
                <div class="proof-icon blue">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>
                </div>
                <div class="proof-number">0%</div>
                <div class="proof-label">Free Forever</div>
            </div>

            <div class="proof-stat" data-value="2" data-prefix="&lt; " data-suffix=" min">
                <div class="proof-icon purple">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="proof-number">&lt; 0 min</div>
                <div class="proof-label">Average Edit Time</div>
            </div>

            <div class="proof-stat" data-value="0" data-suffix="">
                <div class="proof-icon amber">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </div>
                <div class="proof-number">0</div>
                <div class="proof-label">Installations Required</div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     ABOUT SECTION
     ============================================ -->
<section class="section about-section" aria-label="What is EditorSaves">
    <div class="section-bg" aria-hidden="true">
        <div class="dot-grid"></div>
        <div class="orb orb-a"></div>
        <div class="orb orb-b"></div>
    </div>
    <div class="container">
        <div class="about-grid">
            <div class="about-content reveal-left">
                <div class="section-eyebrow">What Is EditorSaves?</div>
                <h2 class="section-title">The Universal Save Editor Built for Every Game</h2>
                <p>
                    <strong>EditorSaves</strong> is a free, browser-based universal save editor that lets you modify game save files without downloading any software. Whether you're stuck in an RPG, want to change your inventory in a visual novel, or need to tweak stats in a Unity game, our tool handles it — directly in your browser.
                </p>
                <p>
                    Unlike traditional save editors that require you to install executables or navigate complex hex editors, EditorSaves uses a <strong>visual tree editor</strong> that displays all your save data in a clean, searchable interface. Change gold, items, stats, variables, and text values with a few clicks — no coding knowledge required.
                </p>
                <p>
                    Learn more about the project on our <a href="/about">About EditorSaves</a> page.
                </p>

                <ul class="about-checklist">
                    <li>
                        <span class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
                        <span>Supports RPG Maker MV, MZ, VX Ace, XP, and 2000/2003</span>
                    </li>
                    <li>
                        <span class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
                        <span>Handles Ren'Py, Unity, Unreal Engine, and Godot saves</span>
                    </li>
                    <li>
                        <span class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
                        <span>Works with SQLite, JSON, XML, Pickle, MessagePack, and CBOR</span>
                    </li>
                    <li>
                        <span class="check-icon"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
                        <span>Privacy-first design — your files are never shared</span>
                    </li>
                </ul>
            </div>

            <div class="about-visual reveal-right reveal-delay-2">
                <img
                    src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80&auto=format&fit=crop"
                    alt="Gaming setup with a save editor open on screen"
                    width="800"
                    height="520"
                    loading="lazy"
                    decoding="async">
                <div class="floating-card card-1">
                    <div class="fc-icon green">
                        <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="16" cy="11" r="1"/><circle cx="18" cy="13" r="1"/></svg>
                    </div>
                    <div class="fc-text">
                        <span class="fc-label">Detected</span>
                        <span class="fc-value">RPG Maker MV</span>
                    </div>
                </div>
                <div class="floating-card card-2">
                    <div class="fc-icon blue">
                        <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <div class="fc-text">
                        <span class="fc-label">Edit Time</span>
                        <span class="fc-value">1m 47s</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     UNIVERSAL SAVE EDITOR EXPLAINER
     ============================================ -->
<section class="section prose-section" aria-label="What is a universal save editor">
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">Universal Save Editor</div>
            <h2 class="section-title">What Is a Universal Save Editor?</h2>
            <p class="section-desc">A universal save editor aims to give players one place to inspect and work with save files from many games and engines instead of relying on a different utility for every title.</p>
        </div>
        <div class="prose-grid prose-grid-2">
            <article class="prose-card reveal reveal-delay-1">
                <div class="prose-card-top">
                    <div class="prose-card-icon blue">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">01</span>
                </div>
                <p>A game-specific editor is usually designed around one title's known save structure. It can be excellent for that one game, but its usefulness ends when you switch to a different engine, version, or format. A universal approach looks for shared building blocks such as structured data, serialization layers, compression, and recognizable fields while still respecting the differences between games.</p>
            </article>
            <article class="prose-card reveal reveal-delay-2">
                <div class="prose-card-top">
                    <div class="prose-card-icon green">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">02</span>
                </div>
                <p>For players, that matters because save files can be scattered across folders and built with very different technologies. A single browser-based workflow can make it easier to identify a file, understand what it contains, and eventually make controlled changes without installing several separate tools. EditorSaves is studying real files during Phase 1 so that future editing support can be built around actual formats and edge cases rather than assumptions. The goal is broad compatibility without pretending that every file can already be edited safely.</p>
            </article>
        </div>
    </div>
</section>

<!-- ============================================
     FORMATS SECTION (DARK PREMIUM)
     ============================================ -->
<section class="section formats-section" aria-label="Supported save formats">
    <div class="section-bg" aria-hidden="true">
        <div class="grid-lines"></div>
        <div class="orb orb-c"></div>
        <div class="orb orb-d"></div>
    </div>
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">Supported Formats</div>
            <h2 class="section-title">Every Save Format You'll Ever Need</h2>
            <p class="section-desc">
                Our editor automatically detects your save file's format and opens the right parser. No configuration, no guessing, no errors.
            </p>
        </div>

        <div class="formats-categories">
            <div class="format-category reveal reveal-delay-1">
                <div class="format-category-header">
                    <div class="format-category-icon green">
                        <svg viewBox="0 0 24 24"><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
                    </div>
                    <div>
                        <div class="format-category-title">RPG Maker Series</div>
                        <div class="format-category-subtitle">The most popular indie RPG engine</div>
                    </div>
                </div>
                <div class="format-tags">
                    <span class="format-tag">RPG Maker MV <span class="tag-ext">.rpgsave</span></span>
                    <span class="format-tag">RPG Maker MZ <span class="tag-ext">.rmmzsave</span></span>
                    <span class="format-tag">RPG Maker VX Ace <span class="tag-ext">.rvdata2</span></span>
                    <span class="format-tag">RPG Maker VX <span class="tag-ext">.rvdata</span></span>
                    <span class="format-tag">RPG Maker XP <span class="tag-ext">.rxdata</span></span>
                    <span class="format-tag">RPG Maker 2000/2003 <span class="tag-ext">.lsd</span></span>
                </div>
            </div>

            <div class="format-category reveal reveal-delay-2">
                <div class="format-category-header">
                    <div class="format-category-icon purple">
                        <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                    <div>
                        <div class="format-category-title">Visual Novel Engines</div>
                        <div class="format-category-subtitle">Ren'Py, TyranoBuilder, Naninovel, and more</div>
                    </div>
                </div>
                <div class="format-tags">
                    <span class="format-tag">Ren'Py <span class="tag-ext">.save</span></span>
                    <span class="format-tag">TyranoBuilder <span class="tag-ext">.sav</span></span>
                    <span class="format-tag">Naninovel <span class="tag-ext">.json</span></span>
                    <span class="format-tag">KiriKiri <span class="tag-ext">.ksd</span></span>
                    <span class="format-tag">NScripter <span class="tag-ext">.dat</span></span>
                    <span class="format-tag">Wolf RPG Editor <span class="tag-ext">.sav</span></span>
                </div>
            </div>

            <div class="format-category reveal reveal-delay-3">
                <div class="format-category-header">
                    <div class="format-category-icon blue">
                        <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 15l2-6 3 6 3-6 2 6"/></svg>
                    </div>
                    <div>
                        <div class="format-category-title">Modern Game Engines</div>
                        <div class="format-category-subtitle">Unity, Unreal Engine, and Godot</div>
                    </div>
                </div>
                <div class="format-tags">
                    <span class="format-tag">Unity PlayerPrefs <span class="tag-ext">.xml</span></span>
                    <span class="format-tag">Unity JSON <span class="tag-ext">.json</span></span>
                    <span class="format-tag">Easy Save 2 <span class="tag-ext">.txt</span></span>
                    <span class="format-tag">Easy Save 3 <span class="tag-ext">.es3</span></span>
                    <span class="format-tag">Unreal Engine <span class="tag-ext">.sav</span></span>
                    <span class="format-tag">Godot <span class="tag-ext">.save</span></span>
                </div>
            </div>

            <div class="format-category reveal reveal-delay-4">
                <div class="format-category-header">
                    <div class="format-category-icon amber">
                        <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    <div>
                        <div class="format-category-title">Serialization & Generic Formats</div>
                        <div class="format-category-subtitle">For custom, indie, and legacy game engines</div>
                    </div>
                </div>
                <div class="format-tags">
                    <span class="format-tag">Python Pickle <span class="tag-ext">.pkl</span></span>
                    <span class="format-tag">Ruby Marshal <span class="tag-ext">.rxdata</span></span>
                    <span class="format-tag">JSON <span class="tag-ext">.json</span></span>
                    <span class="format-tag">XML <span class="tag-ext">.xml</span></span>
                    <span class="format-tag">MessagePack <span class="tag-ext">.msgpack</span></span>
                    <span class="format-tag">CBOR <span class="tag-ext">.cbor</span></span>
                    <span class="format-tag">Protocol Buffers <span class="tag-ext">.pb</span></span>
                    <span class="format-tag">plist <span class="tag-ext">.plist</span></span>
                </div>
            </div>

            <div class="format-category reveal reveal-delay-5">
                <div class="format-category-header">
                    <div class="format-category-icon cyan">
                        <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                    </div>
                    <div>
                        <div class="format-category-title">Databases & Storage</div>
                        <div class="format-category-subtitle">For games that use embedded databases</div>
                    </div>
                </div>
                <div class="format-tags">
                    <span class="format-tag">SQLite <span class="tag-ext">.db</span></span>
                    <span class="format-tag">SQLite3 <span class="tag-ext">.sqlite3</span></span>
                    <span class="format-tag">RocksDB <span class="tag-ext">.sst</span></span>
                    <span class="format-tag">LevelDB <span class="tag-ext">.ldb</span></span>
                </div>
            </div>

            <div class="format-category reveal reveal-delay-6">
                <div class="format-category-header">
                    <div class="format-category-icon rose">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    </div>
                    <div>
                        <div class="format-category-title">Game-Specific Formats</div>
                        <div class="format-category-subtitle">Individual games with custom save formats</div>
                    </div>
                </div>
                <div class="format-tags">
                    <span class="format-tag">Terraria <span class="tag-ext">.plr</span></span>
                    <span class="format-tag">Terraria World <span class="tag-ext">.wld</span></span>
                    <span class="format-tag">The Witcher 3 <span class="tag-ext">.sav</span></span>
                    <span class="format-tag">Flash SharedObjects <span class="tag-ext">.sol</span></span>
                    <span class="format-tag">RAGS Player <span class="tag-ext">.rsv</span></span>
                    <span class="format-tag">QSP <span class="tag-ext">.sav</span></span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     SAVE FILE FUNDAMENTALS
     ============================================ -->
<section class="section prose-section prose-section-tinted" aria-label="How game save files work">
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">Save File Fundamentals</div>
            <h2 class="section-title">How Game Save Files Work</h2>
            <p class="section-desc">A save file is simply data written to disk so a game can restore your progress, but the way that data is serialized can vary dramatically.</p>
        </div>
        <div class="prose-grid prose-grid-3">
            <article class="prose-card reveal reveal-delay-1">
                <div class="prose-card-top">
                    <div class="prose-card-icon green">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">01</span>
                </div>
                <p>Some saves are human-readable. JSON and XML store named fields in a text structure that can be inspected with a text editor, while SQLite stores information in a database with tables, rows, and columns. Other engines use binary serialization to make files smaller or faster to load. RPG Maker can involve Ruby Marshal data, while some tools and games use Python Pickle or other language-specific serialization formats.</p>
            </article>
            <article class="prose-card reveal reveal-delay-2">
                <div class="prose-card-top">
                    <div class="prose-card-icon purple">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">02</span>
                </div>
                <p>Serialization is only one layer. A game may also encode or compress the serialized payload before writing it to disk. Base64 can turn binary data into text-safe characters, LZString can compress text efficiently, and Gzip can wrap compressed bytes inside a standard compression stream. These layers can be combined, so a file that appears to contain unreadable characters may actually hold structured game data underneath several transformations.</p>
            </article>
            <article class="prose-card reveal reveal-delay-3">
                <div class="prose-card-top">
                    <div class="prose-card-icon blue">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">03</span>
                </div>
                <p>This is why some saves are easier to edit than others. A plain JSON file can expose obvious fields, while a compressed or binary save may require the exact serializer, version, encoding, and schema before a value can be changed safely. Even when two games share an engine, their save structures can differ because developers choose different fields and data layouts. Phase 1 research helps EditorSaves identify these patterns before promising reliable editing behavior.</p>
            </article>
        </div>
    </div>
</section>

<!-- ============================================
     HOW IT WORKS
     ============================================ -->
<section class="section how-section" aria-label="How it works">
    <div class="section-bg" aria-hidden="true">
        <div class="wave-line"></div>
    </div>
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">How It Works</div>
            <h2 class="section-title">Edit Your Save in Three Simple Steps</h2>
            <p class="section-desc">
                No technical knowledge required. No downloads. No registration. Just upload, edit, and play.
            </p>
        </div>

        <div class="steps-container">
            <div class="step-item reveal reveal-delay-1">
                <div class="step-circle">
                    <svg class="step-icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span class="step-number-badge">1</span>
                </div>
                <h3>Upload Your Save File</h3>
                <p>Drag and drop your save file into the upload box. Our editor automatically detects the format — from RPG Maker MV to Unity to Unreal Engine.</p>
            </div>

            <div class="step-item reveal reveal-delay-3">
                <div class="step-circle">
                    <svg class="step-icon-svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span class="step-number-badge">2</span>
                </div>
                <h3>Edit Values in the Tree View</h3>
                <p>Browse every variable, item, stat, and flag in a clean, searchable interface. Change anything with a few clicks — gold, levels, inventory, story flags.</p>
            </div>

            <div class="step-item reveal reveal-delay-5">
                <div class="step-circle">
                    <svg class="step-icon-svg" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span class="step-number-badge">3</span>
                </div>
                <h3>Download Your Modified Save</h3>
                <p>Click download and get your edited save file instantly. Replace the original in your game folder, and pick up right where you left off.</p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     FEATURES SECTION
     ============================================ -->
<section class="section features-section" aria-label="Why choose EditorSaves">
    <div class="section-bg" aria-hidden="true">
        <div class="grid-lines"></div>
    </div>
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">Why EditorSaves</div>
            <h2 class="section-title">Built for Gamers Who Want More Control</h2>
            <p class="section-desc">
                Every feature is designed to make save editing fast, safe, and accessible — for everyone.
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card reveal reveal-delay-1">
                <div class="feature-icon-wrapper green">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h3>100% Free Forever</h3>
                <p>No subscriptions, no hidden fees, no credit card required. Every feature is available to every user from day one — because gamers shouldn't be locked out of their own saves.</p>
            </div>

            <div class="feature-card reveal reveal-delay-2">
                <div class="feature-icon-wrapper blue">
                    <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <h3>Instant Browser Editing</h3>
                <p>No downloads, no installations, no complicated setup. Edit save files directly in Chrome, Firefox, Edge, or Safari — on desktop, tablet, or mobile.</p>
            </div>

            <div class="feature-card reveal reveal-delay-3">
                <div class="feature-icon-wrapper purple">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3>Privacy-First Design</h3>
                <p>Your files are processed securely and never shared with third parties. You retain full control over your save data, and files are auto-deleted after 30 days.</p>
            </div>

            <div class="feature-card reveal reveal-delay-4">
                <div class="feature-icon-wrapper amber">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <h3>23 Formats Supported</h3>
                <p>From RPG Maker and Ren'Py to Unity, Unreal Engine, SQLite, and generic JSON — we handle the widest range of save formats of any online editor.</p>
            </div>

            <div class="feature-card reveal reveal-delay-5">
                <div class="feature-icon-wrapper rose">
                    <svg viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                </div>
                <h3>Intuitive Visual Editor</h3>
                <p>See every variable, array, and nested object in a beautiful tree view. Edit JSON, numbers, booleans, and text with the same familiar interface.</p>
            </div>

            <div class="feature-card reveal reveal-delay-6">
                <div class="feature-icon-wrapper cyan">
                    <svg viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91 0z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                </div>
                <h3>Actively Expanding</h3>
                <p>We add new formats and improve parsers every week based on real user feedback and uploaded save files. If a game isn't supported today, it might be tomorrow.</p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     USE CASES SECTION
     ============================================ -->
<section class="section usecase-section" aria-label="Use cases">
    <div class="section-bg" aria-hidden="true">
        <div class="orb orb-e"></div>
    </div>
    <div class="container">
        <div class="usecase-grid">
            <div class="usecase-content">
                <div class="section-eyebrow reveal-left">Use Cases</div>
                <h2 class="section-title reveal-left reveal-delay-1">What Gamers Use EditorSaves For</h2>
                <p class="section-desc reveal-left reveal-delay-2">
                    From recovering lost progress to experimenting with builds, our editor is being developed to make save-file work easier for players and technical users.
                </p>

                <div class="usecase-list">
                    <div class="usecase-item">
                        <div class="usecase-icon">
                            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>
                        </div>
                        <div>
                            <h4>Restore Lost Progress</h4>
                            <p>Accidentally delete a save? Corrupted your inventory? Fix it in minutes without replaying hours.</p>
                        </div>
                    </div>

                    <div class="usecase-item">
                        <div class="usecase-icon">
                            <svg viewBox="0 0 24 24"><path d="M4 4h16v6a4 4 0 0 1-4 4h-2v6h-4v-6H8a4 4 0 0 1-4-4V4z"/></svg>
                        </div>
                        <div>
                            <h4>Customize Your Inventory</h4>
                            <p>Add rare items, edit gold, or change equipment — perfect for players who want a custom experience.</p>
                        </div>
                    </div>

                    <div class="usecase-item">
                        <div class="usecase-icon">
                            <svg viewBox="0 0 24 24"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>
                        </div>
                        <div>
                            <h4>Test Different Builds</h4>
                            <p>Try new character builds, stat distributions, and skill trees without hours of grinding.</p>
                        </div>
                    </div>

                    <div class="usecase-item">
                        <div class="usecase-icon">
                            <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        </div>
                        <div>
                            <h4>Unlock Story Paths</h4>
                            <p>Set story flags and variables in visual novels to explore hidden routes and endings.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="usecase-visual reveal-right reveal-delay-2">
                <img
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80&auto=format&fit=crop"
                    alt="Person editing a game save file on a laptop"
                    width="800"
                    height="520"
                    loading="lazy"
                    decoding="async">
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     TESTIMONIALS SECTION
     ============================================ -->
<section class="section testimonials-section" aria-label="Testimonials">
    <div class="section-bg" aria-hidden="true">
        <div class="quote-mark q-1">&ldquo;</div>
        <div class="quote-mark q-2">&ldquo;</div>
    </div>
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">Testimonials</div>
            <h2 class="section-title">Loved by Gamers Worldwide</h2>
            <p class="section-desc">
                Here's what players are saying about EditorSaves.
            </p>
        </div>

        <div class="testimonials-grid">
            <div class="testimonial-card reveal reveal-delay-1">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <p class="testimonial-text">
                    "I was stuck on the final boss of an RPG Maker game and used EditorSaves to boost my level a bit. Took me 30 seconds. This tool is a lifesaver."
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">MR</div>
                    <div class="testimonial-author-info">
                        <span class="testimonial-author-name">Marcus R.</span>
                        <span class="testimonial-author-role">RPG Maker Player</span>
                    </div>
                </div>
            </div>

            <div class="testimonial-card reveal reveal-delay-2">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <p class="testimonial-text">
                    "As a Ren'Py game developer, this tool is a lifesaver for debugging. I can quickly test different story flags without restarting the game."
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">SL</div>
                    <div class="testimonial-author-info">
                        <span class="testimonial-author-name">Sophia L.</span>
                        <span class="testimonial-author-role">Indie Game Developer</span>
                    </div>
                </div>
            </div>

            <div class="testimonial-card reveal reveal-delay-3">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <p class="testimonial-text">
                    "I tried three other save editors before finding this one. EditorSaves was the only one that could open my Unreal Engine .sav file. Incredible."
                </p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">DK</div>
                    <div class="testimonial-author-info">
                        <span class="testimonial-author-name">Daniel K.</span>
                        <span class="testimonial-author-role">Unreal Engine Player</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     FAQ SECTION
     ============================================ -->
<section class="section faq-section" aria-label="Frequently asked questions" id="faq">
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">FAQ</div>
            <h2 class="section-title">Frequently Asked Questions</h2>
            <p class="section-desc">
                Everything you need to know about editing save files with EditorSaves.
            </p>
        </div>

        <div class="faq-container">
            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Is EditorSaves really free?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>Yes, EditorSaves is completely free to use — forever. There are no subscriptions, hidden fees, premium tiers, or credit card requirements. Every feature is available to every user from the moment they land on the site.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    What save formats does EditorSaves support?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>We are building support for 23+ save formats including RPG Maker MV, MZ, VX Ace, XP, Ren'Py, Unity, Unreal Engine, SQLite, Python Pickle, Ruby Marshal, JSON, XML, MessagePack, CBOR, Protocol Buffers, plist, and many more.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Is it safe to upload my save file?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>Yes. Your files are processed securely and are never shared with third parties. We recommend always backing up your save file before editing, and avoiding setting values to unrealistic extremes that might trigger anti-cheat systems or cause game instability.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Do I need to install any software?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>No. EditorSaves runs entirely in your browser — Chrome, Firefox, Edge, Safari, or any modern browser. There's nothing to download, no installation, no registration. Just upload, edit, and download.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    How do I find my game save file?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>Save file locations vary by game and platform. On Windows, common locations include <code>Documents</code>, <code>Saved Games</code>, <code>AppData\Local</code>, and <code>AppData\Roaming</code>. Many Steam games use Steam Cloud for saves. Check your game's documentation or community forums for the exact path.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Can I edit RPG Maker MV save files?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>Yes! EditorSaves fully supports RPG Maker MV (.rpgsave) and MZ (.rmmzsave) files. You can edit gold, items, character stats, game variables, switches, and more — all through our visual editor.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    What is a .rpgsave file?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>A .rpgsave file is a save file created by RPG Maker MV, one of the most popular game engines for indie RPGs. It contains all your game progress — character stats, inventory, story flags, and game variables — stored as Base64-encoded, LZString-compressed JSON.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Will editing my save file break my game?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>Editing save files is generally safe when done correctly. However, changing values to extreme amounts can sometimes trigger anti-cheat systems or cause game instability. Always back up your original save file before editing, and avoid setting values to unrealistic extremes.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Can I edit Unity game saves?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>Yes. Unity games can store saves in several formats — PlayerPrefs (XML/Plist), JSON, XML, and binary formats like Easy Save 3 (.es3). EditorSaves supports all common Unity save formats.</p>
                </div>
            </div>

            <div class="faq-item reveal">
                <button class="faq-question" type="button" aria-expanded="false">
                    Do you store my uploaded files?
                    <span class="faq-toggle"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div class="faq-answer">
                    <p>We store a copy of uploaded files for format research and parser improvement. We do not share your files with third parties. Files are retained for up to 30 days and then automatically deleted. By uploading, you agree to our <a href="/privacy">Privacy Policy</a>.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     SAVE BACKUP GUIDE
     ============================================ -->
<section class="section prose-section" aria-label="How to back up your save files">
    <div class="container">
        <div class="section-header reveal">
            <div class="section-eyebrow">Before You Edit</div>
            <h2 class="section-title">How to Back Up Your Save Files</h2>
            <p class="section-desc">A backup is the simplest protection against a broken save, an accidental overwrite, or an unexpected game update.</p>
        </div>
        <div class="prose-panel reveal reveal-delay-1">
            <div class="prose-panel-col">
                <div class="prose-card-top">
                    <div class="prose-card-icon amber">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">01</span>
                </div>
                <p>On Windows, locate the game's save folder in places such as Documents, Saved Games, AppData\Local, or AppData\Roaming, then copy the original file to a separate folder. On macOS, check Documents, Application Support, Library folders, or the game's own directory. On Linux, common locations include home-directory folders, hidden configuration directories, and game-specific paths under your user profile. Steam Cloud and other synchronization services are useful, but they should not be your only backup.</p>
            </div>
            <div class="prose-panel-divider" aria-hidden="true"></div>
            <div class="prose-panel-col">
                <div class="prose-card-top">
                    <div class="prose-card-icon green">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                    </div>
                    <span class="prose-card-index" aria-hidden="true">02</span>
                </div>
                <p>Before making any edit, keep the untouched original and give your copy a clear name such as <code>save-backup</code> with the date. Make another backup before major changes, and avoid overwriting the only known-good file. A reliable rollback copy lets you test a change without turning an experiment into lost progress. This matters even more while save-editing tools are learning new formats, because an unsupported or partially understood structure can behave differently after it is rewritten.</p>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     CTA SECTION
     ============================================ -->
<section class="cta-section" aria-label="Call to action">
    <div class="cta-bg" aria-hidden="true">
        <div class="cta-blob-1"></div>
        <div class="cta-blob-2"></div>
    </div>
    <div class="container">
        <div class="cta-content reveal">
            <h2>Ready to Edit Your Save File?</h2>
            <p>Join thousands of gamers who use EditorSaves to customize their game experience. No installation, no registration, no cost.</p>
            <div class="cta-actions">
                <a href="#uploadInner" class="btn-cta-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload Your Save File
                </a>
                <a href="/blog" class="btn-cta-secondary">
                    Read our Save-File Guides
                </a>
            </div>
        </div>
    </div>
</section>

<!-- ============================================
     JAVASCRIPT
     ============================================ -->
<!-- ============================================
     JSON-LD STRUCTURED DATA
     ============================================ -->`;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ensureTurnstileLoaded(): Promise<TurnstileInstance> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  const existing = document.querySelector<HTMLScriptElement>('script[data-editorsaves-turnstile]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Turnstile failed to load.')), 15000);
      const timer = window.setInterval(() => {
        if (window.turnstile) {
          window.clearTimeout(timeout);
          window.clearInterval(timer);
          resolve(window.turnstile);
        }
      }, 50);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.editorsavesTurnstile = 'true';
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile loaded without its API.'));
    };
    script.onerror = () => reject(new Error('Could not load Turnstile.'));
    document.head.appendChild(script);
  });
}

export default function HomePageClient() {
  useEffect(() => {
    /* ---------- Scroll progress: debounced ---------- */
    const scrollProgress = document.getElementById('scrollProgress');
    let scrollTimer: number | undefined;

    const updateScrollProgress = () => {
      if (!scrollProgress) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      scrollProgress.style.width = `${progress}%`;
    };

    const onScroll = () => {
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scrollTimer = undefined;
        updateScrollProgress();
      }, 40);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollProgress();

    /* ---------- Universal scroll reveal: observe only until revealed ---------- */
    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.reveal, .reveal-left, .reveal-right, .reveal-scale, .about-checklist, .usecase-list, .steps-container'
      )
    );
    let remainingReveals = revealElements.length;

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
        remainingReveals -= 1;
      });

      if (remainingReveals <= 0) revealObserver.disconnect();
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    if (revealElements.length > 0) revealElements.forEach((element) => revealObserver.observe(element));

    /* ---------- FAQ accordion ---------- */
    const faqButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.faq-question'));
    const faqHandlers = new Map<HTMLButtonElement, () => void>();
    const faqItems = Array.from(document.querySelectorAll<HTMLElement>('.faq-item'));

    faqButtons.forEach((button) => {
      const handler = () => {
        const item = button.parentElement;
        if (!item) return;
        const isOpen = item.classList.contains('open');
        faqItems.forEach((faqItem) => faqItem.classList.remove('open'));
        faqButtons.forEach((faqButton) => faqButton.setAttribute('aria-expanded', 'false'));
        if (!isOpen) {
          item.classList.add('open');
          button.setAttribute('aria-expanded', 'true');
        }
      };
      faqHandlers.set(button, handler);
      button.addEventListener('click', handler);
    });

    /* ---------- Upload box ---------- */
    const uploadInner = document.getElementById('uploadInner');
    const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement | null;
    const uploadActions = uploadInner?.querySelector<HTMLElement>('.upload-actions');
    const turnstileMount = uploadInner ? (() => {
      const mount = document.createElement('div');
      mount.id = 'turnstileMount';
      mount.style.display = 'none';
      mount.style.marginTop = '12px';
      uploadActions?.appendChild(mount);
      return mount;
    })() : null;

    let selectedFile: File | null = null;
    let turnstileWidgetId: string | undefined;
    let destroyed = false;

    const status = document.createElement('div');
    status.id = 'esUploadStatus';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.dataset.state = 'idle';
    status.style.marginTop = '14px';
    status.style.display = 'none';
    status.style.fontSize = '.84rem';
    status.style.lineHeight = '1.6';
    status.style.fontWeight = '650';
    uploadInner?.appendChild(status);

    const setStatus = (state: 'fileSelected' | 'verifying' | 'uploading' | 'success' | 'error', message: string) => {
      status.style.display = 'block';
      status.dataset.state = state;
      const palette: Record<typeof state, string> = {
        fileSelected: '#0369a1',
        verifying: '#6d28d9',
        uploading: '#15803d',
        success: '#15803d',
        error: '#be123c'
      };
      status.style.color = palette[state];
      status.textContent = message;
    };

    const getSiteKey = () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const uploadFile = async (file: File, token: string) => {
      setStatus('uploading', `Uploading ${file.name} securely…`);
      try {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('turnstileToken', token);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const payload = (await response.json()) as { success?: boolean; message?: string; error?: string };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'The upload could not be completed. Please try again.');
        }
        setStatus('success', payload.message || 'Thank you! Your file was uploaded successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The upload could not be completed. Please try again.';
        setStatus('error', message);
      }
    };

    const renderTurnstile = async () => {
      const siteKey = getSiteKey();
      if (!siteKey) {
        setStatus('error', 'Turnstile is not configured yet. Please add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your deployment environment.');
        return;
      }
      if (!turnstileMount) return;
      turnstileMount.style.display = 'block';
      setStatus('verifying', 'Complete the security check below to continue.');
      try {
        const turnstile = await ensureTurnstileLoaded();
        if (destroyed) return;
        if (turnstileWidgetId && turnstile.reset) {
          turnstile.reset(turnstileWidgetId);
          return;
        }
        turnstileWidgetId = turnstile.render(turnstileMount, {
          sitekey: siteKey,
          theme: 'light',
          callback: (token) => {
            if (selectedFile) void uploadFile(selectedFile, token);
          },
          'error-callback': () => setStatus('error', 'Security verification failed. Please try again.'),
          'expired-callback': () => setStatus('error', 'Security verification expired. Please complete the check again.')
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Security verification could not be loaded.';
        setStatus('error', message);
      }
    };

    const handleFile = (file: File) => {
      if (file.size <= 0) {
        setStatus('error', 'The selected file is empty.');
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setStatus('error', `The selected file is larger than the ${MAX_FILE_SIZE_LABEL} limit.`);
        return;
      }
      if (!isAllowedExtension(file.name)) {
        setStatus('error', `Unsupported file type: ${getExtension(file.name) || 'no extension'}.`);
        return;
      }
      selectedFile = file;
      const summary = `${file.name} · ${formatFileSize(file.size)} selected. Complete the security check to continue.`;
      setStatus('fileSelected', summary);
      void renderTurnstile();
    };

    const triggerFilePicker = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.rpgsave,.rmmzsave,.save,.save0,.save1,.save2,.save3,.save4,.save5,.rvdata2,.rvdata,.rxdata,.sav,.dat,.json,.xml,.sqlite,.sqlite3,.db,.db3,.plist,.msgpack,.mpack,.cbor,.plr,.wld,.rsv,.sol,.sgs,.qsp,.ksd,.pkl,.pickle,.es3,.lsd,.bin,.esv,.ess,.fos,.skse,.gam,.game,.slot,.profile,.profiledata,.userdata,.unreal,.ue4,.usave,.pak,.yaml,.yml,.toml,.ini,.cfg,.config,.binpb,.res,.tres,.resource,.resourcepack,.savestate,.gamedata,.world,.chapter,.slotdata,.savegame,.dat0';
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) handleFile(file);
      }, { once: true });
      input.click();
    };

    const dragEnter = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      uploadInner?.classList.add('dragover');
    };

    const dragLeave = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      uploadInner?.classList.remove('dragover');
    };

    const drop = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      uploadInner?.classList.remove('dragover');
      const file = event.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    };

    const uploadContainerClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest('#uploadBtn')) triggerFilePicker();
    };

    const uploadButtonClick = (event: MouseEvent) => {
      event.stopPropagation();
      triggerFilePicker();
    };

    const uploadKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        triggerFilePicker();
      }
    };

    uploadInner?.addEventListener('dragenter', dragEnter);
    uploadInner?.addEventListener('dragover', dragEnter);
    uploadInner?.addEventListener('dragleave', dragLeave);
    uploadInner?.addEventListener('drop', drop);
    uploadInner?.addEventListener('click', uploadContainerClick);
    uploadInner?.addEventListener('keydown', uploadKeydown);
    uploadBtn?.addEventListener('click', uploadButtonClick);

    /* ---------- Social proof counter ---------- */
    const socialSection = document.querySelector<HTMLElement>('.social-proof');
    let counterAnimated = false;
    let counterObserver: IntersectionObserver | null = null;
    const counterTimeouts: number[] = [];
    let counterFrames: number[] = [];

    const animateStats = () => {
      if (!socialSection || counterAnimated) return;
      counterAnimated = true;
      const stats = Array.from(socialSection.querySelectorAll<HTMLElement>('.proof-stat'));

      stats.forEach((stat, index) => {
        counterTimeouts.push(window.setTimeout(() => stat.classList.add('animate-in'), index * 140));
        const targetValue = Number.parseInt(stat.dataset.value || '0', 10);
        const prefix = stat.dataset.prefix || '';
        const suffix = stat.dataset.suffix || '';
        const numberEl = stat.querySelector<HTMLElement>('.proof-number');
        if (!numberEl) return;
        if (targetValue === 0) {
          counterTimeouts.push(window.setTimeout(() => {
            numberEl.style.animation = 'gradient-shift 6s ease infinite, number-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
          }, index * 140 + 400));
          return;
        }

        const duration = 1600;
        const startTime = performance.now() + index * 140;
        let frameId = 0;
        const updateCount = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          if (elapsed < 0) {
            frameId = requestAnimationFrame(updateCount);
            counterFrames.push(frameId);
            return;
          }
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          numberEl.textContent = prefix + Math.round(eased * targetValue) + suffix;
          if (progress < 1) {
            frameId = requestAnimationFrame(updateCount);
            counterFrames.push(frameId);
          } else {
            numberEl.style.animation = 'gradient-shift 6s ease infinite, number-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
          }
        };
        frameId = requestAnimationFrame(updateCount);
        counterFrames.push(frameId);
      });
    };

    if (socialSection) {
      counterObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animateStats();
          counterObserver?.disconnect();
          counterObserver = null;
        }
      }, { threshold: 0.3 });
      counterObserver.observe(socialSection);
    }

    /* ---------- Card 3D tilt: desktop pointer devices only, rAF throttled ---------- */
    const tiltEnabled = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const tiltCards = tiltEnabled
      ? Array.from(document.querySelectorAll<HTMLElement>('.feature-card, .testimonial-card, .format-category'))
      : [];
    const tiltCleanups: Array<() => void> = [];

    tiltCards.forEach((card) => {
      let frame = 0;
      let lastEvent: MouseEvent | null = null;

      const applyTilt = () => {
        frame = 0;
        if (!lastEvent) return;
        const event = lastEvent;
        lastEvent = null;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateX = (y - 0.5) * -4;
        const rotateY = (x - 0.5) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      };

      const onMove = (event: MouseEvent) => {
        lastEvent = event;
        if (frame === 0) frame = requestAnimationFrame(applyTilt);
      };

      const onLeave = () => {
        lastEvent = null;
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        card.style.transform = '';
      };

      card.style.willChange = 'transform';
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      tiltCleanups.push(() => {
        if (frame !== 0) cancelAnimationFrame(frame);
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
        card.style.willChange = '';
      });
    });

    return () => {
      destroyed = true;
      if (scrollTimer !== undefined) window.clearTimeout(scrollTimer);
      window.removeEventListener('scroll', onScroll);
      revealObserver.disconnect();
      counterObserver?.disconnect();
      counterTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      counterFrames.forEach((frameId) => cancelAnimationFrame(frameId));
      faqHandlers.forEach((handler, button) => button.removeEventListener('click', handler));
      uploadInner?.removeEventListener('dragenter', dragEnter);
      uploadInner?.removeEventListener('dragover', dragEnter);
      uploadInner?.removeEventListener('dragleave', dragLeave);
      uploadInner?.removeEventListener('drop', drop);
      uploadInner?.removeEventListener('click', uploadContainerClick);
      uploadInner?.removeEventListener('keydown', uploadKeydown);
      uploadBtn?.removeEventListener('click', uploadButtonClick);
      tiltCleanups.forEach((cleanup) => cleanup());
      if (turnstileWidgetId && window.turnstile?.remove) window.turnstile.remove(turnstileWidgetId);
      turnstileMount?.remove();
      status.remove();
    };
  }, []);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: HOME_HTML }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: String.raw`{
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": "https://editorsaves.com/#website",
            "url": "https://editorsaves.com/",
            "name": "EditorSaves",
            "alternateName": "Universal Save Editor",
            "description": "Free universal save editor for game saves. Supports RPG Maker, Ren'Py, Unity, Unreal Engine, and 23+ formats.",
            "inLanguage": "en-US",
            "publisher": { "@id": "https://editorsaves.com/#organization" }
        },
        {
            "@type": "Organization",
            "@id": "https://editorsaves.com/#organization",
            "name": "EditorSaves",
            "url": "https://editorsaves.com/",
            "sameAs": []
        },
        {
            "@type": "SoftwareApplication",
            "@id": "https://editorsaves.com/#software",
            "name": "EditorSaves",
            "applicationCategory": "GameApplication",
            "applicationSubCategory": "Save Editor",
            "operatingSystem": "Web Browser (Chrome, Firefox, Safari, Edge)",
            "url": "https://editorsaves.com/",
            "description": "Free universal save editor for game saves. Edit RPG Maker, Ren'Py, Unity, Unreal Engine, and 23+ other save formats directly in your browser.",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
            "featureList": [
                "RPG Maker MV/MZ Save Editing", "Ren'Py Save Editing", "Unity Save Editing",
                "Unreal Engine Save Editing", "SQLite Database Editing", "JSON/XML Editing",
                "Python Pickle Editing", "Ruby Marshal Editing", "23+ Format Support"
            ]
        },
        {
            "@type": "FAQPage",
            "@id": "https://editorsaves.com/#faq",
            "mainEntity": [
                {"@type": "Question", "name": "Is EditorSaves really free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, EditorSaves is completely free to use — forever. There are no subscriptions, hidden fees, premium tiers, or credit card requirements. Every feature is available to every user from the moment they land on the site."}},
                {"@type": "Question", "name": "What save formats does EditorSaves support?", "acceptedAnswer": {"@type": "Answer", "text": "We are building support for 23+ save formats including RPG Maker MV, MZ, VX Ace, XP, Ren'Py, Unity, Unreal Engine, SQLite, Python Pickle, Ruby Marshal, JSON, XML, MessagePack, CBOR, Protocol Buffers, plist, and many more."}},
                {"@type": "Question", "name": "Is it safe to upload my save file?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Your files are processed securely and are never shared with third parties. We recommend always backing up your save file before editing, and avoiding setting values to unrealistic extremes that might trigger anti-cheat systems or cause game instability."}},
                {"@type": "Question", "name": "Do I need to install any software?", "acceptedAnswer": {"@type": "Answer", "text": "No. EditorSaves runs entirely in your browser — Chrome, Firefox, Edge, Safari, or any modern browser. There's nothing to download, no installation, no registration. Just upload, edit, and download."}},
                {"@type": "Question", "name": "How do I find my game save file?", "acceptedAnswer": {"@type": "Answer", "text": "Save file locations vary by game and platform. On Windows, common locations include Documents, Saved Games, AppData\\Local, and AppData\\Roaming. Many Steam games use Steam Cloud for saves. Check your game's documentation or community forums for the exact path."}},
                {"@type": "Question", "name": "Can I edit RPG Maker MV save files?", "acceptedAnswer": {"@type": "Answer", "text": "Yes! EditorSaves fully supports RPG Maker MV (.rpgsave) and MZ (.rmmzsave) files. You can edit gold, items, character stats, game variables, switches, and more — all through our visual editor."}},
                {"@type": "Question", "name": "What is a .rpgsave file?", "acceptedAnswer": {"@type": "Answer", "text": "A .rpgsave file is a save file created by RPG Maker MV, one of the most popular game engines for indie RPGs. It contains all your game progress — character stats, inventory, story flags, and game variables — stored as Base64-encoded, LZString-compressed JSON."}},
                {"@type": "Question", "name": "Will editing my save file break my game?", "acceptedAnswer": {"@type": "Answer", "text": "Editing save files is generally safe when done correctly. However, changing values to extreme amounts can sometimes trigger anti-cheat systems or cause game instability. Always back up your original save file before editing, and avoid setting values to unrealistic extremes."}},
                {"@type": "Question", "name": "Can I edit Unity game saves?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Unity games can store saves in several formats — PlayerPrefs (XML/Plist), JSON, XML, and binary formats like Easy Save 3 (.es3). EditorSaves supports all common Unity save formats."}},
                {"@type": "Question", "name": "Do you store my uploaded files?", "acceptedAnswer": {"@type": "Answer", "text": "We store a copy of uploaded files for format research and parser improvement. We do not share your files with third parties. Files are retained for up to 30 days and then automatically deleted. By uploading, you agree to our Privacy Policy."}}
            ]
        }
    ]
}` }}
      />
    </>
  );
}
