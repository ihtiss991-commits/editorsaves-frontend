import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: { absolute: 'Universal Save Editor Online — Game Save Files | EditorSaves' },
  description: "EditorSaves is a free universal save editor project. Upload game save files online during Phase 1 and explore RPG Maker, Ren’Py, Unity, Unreal Engine, and more.",
  keywords: ['save editor', 'universal save editor', 'rpg maker save editor', 'renpy save editor', 'game save editor online', 'rpgsave editor', 'edit save file'],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Universal Save Editor Online — Game Save Files | EditorSaves',
    description: "EditorSaves is a free universal save editor project. Upload game save files online during Phase 1 and explore RPG Maker, Ren’Py, Unity, Unreal Engine, and more.",
    type: 'website',
    url: SITE_URL,
    siteName: 'EditorSaves'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universal Save Editor Online — Game Save Files | EditorSaves',
    description: "EditorSaves is a free universal save editor project. Upload game save files online during Phase 1 and explore RPG Maker, Ren’Py, Unity, Unreal Engine, and more.",
  }
};

export default function HomePage() {
  return <HomePageClient />;
}
