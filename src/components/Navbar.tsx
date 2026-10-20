'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrandMark from '@/components/BrandMark';

const LINKS = [
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`site-nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="container site-nav-inner">
        <Link href="/" className="site-nav-brand" aria-label="EditorSaves home">
          <BrandMark id="nav" className="site-nav-mark" />
          <span className="site-nav-title">
            <span className="site-nav-name">EditorSaves</span>
            <span className="site-nav-subtitle">Universal save tools</span>
          </span>
        </Link>

        <nav className="site-nav-links" aria-label="Primary navigation">
          <div className="site-nav-group">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href as any}
                className={isActive(link.href) ? 'active' : undefined}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            href={'/contact' as any}
            className={`site-nav-cta${isActive('/contact') ? ' active' : ''}`}
            aria-current={isActive('/contact') ? 'page' : undefined}
          >
            Contact
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </nav>

        <button
          type="button"
          className="site-nav-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div id="mobile-nav" className="site-nav-mobile" hidden={!open}>
        <nav className="container site-nav-mobile-inner" aria-label="Mobile navigation">
          {[...LINKS, { href: '/contact', label: 'Contact' }].map((link) => (
            <Link
              key={link.href}
              href={link.href as any}
              className={isActive(link.href) ? 'active' : undefined}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
