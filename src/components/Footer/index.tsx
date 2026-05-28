import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div
      style={{
        position: 'fixed',
        left: 216,
        right: 0,
        bottom: 12,
        zIndex: 100,
        height: 40,
        textAlign: 'center',
        background: 'transparent',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.78)',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
          color: '#667085',
          fontSize: 12,
          lineHeight: '18px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span>© {currentYear} Argus</span>
        <span style={{ color: '#D0D5DD' }}>|</span>
        <a
          href="https://beian.miit.gov.cn"
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#475467',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          浙ICP备18035865号-2
        </a>
      </span>
    </div>
  );
};

export default Footer;
