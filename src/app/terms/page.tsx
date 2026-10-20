import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms of Use for EditorSaves Uploads & Use',
  description: 'Read the EditorSaves terms covering save-file uploads, acceptable use, service availability, file responsibility, and the current Phase 1 collection workflow.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: 'Terms of Use for EditorSaves Uploads & Use | EditorSaves',
    description: 'Read the EditorSaves terms covering save-file uploads, acceptable use, service availability, file responsibility, and the current Phase 1 collection workflow.',
    url: `${SITE_URL}/terms`,
    siteName: 'EditorSaves',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Use for EditorSaves Uploads & Use | EditorSaves',
    description: 'Read the EditorSaves terms covering save-file uploads, acceptable use, service availability, file responsibility, and the current Phase 1 collection workflow.'
  }
};

export default function TermsPage() {
  return (
    <>
        <section className="page-hero">
          <div className="container page-hero-inner">
            <span className="page-kicker">Terms of Use</span>
            <h1 className="page-title">Terms of Use</h1>
            <p className="page-lead">These terms describe the rules for using the current save-file collection service and set expectations around files, availability, and future editing features.</p>
          </div>
        </section>
        <section className="page-section">
          <div className="container legal-shell legal-content">
            <div className="legal-note">By uploading a file, you confirm that you are allowed to provide that file for the purposes described by EditorSaves and that you understand the Phase 1 service stores a copy for research.</div>

            <h2>1. The current service</h2>
            <p>EditorSaves currently provides a game-save upload and storage workflow. Phase 1 does not parse, modify, or rewrite the contents of uploaded files. Future releases may add inspection and editing features, but no future capability is guaranteed by these terms.</p>

            <h2>2. Files you may upload</h2>
            <p>Use the service only with save files and related data you have the right to provide. The extension whitelist is a technical intake control, not a statement that every format is fully understood or supported by a future editor.</p>

            <h2>3. Prohibited use</h2>
            <ul>
              <li>Do not upload malware, abusive payloads, credentials, or unrelated personal data.</li>
              <li>Do not attempt to bypass security verification or deliberately disrupt the upload service.</li>
              <li>Do not upload another person's private files without permission.</li>
              <li>Do not rely on the service as the only copy of any valuable game progress.</li>
            </ul>

            <h2>4. Save-file responsibility</h2>
            <p>Always keep an original backup. Save-file formats can be fragile, and future editing features can introduce risks even when the intended change seems small. EditorSaves is not responsible for lost progress resulting from a user's own files, games, platforms, third-party synchronization, or future editing operations.</p>

            <h2>5. Availability</h2>
            <p>The service can change, pause, or become unavailable. Upload acceptance can also change as the project refines the whitelist, security controls, storage policies, or research goals.</p>

            <h2>6. Intellectual property and game ownership</h2>
            <p>EditorSaves does not claim ownership of the games or save files you upload. You remain responsible for respecting the rights of game developers, publishers, mod authors, and other rights holders.</p>

            <h2>7. Updates</h2>
            <p>These terms may change as EditorSaves develops. Continuing to use the site after an updated version is published indicates acceptance of the revised terms.</p>
          </div>
        </section>
    </>
  );
}
