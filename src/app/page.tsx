import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { SITE_URL } from '@/lib/constants';
import './homepage.css';

const title = 'Free Online Game Save Editor — Edit & Modify Saves Instantly';
const description = 'Save Editor is a powerful, free online tool that lets you modify game save files in seconds. Change money, items, skills, levels, and inventory stats — without risking your game progress.';
const socialImage = `${SITE_URL}/opengraph-image`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ['save editor', 'game save editor', 'free online save editor', 'edit game save files', 'game save file editor', 'RPG Maker save editor', 'game save editor for PC', 'Nintendo Switch save editor'],
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${SITE_URL}/`,
    siteName: 'EditorSaves',
    images: [{ url: socialImage, width: 1200, height: 630, alt: title }]
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
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#software` },
      primaryImageOfPage: { '@type': 'ImageObject', url: socialImage },
      datePublished: '2026-10-20',
      dateModified: '2026-11-01',
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
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description,
      featureList: [
        'Automated value detection',
        'Privacy-first client execution',
        'Non-destructive session backups',
        'Universal engine support',
        'Zero bloatware or paywalls',
        'Complete modding documentation'
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is Save Editor really free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The core file parsing and data modification tools are completely free to use. There are no registration forms, no subscription fees, and no credit cards required.'
          }
        },
        {
          '@type': 'Question',
          name: 'What formats are supported?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our engine natively parses standard PC, emulator, and console formats including .sav, .json, .jsonview, .dat, .savsave, and text-serialized arrays.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can editing break my game?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "If you enter an invalid value that conflicts with the game engine's maximum allowed limits, the game may crash on launch. This is why keeping an unedited backup file is mandatory before using any save editor tool."
          }
        }
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
