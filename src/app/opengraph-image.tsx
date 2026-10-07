import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'EditorSaves — Universal Save Editor Online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1f0f 0%, #0c2a3a 50%, #1a0f2e 100%)',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 900, marginBottom: 20, letterSpacing: '-0.03em' }}>
          EditorSaves
        </div>
        <div style={{ fontSize: 36, fontWeight: 600, color: '#4ade80', textAlign: 'center', lineHeight: 1.2 }}>
          Universal Save Editor Online
        </div>
        <div style={{ fontSize: 24, fontWeight: 400, color: '#94a3b8', marginTop: 20, textAlign: 'center' }}>
          RPG Maker · Ren'Py · Unity · Unreal Engine
        </div>
      </div>
    ),
    { ...size }
  );
}
