import React, { useEffect, useRef } from 'react';

export const Dropdown = ({ isOpen, onClose, children, className = '' }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest('.dropdown-toggle')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-40 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg ${className}`}
    >
      {children}
    </div>
  );
};

export const DropdownItem = ({
  onClick,
  onItemClick,
  baseClassName = 'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  className = '',
  children,
}) => {
  const combined = `${baseClassName} ${className}`.trim();
  const handleClick = (event) => {
    event.preventDefault();
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };
  return (
    <button type="button" onClick={handleClick} className={combined}>
      {children}
    </button>
  );
};
