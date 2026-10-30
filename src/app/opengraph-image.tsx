import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Free Online Game Save Editor — Edit & Modify Saves Instantly';
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
          background: 'radial-gradient(ellipse at 50% 0%, rgba(91,110,245,.16), transparent 55%), linear-gradient(135deg, #fbfcff 0%, #f2f5fb 100%)',
          color: '#0f172a',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 900, marginBottom: 20, letterSpacing: '-0.03em' }}>
          EditorSaves
        </div>
        <div style={{ fontSize: 48, fontWeight: 600, color: '#5b6ef5', textAlign: 'center', lineHeight: 1.2 }}>
          Free Online Game Save Editor
        </div>
        <div style={{ fontSize: 48, fontWeight: 600, color: '#5b6ef5', textAlign: 'center', lineHeight: 1.2 }}>
          Edit &amp; Modify Saves Instantly
        </div>
      </div>
    ),
    { ...size }
  );
}
