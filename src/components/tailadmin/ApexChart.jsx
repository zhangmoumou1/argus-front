import React from 'react';
import Chart from 'react-apexcharts';

/** Thin wrapper around react-apexcharts so pages share one import point. */
const ApexChart = ({ type, options, series, height, width }) => (
  <Chart
    type={type}
    options={options}
    series={series}
    height={height}
    width={width}
  />
);

export default ApexChart;
