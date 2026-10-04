import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact EditorSaves — Save File Support',
  description: 'Contact EditorSaves about save-file questions, upload issues, format feedback, technical problems, or support for the current Phase 1 service workflow.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact EditorSaves — Save File Support | EditorSaves',
    description: 'Contact EditorSaves about save-file questions, upload issues, format feedback, technical problems, or support for the current Phase 1 service workflow.',
    url: `${SITE_URL}/contact`,
    siteName: 'EditorSaves',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact EditorSaves — Save File Support | EditorSaves',
    description: 'Contact EditorSaves about save-file questions, upload issues, format feedback, technical problems, or support for the current Phase 1 service workflow.'
  }
};

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': `${SITE_URL}/contact#contact`,
  url: `${SITE_URL}/contact`,
  name: 'Contact EditorSaves',
  description:
    'Contact EditorSaves about save-file questions, upload issues, format feedback, technical problems, or support for the current Phase 1 service workflow.',
};

export default function ContactPage() {
  return (
    <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(contactJsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <section className="page-hero">
          <div className="container page-hero-inner">
            <span className="page-kicker">Contact</span>
            <h1 className="page-title">Contact EditorSaves</h1>
            <p className="page-lead">Send a message with enough detail to reproduce the issue or understand the format you are talking about. The same design language as the homepage keeps the form simple and focused.</p>
          </div>
        </section>
        <section className="page-section">
          <div className="container">
            <div className="page-grid-2">
              <div>
                <div className="section-eyebrow">Get in touch</div>
                <h2 className="section-title">Tell us what you are trying to do.</h2>
                <p className="section-desc">Useful messages include the game title, engine, save extension, operating system, and a short description of what happened. Do not paste passwords, private tokens, or other unrelated secrets.</p>
                <div className="contact-detail" style={{ marginTop: '30px' }}>
                  <strong>Project focus</strong>
                  <span>Game save formats, secure collection, and the future universal save editor.</span>
                </div>
                <div className="contact-detail">
                  <strong>Technical note</strong>
                  <span>The current upload service stores files for format research; it does not edit their contents yet.</span>
                </div>
              </div>

              <form className="page-card form-card" action="mailto:contact@editorsaves.com" method="post" encType="text/plain">
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="name">Name</label>
                    <input className="form-input" id="name" name="name" type="text" autoComplete="name" placeholder="Your name" required />
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Email</label>
                    <input className="form-input" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                  </div>
                  <div className="form-field full">
                    <label htmlFor="message">Message</label>
                    <textarea className="form-input form-textarea" id="message" name="message" placeholder="Tell us about the game, save extension, or issue…" required />
                  </div>
                  <div className="form-field full">
                    <button className="btn-primary" type="submit">Send message <span aria-hidden="true">→</span></button>
                  </div>
                </div>
                <p style={{ marginTop: '14px', fontSize: '.78rem', color: 'var(--gray-500)', lineHeight: 1.7 }}>Submitting opens your default email client using the information you entered.</p>
              </form>
            </div>
          </div>
        </section>
    </>
  );
}
