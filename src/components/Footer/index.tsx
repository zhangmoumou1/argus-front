import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div
      style={{
        position: 'fixed',
        left: 216,
        right: 0,
        bottom: 10,
        zIndex: 100,
        height: 36,
        lineHeight: '36px',
        textAlign: 'center',
        background: 'transparent',
      }}
    >
      <span>
        @ {currentYear} zyc个人出品{' '}
        <a href="https://beian.miit.gov.cn">浙ICP备18035865号-2</a>
      </span>
    </div>
  );
};

export default Footer;
