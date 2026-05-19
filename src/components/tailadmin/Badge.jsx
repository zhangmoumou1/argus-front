import React from 'react';

const variants = {
  light: {
    primary: 'bg-brand-50 text-brand-500',
    success: 'bg-success-50 text-success-600',
    error: 'bg-error-50 text-error-600',
    warning: 'bg-warning-50 text-warning-600',
    info: 'bg-blue-light-50 text-blue-light-500',
    light: 'bg-gray-100 text-gray-700',
    dark: 'bg-gray-500 text-white',
  },
  solid: {
    primary: 'bg-brand-500 text-white',
    success: 'bg-success-500 text-white',
    error: 'bg-error-500 text-white',
    warning: 'bg-warning-500 text-white',
    info: 'bg-blue-light-500 text-white',
    light: 'bg-gray-400 text-white',
    dark: 'bg-gray-700 text-white',
  },
};

const sizeStyles = {
  sm: 'text-theme-xs',
  md: 'text-sm',
};

const Badge = ({
  variant = 'light',
  color = 'primary',
  size = 'md',
  startIcon,
  endIcon,
  children,
}) => {
  const base =
    'inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium';
  const colorStyles = variants[variant][color];

  return (
    <span className={`${base} ${sizeStyles[size]} ${colorStyles}`}>
      {startIcon && <span className="mr-1 flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1 flex items-center">{endIcon}</span>}
    </span>
  );
};

export default Badge;
