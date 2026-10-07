import Link from 'next/link';
import BrandMark from '@/components/BrandMark';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-glow" aria-hidden="true" />
      <div className="container site-footer-inner">
        <div className="site-footer-about">
          <Link href="/" className="site-footer-brand" aria-label="EditorSaves home">
            <BrandMark id="footer" className="site-footer-mark" />
            <span>EditorSaves</span>
          </Link>
          <p className="site-footer-copy">
            A focused web project for understanding, collecting, and eventually editing game save files across many engines and storage formats.
          </p>
        </div>
        <nav className="site-footer-col" aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="site-footer-heading">Explore</h2>
          <div className="site-footer-links">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </nav>
        <nav className="site-footer-col" aria-labelledby="footer-legal">
          <h2 id="footer-legal" className="site-footer-heading">Legal</h2>
          <div className="site-footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <div className="container site-footer-bottom-inner">
          <span>© {new Date().getFullYear()} EditorSaves. All rights reserved.</span>
          <span className="site-footer-tagline">
            <span className="site-footer-dot" aria-hidden="true" />
            Built for save-file research, secure storage, and future editing.
          </span>
        </div>
      </div>
    </footer>
  );
}
