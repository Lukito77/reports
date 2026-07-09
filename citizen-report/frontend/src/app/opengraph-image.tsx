import { ImageResponse } from 'next/og';

// Social share card (Facebook/LinkedIn/Twitter) generated at build time.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Reports — report public issues with photo evidence';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 55%, #0c4a6e 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, opacity: 0.9 }}>
          📍 Reports
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
          Report public issues in your city
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 34, opacity: 0.92, maxWidth: 980 }}>
          Illegal parking, fines, vandalism &amp; littering — submit photo evidence, reviewed by
          authorized officials.
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 26, opacity: 0.8 }}>
          reportebi.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
