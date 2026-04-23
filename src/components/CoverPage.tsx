import React from 'react';

interface CoverPageProps {
  familyName: string;
}

const CoverPage: React.FC<CoverPageProps> = ({ familyName }) => {
  return (
    <div className="cover-page-container" style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '50px 20px',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}>
      {/* Top */}
      <div style={{ paddingTop: '10vh', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '0.2em' }}>
          {familyName || '　　'}家 鑑定
        </h1>
      </div>

      {/* Middle Top (中央より少し上) */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '10vh', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.15em', color: '#1a202c', lineHeight: 1.5 }}>
          心相科学理論<br />総合鑑定書
        </h2>
      </div>

      {/* Bottom */}
      <div style={{ paddingBottom: '5vh', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/logo.PNG" 
          alt="Miroku Logo" 
          style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '15px' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <p style={{ fontSize: '1.2rem', color: '#4b5563', letterSpacing: '0.05em' }}>
          Division Miroku Inc.
        </p>
      </div>
    </div>
  );
};

export default CoverPage;
