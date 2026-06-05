import React from 'react';

export default ({data, size = 96, width, height}) => {
  if (data === null) {
    return null;
  }

  const avatar = String(data?.avatar || '').trim();
  const src = avatar ? avatar : '/project.svg';

  return (
    <img
      src={src}
      alt="project"
      style={{
        width: width || size,
        height: height || undefined,
        display: 'inline-block',
        objectFit: 'contain',
        verticalAlign: 'middle',
      }}
    />
  );
};
