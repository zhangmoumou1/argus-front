import React from 'react';
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import ApexChart from './ApexChart';

const formatChangeMeta = (meta) => {
  if (!meta) {
    return {
      Icon: MinusOutlined,
      colorClass: 'text-gray-400',
      value: '0.00%',
    };
  }

  const direction = meta.direction || 'flat';
  if (direction === 'up') {
    return {
      Icon: ArrowUpOutlined,
      colorClass: 'text-success-500',
      value: `${Number(meta.percent || 0).toFixed(2)}%`,
    };
  }
  if (direction === 'down') {
    return {
      Icon: ArrowDownOutlined,
      colorClass: 'text-error-500',
      value: `${Number(meta.percent || 0).toFixed(2)}%`,
    };
  }
  return {
    Icon: MinusOutlined,
    colorClass: 'text-gray-400',
    value: '0.00%',
  };
};

const StatCard = ({ icon, label, value, sparkData = [], color = '#465fff', changeMeta }) => {
  const data = Array.isArray(sparkData) && sparkData.length > 0 ? sparkData : [0, 0];
  const visibleMax = Math.max(...data, 0);
  const change = formatChangeMeta(changeMeta);
  const options = {
    chart: {
      type: 'area',
      fontFamily: 'Outfit, sans-serif',
      sparkline: { enabled: true },
      toolbar: { show: false },
    },
    colors: [color],
    stroke: {
      curve: 'smooth',
      width: 1,
      lineCap: 'round',
    },
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: { size: 0 },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        opacityFrom: 0.5,
        opacityTo: 0.18,
        shadeIntensity: 0.45,
        stops: [0, 70, 100],
      },
    },
    tooltip: { x: { show: false } },
    grid: {
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    yaxis: {
      show: false,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      min: 0,
      max: visibleMax <= 1 ? 1 : Math.ceil(visibleMax * 1.12),
      forceNiceScale: true,
    },
  };

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs">
      <div className="flex min-h-[104px] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-gray-700">{label}</h3>
            <div className={`mt-1.5 flex items-center gap-1.5 text-[12px] font-medium ${change.colorClass}`}>
              <change.Icon />
              <span>{change.value}</span>
              <span className="font-normal text-gray-500">vs 上个时间段</span>
            </div>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg"
            style={{ background: `${color}1a`, color }}
          >
            {icon}
          </div>
        </div>
        <div className="mt-2.5 flex min-h-[30px] items-end justify-between gap-3">
          <h2 className="mb-0 text-[16px] font-semibold leading-none text-gray-800">{value}</h2>
          <div className="mb-0 h-[30px] w-[132px] shrink-0 self-end">
            <ApexChart
              type="area"
              options={options}
              series={[{ name: label, data }]}
              height={30}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
