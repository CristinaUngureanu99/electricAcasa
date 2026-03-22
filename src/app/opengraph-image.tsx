import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'electricAcasa.ro — Materiale Electrice Online';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #1e3a8a 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-2px',
            }}
          >
            electricAcasa
          </div>
          <div
            style={{
              fontSize: '24px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 400,
            }}
          >
            .ro
          </div>
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 500,
              marginTop: '24px',
              maxWidth: '600px',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            Materiale electrice de calitate, livrate la tine acasa
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
