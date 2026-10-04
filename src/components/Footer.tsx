import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div>
          <div className="site-footer-brand">EditorSaves</div>
          <p className="site-footer-copy">
            A focused web project for understanding, collecting, and eventually editing game save files across many engines and storage formats.
          </p>
        </div>
        <div>
          <h2 className="site-footer-heading">Explore</h2>
          <div className="site-footer-links">
            <Link href="/">Home</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <h2 className="site-footer-heading">Legal</h2>
          <div className="site-footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <div className="container site-footer-bottom-inner">
          <span>© {new Date().getFullYear()} EditorSaves. All rights reserved.</span>
          <span>Built for save-file research, secure storage, and future editing.</span>
        </div>
      </div>
    </footer>
  );
}
