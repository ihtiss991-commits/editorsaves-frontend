import Link from 'next/link';

function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 42 42" className="site-nav-mark">
      <defs>
        <linearGradient id="editor-mark-nav" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#16a34a" />
          <stop offset="0.55" stopColor="#22c55e" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="38" height="38" rx="12" fill="url(#editor-mark-nav)" />
      <path d="M12 13.5h18v4H16v3h11v4H16v4h14v4H12z" fill="white" opacity=".98" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="site-nav">
      <div className="container site-nav-inner">
        <Link href="/" className="site-nav-brand" aria-label="EditorSaves home">
          <Mark />
          <span className="site-nav-title">
            <span className="site-nav-name">EditorSaves</span>
            <span className="site-nav-subtitle">Universal save tools</span>
          </span>
        </Link>
        <nav className="site-nav-links" aria-label="Primary navigation">
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
