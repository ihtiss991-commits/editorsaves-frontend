import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { SITE_URL } from '@/lib/constants';
import './homepage.css';

const title = 'Game Save File Research for a Future Universal Save Editor | EditorSaves';
const description =
  'Contribute a game save file to EditorSaves research into save formats, compression, and game-specific data structures. Editing is not live yet.';
const socialImage = `${SITE_URL}/opengraph-image`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${SITE_URL}/`,
    siteName: 'EditorSaves',
    images: [{ url: socialImage, width: 1200, height: 630, alt: 'EditorSaves game save-file research project' }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [socialImage]
  }
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'EditorSaves',
      url: `${SITE_URL}/`,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` }
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: 'EditorSaves',
      description,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en'
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
      primaryImageOfPage: { '@type': 'ImageObject', url: socialImage },
      datePublished: '2026-10-20',
      dateModified: '2026-11-23',
      inLanguage: 'en'
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
