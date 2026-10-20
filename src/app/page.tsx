import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { SITE_URL } from '@/lib/constants';
import './homepage.css';

const title = 'EditorSaves — Edit Game Saves Safely & Easily';
const description = 'Free browser-based save editor to modify game save files safely. Edit money, items, skills and more. No install required. Start editing today.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ['save editor', 'game save editor', 'online save editor', 'edit game save files', 'RPG Maker save editor'],
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${SITE_URL}/`,
    siteName: 'EditorSaves',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'EditorSaves — Edit Game Saves Safely & Easily' }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.jpg']
  }
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#software` },
      primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.jpg` },
      datePublished: '2026-10-20',
      dateModified: '2026-10-20',
      inLanguage: 'en'
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: 'EditorSaves',
      description,
      publisher: { '@id': `${SITE_URL}/#organization` }
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'EditorSaves',
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'EditorSaves Save Editor',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'A browser-based save-file project designed to help players work with game save files.',
      featureList: [
        'Browser-based workflow',
        'Save-file format detection research',
        'Support for popular save-file extensions',
        'Secure upload verification'
      ]
    }
  ]
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <HomePageClient />
    </>
  );
}
