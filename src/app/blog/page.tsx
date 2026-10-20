import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import './blog.css';

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

export default function BlogPage() {
  return (
    <section className="page-hero blog-coming-soon">
      <div className="container page-hero-inner blog-coming-soon-inner">
        <span className="page-kicker">EditorSaves Blog</span>
        <div className="blog-coming-soon-mark" aria-hidden="true">
          <span className="blog-coming-soon-orbit blog-coming-soon-orbit-one" />
          <span className="blog-coming-soon-orbit blog-coming-soon-orbit-two" />
          <span className="blog-coming-soon-book">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M8 12.5c6.6-2.2 12-.8 16 2.6v23c-4-3.4-9.4-4.8-16-2.6v-23Z" />
              <path d="M40 12.5c-6.6-2.2-12-.8-16 2.6v23c4-3.4 9.4-4.8 16-2.6v-23Z" />
              <path d="M13 19c3-.6 5.8.1 8 1.4M13 24c3-.6 5.8.1 8 1.4M35 19c-3-.6-5.8.1-8 1.4M35 24c-3-.6-5.8.1-8 1.4" />
            </svg>
          </span>
        </div>
        <h1 className="page-title">Blogs are coming soon</h1>
        <p className="page-lead">
          We’re preparing practical save-file guides and technical notes for players and developers. New posts will appear here when they’re ready.
        </p>
        <div className="blog-coming-soon-actions">
          <Link href="/#upload-box" className="btn-primary">
            Upload a save file
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="/about" className="blog-coming-soon-secondary">About EditorSaves</Link>
        </div>
      </div>
    </section>
  );
}
