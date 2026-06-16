import React from 'react';
import { Pie } from '@ant-design/plots';

export default ({ data, height, name, value = 'count' }) => {
  const total = (Array.isArray(data) ? data : []).reduce((sum, item) => {
    const current = Number(item?.[value] ?? 0);
    return sum + (Number.isNaN(current) ? 0 : current);
  }, 0);

  const config = {
    appendPadding: 10,
    data,
    theme: {
      colors10: ['#34D399', '#F87171', '#FBBF24', '#818CF8'],
    },
    angleField: value,
    colorField: name,
    radius: 0.88,
    innerRadius: 0.66,
    legend: {
      position: 'bottom',
      marker: {
        symbol: 'circle',
      },
      itemName: {
        style: {
          fill: '#475569',
          fontSize: 12,
        },
      },
    },
    label: {
      type: 'outer',
      formatter: (datum) => `${datum.name} ${(Number(datum?.percent || 0) * 100).toFixed(0)}%`,
      style: {
        fontSize: 11,
        fill: '#64748B',
      },
    },
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          fontSize: 12,
          color: '#94A3B8',
          lineHeight: 1.4,
        },
        content: `总数\n${total}`,
      },
    },
    tooltip: {
      showTitle: true,
      title: (title, datum) => {
        const current = Number(datum?.[value] || 0);
        return `${datum.name}: ${current}（${(Number(datum?.percent || 0) * 100).toFixed(0)}%）`;
      },
    },
    interactions: [
      {
        type: 'element-highlight',
      },
    ],
    height,
    autoFit: true,
  };

  return <Pie {...config} />;
};
