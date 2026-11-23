import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Game Save File Research for a Future Universal Save Editor',
    template: '%s | EditorSaves'
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" style={{ '--font-inter': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', '--font-space': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', '--font-jetbrains': 'ui-monospace, SFMono-Regular, Menlo, monospace' } as CSSProperties}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
