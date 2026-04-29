import React from 'react';

export default ({data, size = 96, width, height}) => {
  if (data === null) {
    return null;
  }
  return (
    <img
      src="/project.svg"
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
