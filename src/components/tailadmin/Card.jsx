import React from 'react';

/** TailAdmin-style card shell: rounded white panel with a light border. */
const Card = ({ children, className = '', padding = 'p-5 md:p-6' }) => (
  <div
    className={`rounded-2xl border border-gray-200 bg-white ${padding} ${className}`}
  >
    {children}
  </div>
);

export default Card;
