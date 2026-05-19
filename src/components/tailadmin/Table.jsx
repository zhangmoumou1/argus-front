import React from 'react';

export const Table = ({ children, className = '' }) => (
  <table className={`min-w-full ${className}`}>{children}</table>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow = ({ children, className = '' }) => (
  <tr className={className}>{children}</tr>
);

export const TableCell = ({ children, isHeader = false, className = '' }) => {
  const CellTag = isHeader ? 'th' : 'td';
  return <CellTag className={className}>{children}</CellTag>;
};
