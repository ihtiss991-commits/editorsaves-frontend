import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About EditorSaves — Mission & Project',
  description: 'Learn about EditorSaves, the project building a universal game save editor by studying real save files, engine formats, parser needs, and important edge cases.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About EditorSaves — Mission & Project | EditorSaves',
    description: 'Learn about EditorSaves, the project building a universal game save editor by studying real save files, engine formats, parser needs, and important edge cases.',
    url: `${SITE_URL}/about`,
    siteName: 'EditorSaves',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About EditorSaves — Mission & Project | EditorSaves',
    description: 'Learn about EditorSaves, the project building a universal game save editor by studying real save files, engine formats, parser needs, and important edge cases.'
  }
};

export default function AboutPage() {
  return (
    <>
        <section className="page-hero">
          <div className="container page-hero-inner">
            <span className="page-kicker">About EditorSaves</span>
            <h1 className="page-title">About EditorSaves</h1>
            <p className="page-lead">Learn about EditorSaves, the project building a universal game save editor by studying real save files, engine formats, parser needs, and difficult edge cases.</p>
          </div>
        </section>

        <section className="page-section">
          <div className="container">
            <div className="about-grid">
              <div className="about-content">
                <div className="section-eyebrow">The mission</div>
                <h2 className="section-title">Build the tool around real-world save data, not assumptions.</h2>
                <p>Game saves are not one format. They can be JSON, SQLite, XML, engine-specific binary data, compressed payloads, or a mixture of several layers. Two games using the same engine can still structure progress differently.</p>
                <p>EditorSaves therefore starts with collection. Real samples can reveal version differences, field layouts, compression patterns, and edge cases that documentation alone does not capture.</p>
                <ul className="about-checklist">
                  <li><span className="check-icon">✓</span><span>Make save-file workflows accessible from a browser.</span></li>
                  <li><span className="check-icon">✓</span><span>Learn from real formats before promising universal editing.</span></li>
                  <li><span className="check-icon">✓</span><span>Keep validation, backups, and transparency central to future editing.</span></li>
                  <li><span className="check-icon">✓</span><span>Design for players, hobbyists, and technical users alike.</span></li>
                </ul>
              </div>
              <div className="about-visual" aria-hidden="true">
                <div className="orb orb-a"></div>
                <div className="orb orb-b"></div>
                <div className="about-visual-content">
                  <span className="about-stat">Phase 1 · Secure collection</span>
                  <div>
                    <div className="about-visual-title">From save files today to format-aware editing tomorrow.</div>
                    <p className="about-visual-copy">The first release keeps the workflow intentionally simple: accept supported files, verify the submission, store the file privately, and record the metadata needed for research.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-section soft">
          <div className="container">
            <div className="section-header">
              <div className="section-eyebrow">A careful approach</div>
              <h2 className="section-title">Save files can represent hours of progress.</h2>
              <p className="section-desc">That makes reliability a product feature, not a later refinement.</p>
            </div>
            <div className="page-grid-3">
              <article className="page-card article-card"><span className="article-tag">Reliability</span><h3 className="article-title">Validate before rewriting.</h3><p className="article-copy">Future editing tools should understand what a value means and verify the resulting file before a player trusts it.</p></article>
              <article className="page-card article-card"><span className="article-tag">Safety</span><h3 className="article-title">Keep originals protected.</h3><p className="article-copy">Backups and clear recovery paths help prevent a single mistake from turning into lost progress.</p></article>
              <article className="page-card article-card"><span className="article-tag">Clarity</span><h3 className="article-title">Explain what happens.</h3><p className="article-copy">Users should understand what the site accepts, what it stores, what it changes, and what it does not yet support.</p></article>
            </div>
          </div>
        </section>
    </>
  );
}
