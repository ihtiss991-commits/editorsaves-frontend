import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy & Upload Data Practices',
  description: 'Read the EditorSaves privacy policy covering uploaded save files, metadata, security verification, private storage, retention, and your responsibilities.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: 'Privacy Policy & Upload Data Practices | EditorSaves',
    description: 'Read the EditorSaves privacy policy covering uploaded save files, metadata, security verification, private storage, retention, and your responsibilities.',
    url: `${SITE_URL}/privacy`,
    siteName: 'EditorSaves',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy & Upload Data Practices | EditorSaves',
    description: 'Read the EditorSaves privacy policy covering uploaded save files, metadata, security verification, private storage, retention, and your responsibilities.'
  }
};

export default function PrivacyPage() {
  return (
    <>
        <section className="page-hero">
          <div className="container page-hero-inner">
            <span className="page-kicker">Privacy</span>
            <h1 className="page-title">Privacy Policy</h1>
            <p className="page-lead">This policy explains what EditorSaves receives when you use the Phase 1 upload service, why the information is collected, and how the infrastructure is designed to restrict public access.</p>
          </div>
        </section>
        <section className="page-section">
          <div className="container legal-shell legal-content">
            <div className="legal-note">Phase 1 stores uploaded files for format research and parser development. Do not upload a save that contains personal, confidential, or otherwise sensitive information you do not want to provide to the project.</div>

            <h2>1. Information we receive</h2>
            <p>When you submit a supported save file, the upload service receives the file itself and basic metadata associated with the upload. The current database record can include the original filename, storage path, file size, MIME type, upload timestamp, IP address when the server can determine it, and an internal status value.</p>
            <p>Cloudflare Turnstile is used as an anti-abuse control. The upload server sends the verification token to Cloudflare's verification service before accepting a file.</p>

            <h2>2. How files are stored</h2>
            <p>Uploaded save files are placed in a private Supabase Storage bucket. The application uses a server-side service role for storage operations; browser users are not given that secret. The database table used for upload metadata has row-level security enabled.</p>

            <h2>3. Why files are collected</h2>
            <p>EditorSaves is being developed as a universal save editor. Real files help the project understand format differences, versions, schemas, compression, and edge cases that cannot be reliably inferred from filenames alone.</p>

            <h2>4. Retention</h2>
            <p>The project intends to retain uploaded files for up to 30 days during the initial research phase, after which files can be deleted. Retention behavior may evolve as the service changes; the current upload system does not promise indefinite storage.</p>

            <h2>5. Security</h2>
            <p>The service applies size and extension validation in the browser and again on the server. Files are stored under UUID-based paths, the bucket is private, and the Supabase service-role credential is server-only. These measures reduce accidental exposure but cannot make internet services risk-free.</p>

            <h2>6. Your responsibility</h2>
            <p>Only upload files you are permitted to provide. Make your own backup before experimenting with save editing, and do not submit credentials, private documents, or other unrelated sensitive data inside a save file.</p>

            <h2>7. Changes to this policy</h2>
            <p>This page may be updated as EditorSaves evolves. Material changes should be reflected here before they become part of the normal service workflow.</p>
          </div>
        </section>
    </>
  );
}
