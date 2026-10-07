import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'How to Edit Save Files — Guides & Tips',
  description: 'Learn how to edit save files with practical game save guides covering RPG Maker, Ren’Py, Unity, save formats, backups, troubleshooting, and safe editing.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'How to Edit Save Files — Guides & Tips | EditorSaves',
    description: 'Learn how to edit save files with practical game save guides covering RPG Maker, Ren’Py, Unity, save formats, backups, troubleshooting, and safe editing.',
    url: `${SITE_URL}/blog`,
    siteName: 'EditorSaves',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Edit Save Files — Guides & Tips | EditorSaves',
    description: 'Learn how to edit save files with practical game save guides covering RPG Maker, Ren’Py, Unity, save formats, backups, troubleshooting, and safe editing.'
  }
};

const articles = [
  { tag: 'Save Files', title: 'How to Edit Save Files Safely (Complete Guide)', copy: 'Learn the safest workflow for editing any game save file, including backups, format detection, and common pitfalls.', meta: 'Coming soon', href: '#' },
  { tag: 'RPG Maker', title: 'Where to Find RPG Maker Save Files (.rpgsave)', copy: 'Step-by-step guide to locating RPG Maker MV/MZ save files on Windows, Mac, and Linux.', meta: 'Coming soon', href: '#' },
  { tag: 'Save Formats', title: 'Understanding .rpgsave, .rvdata2, and .sav Formats', copy: "A technical overview of the most common game save formats and what's inside them.", meta: 'Coming soon', href: '#' }
] as const;

export default function BlogPage() {
  return (
    <>
        <section className="page-hero">
          <div className="container page-hero-inner">
            <span className="page-kicker">EditorSaves Blog</span>
            <h1 className="page-title">How to Edit Save Files: Game Save Guides</h1>
            <p className="page-lead">Technical notes, practical save-file guides, and clear explanations of the formats EditorSaves is learning to support.</p>
          </div>
        </section>

        <section className="page-section">
          <div className="container">
            <div className="section-header">
              <div className="section-eyebrow">Latest topics</div>
              <h2 className="section-title">Build your save-file knowledge.</h2>
              <p className="section-desc">These launch topics are queued for publication as the EditorSaves knowledge base grows.</p>
              <p className="section-desc">The EditorSaves blog covers practical ways to understand, back up, troubleshoot, and safely work with game save files. Guides will focus on common save locations, format clues, and the differences between engines so you can identify what you are dealing with before making a change. Early topics include RPG Maker MV and MZ files such as <code>.rpgsave</code>, Ren’Py save data, Unity save locations and serialization patterns, and common <code>.sav</code>, JSON, XML, database, and binary structures. We will also cover backup workflows for Windows, Mac, and Linux, troubleshooting steps for files that do not open as expected, and the kinds of mistakes that can turn a small edit into lost progress. As EditorSaves studies more real files during Phase 1, these guides will grow around observed formats and edge cases rather than broad claims. The goal is to give players and technical users useful context before they experiment with save data.</p>
            </div>
            <div className="page-grid-3">
              {articles.map((article) => (
                <article key={article.title} className="page-card article-card">
                  <div className="article-meta"><span className="article-tag">{article.tag}</span><span>{article.meta}</span></div>
                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-copy">{article.copy}</p>
                  <a href={article.href} className="article-link">Read guide →</a>
                </article>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}
