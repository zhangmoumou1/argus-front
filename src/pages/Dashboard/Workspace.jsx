import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect, history, useModel } from '@umijs/max';
import { Popover } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudOutlined,
  ThunderboltOutlined,
  SunOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  FileDoneOutlined,
  FolderOpenOutlined,
  RocketOutlined,
  TeamOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import common from '@/utils/common';
import { getAvatarByUser } from '@/utils/avatar';
import Card from '@/components/tailadmin/Card';
import Badge from '@/components/tailadmin/Badge';
import ApexChart from '@/components/tailadmin/ApexChart';

const mixWithWhite = (hex, ratio = 0.2) => {
  const normalized = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex || '#465fff';
  const num = parseInt(normalized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (value) => Math.round(value + (255 - value) * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const getWelcome = (user) => {
  const hour = new Date().getHours();
  if (hour < 6) return `Hi, ${user}! 凌晨了，跑任务也别忘了休息`;
  if (hour < 9) return `早上好，${user}!`;
  if (hour < 12) return `上午好，${user}!`;
  if (hour < 14) return `中午好，${user}!`;
  if (hour < 19) return `下午好，${user}!`;
  return `晚上好，${user}! 今天的质量地图也点亮一下`;
};

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const formatDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const shiftMonth = (date, delta) => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + delta);
  return next;
};

const resolveWeatherText = (weatherCode) => {
  const map = {
    0: '晴',
    1: '多云',
    2: '多云',
    3: '阴',
    45: '雾',
    48: '雾',
    51: '小雨',
    53: '小雨',
    55: '中雨',
    56: '冻雨',
    57: '冻雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    66: '冻雨',
    67: '冻雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪',
    80: '阵雨',
    81: '阵雨',
    82: '暴雨',
    85: '阵雪',
    86: '阵雪',
    95: '雷雨',
    96: '雷暴',
    99: '雷暴',
  };
  return map[Number(weatherCode)] || '天气未知';
};

const normalizeCityName = (city) => {
  const raw = String(city || '').trim();
  if (!raw) return '杭州市';
  const lower = raw.toLowerCase();
  const cityMap = {
    hangzhou: '杭州市',
    beijing: '北京市',
    shanghai: '上海市',
    guangzhou: '广州市',
    shenzhen: '深圳市',
  };
  return cityMap[lower] || raw;
};

const WEATHER_ICON_RENDER = (weatherCode) => {
  const code = Number(weatherCode);
  if ([0].includes(code)) {
    return <SunOutlined className="text-[15px] text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />;
  }
  if ([1, 2, 3, 45, 48].includes(code)) {
    return <CloudOutlined className="text-[15px] text-sky-600 animate-pulse" />;
  }
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return (
      <span className="relative inline-flex h-[18px] w-[18px] items-start justify-center">
        <CloudOutlined className="text-[15px] text-sky-600" />
        <span className="absolute left-[3px] top-[12px] h-[6px] w-[1.5px] rounded-full bg-sky-400 animate-bounce" />
        <span className="absolute left-[7px] top-[13px] h-[6px] w-[1.5px] rounded-full bg-sky-400 animate-bounce [animation-delay:120ms]" />
        <span className="absolute left-[11px] top-[12px] h-[6px] w-[1.5px] rounded-full bg-sky-400 animate-bounce [animation-delay:240ms]" />
      </span>
    );
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return <CloudOutlined className="text-[15px] text-cyan-500 animate-pulse" />;
  }
  if ([95, 96, 99].includes(code)) {
    return <ThunderboltOutlined className="text-[15px] text-yellow-500 animate-bounce" />;
  }
  return <CloudOutlined className="text-[15px] text-sky-600 animate-pulse" />;
};

const calculatePercent = (report) =>
  common.calPiePercent(
    report?.success_count || 0,
    (report?.success_count || 0) +
      (report?.failed_count || 0) +
      (report?.error_count || 0),
  );

const resolvePlanHref = (item) => {
  const type = String(item?.plan_type || 'api').toLowerCase();
  if (type === 'ui') return '/#/uiTest/plan';
  if (type === 'performance') return '/#/performance/plan';
  return '/#/apiTest/testplan';
};

const resolvePlanTypeLabel = (item) => {
  const type = String(item?.plan_type || 'api').toLowerCase();
  if (type === 'ui') return 'UI测试';
  if (type === 'performance') return '性能测试';
  return '接口测试';
};

const MetricCard = ({ icon, label, value, suffix }) => (
  <Card className="h-full" padding="p-4 md:p-4 pb-0">
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-lg text-brand-500">
        {icon}
      </div>
      <div className="mt-3 grid min-h-[56px] grid-rows-[20px_1fr]">
        <span className="text-[15px] font-normal leading-none text-gray-800">
          {label}
        </span>
        <h4 className="mt-1 text-[13px] font-normal leading-6 text-gray-500">
          <span className="font-normal text-gray-800">{value}</span>
          {suffix ? (
            <span className="ml-1 text-[13px] font-normal text-gray-400">
              {suffix}
            </span>
          ) : null}
        </h4>
      </div>
    </div>
  </Card>
);

const SplitMetricCard = ({
  icon,
  label,
  total,
  apiValue,
  functionalValue,
  uiValue,
}) => (
  <Card className="h-full" padding="p-4 md:p-4 pb-0">
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-lg text-brand-500">
        {icon}
      </div>
      <div className="mt-3 grid min-h-[56px] grid-rows-[20px_1fr]">
        <span className="text-[15px] font-normal leading-none text-gray-800">
          {label}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-y-0.5 text-[13px] font-normal leading-6 text-gray-500">
          <span className="text-gray-500">总数：</span>
          <span className="ml-1 text-[13px] font-normal text-gray-800">{total}</span>
          <span className="ml-4 text-gray-500">接口：</span>
          <span className="ml-1 text-[13px] font-normal text-gray-800">{apiValue}</span>
          <span className="mx-3 text-gray-300">|</span>
          <span className="text-gray-500">功能：</span>
          <span className="ml-1 text-[13px] font-normal text-gray-800">{functionalValue}</span>
          <span className="mx-3 text-gray-300">|</span>
          <span className="text-gray-500">UI：</span>
          <span className="ml-1 text-[13px] font-normal text-gray-800">{uiValue}</span>
        </div>
      </div>
    </div>
  </Card>
);

const WelcomeBanner = ({ currentUser, primaryColor = '#465fff' }) => {
  const baseColor = primaryColor || '#465fff';
  const softColor = mixWithWhite(baseColor, 0.72);
  const endColor = mixWithWhite(baseColor, 0.88);
  const [now, setNow] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [weatherInfo, setWeatherInfo] = useState({
    city: '定位中',
    weather: '--',
    temp: '--',
    weatherCode: null,
    forecast: [],
  });
  const [holidayMap, setHolidayMap] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const updateWeather = async () => {
      try {
        let latitude = null;
        let longitude = null;
        let city = '杭州市';
        const resolveByIp = async () => {
          const providers = [
            async () => {
              const resp = await fetch('https://ipwho.is/');
              const data = await resp.json();
              if (!data?.success) return null;
              return {
                latitude: data?.latitude,
                longitude: data?.longitude,
                city: data?.city,
              };
            },
            async () => {
              const resp = await fetch('https://ipapi.co/json/');
              const data = await resp.json();
              return {
                latitude: data?.latitude,
                longitude: data?.longitude,
                city: data?.city,
              };
            },
          ];
          for (const getLocation of providers) {
            try {
              const location = await getLocation();
              if (
                location &&
                Number.isFinite(Number(location.latitude)) &&
                Number.isFinite(Number(location.longitude))
              ) {
                return location;
              }
            } catch (e) {
              // ignore and try next provider
            }
          }
          return null;
        };
        const ipLocation = await resolveByIp();
        if (ipLocation) {
          latitude = ipLocation.latitude;
          longitude = ipLocation.longitude;
          city = normalizeCityName(ipLocation.city);
        }
        if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
          latitude = 30.2741;
          longitude = 120.1551;
          city = '杭州市';
        }
        const weatherResp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=8&timezone=Asia%2FShanghai`,
        );
        const weatherData = await weatherResp.json();
        if (cancelled) return;
        const current = weatherData?.current || {};
        const daily = weatherData?.daily || {};
        const dateList = Array.isArray(daily.time) ? daily.time : [];
        const weatherCodeList = Array.isArray(daily.weather_code)
          ? daily.weather_code
          : [];
        const maxTempList = Array.isArray(daily.temperature_2m_max)
          ? daily.temperature_2m_max
          : [];
        const minTempList = Array.isArray(daily.temperature_2m_min)
          ? daily.temperature_2m_min
          : [];
        const forecast = dateList.slice(1, 8).map((date, index) => ({
          date,
          weatherCode: Number(weatherCodeList[index + 1]),
          weather: resolveWeatherText(weatherCodeList[index + 1]),
          tempMax: Number.isFinite(Number(maxTempList[index + 1]))
            ? Math.round(Number(maxTempList[index + 1]))
            : '--',
          tempMin: Number.isFinite(Number(minTempList[index + 1]))
            ? Math.round(Number(minTempList[index + 1]))
            : '--',
        }));
        setWeatherInfo({
          city,
          weather: resolveWeatherText(current.weather_code),
          temp: Number.isFinite(Number(current.temperature_2m))
            ? `${Math.round(Number(current.temperature_2m))}°C`
            : '--',
          weatherCode: Number.isFinite(Number(current.weather_code))
            ? Number(current.weather_code)
            : null,
          forecast,
        });
      } catch (e) {
        if (cancelled) return;
        setWeatherInfo({
          city: '杭州市',
          weather: '天气获取失败',
          temp: '--',
          weatherCode: null,
          forecast: [],
        });
      }
    };
    updateWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const currentYear = now.getFullYear();
    const loadHolidays = async () => {
      try {
        const resp = await fetch(`https://timor.tech/api/holiday/year/${currentYear}`);
        const data = await resp.json();
        if (cancelled) return;
        const holidayData = data?.holiday || {};
        const nextMap = {};
        Object.keys(holidayData).forEach((monthDay) => {
          const [month, day] = String(monthDay).split('-');
          const dateKey = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const detail = holidayData[monthDay];
          if (detail && typeof detail === 'object') {
            nextMap[dateKey] = {
              name: detail.name || '节假日',
              holiday: !!detail.holiday,
            };
          }
        });
        setHolidayMap(nextMap);
      } catch (e) {
        if (!cancelled) setHolidayMap({});
      }
    };
    loadHolidays();
    return () => {
      cancelled = true;
    };
  }, [now]);

  const dateFull = formatDate(now);
  const dateWeek = WEEK_LABELS[now.getDay()];

  const calendarGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = 0; i < 42; i += 1) {
      const dayOffset = i - startDay + 1;
      let date;
      let inMonth = true;
      if (dayOffset <= 0) {
        date = new Date(year, month - 1, prevMonthDays + dayOffset);
        inMonth = false;
      } else if (dayOffset > daysInMonth) {
        date = new Date(year, month + 1, dayOffset - daysInMonth);
        inMonth = false;
      } else {
        date = new Date(year, month, dayOffset);
      }
      const key = formatDate(date);
      cells.push({
        key,
        date,
        inMonth,
        isToday: key === formatDate(now),
        holiday: holidayMap[key],
      });
    }
    return cells;
  }, [calendarMonth, now, holidayMap]);

  return (
        <div
        className="rounded-2xl p-5 md:p-6"
        style={{
          background: `linear-gradient(135deg, ${mixWithWhite(baseColor, 0.62)} 0%, ${mixWithWhite(baseColor, 0.82)} 100%)`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={getAvatarByUser(currentUser)}
              alt="avatar"
              className="h-16 w-16 rounded-full"
            />
            <div>
              <div className="text-[16px] font-semibold text-slate-700">
                {getWelcome(currentUser?.name || '同学')}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {currentUser?.email || '-'}
                {currentUser?.nickname ? ` · ${currentUser.nickname}` : ''}
              </div>
            </div>
          </div>
            <div className="flex flex-col items-end gap-2 px-1 text-slate-700">
              <Popover
                trigger="click"
                placement="bottomRight"
                content={(
                  <div className="w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="text-[13px] text-slate-500">{dateFull}，{dateWeek}</div>
                      <div className="mt-1 text-[24px] font-semibold text-slate-800">
                        {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => shiftMonth(prev, -1))}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-slate-100 text-slate-600"
                      >
                        <LeftOutlined />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth((prev) => shiftMonth(prev, 1))}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border-0 bg-slate-100 text-slate-600"
                      >
                        <RightOutlined />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 px-4 pb-1 pt-1 text-center text-[12px] text-slate-400">
                      {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                        <div key={w} className="py-1">{w}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1 px-4 pb-4">
                      {calendarGrid.map((cell) => (
                        <div key={cell.key} className="py-1 text-center">
                          <div
                            className={`mx-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                              cell.isToday
                                ? 'bg-blue-600 text-white'
                                : cell.inMonth
                                  ? 'text-slate-800'
                                  : 'text-slate-300'
                            }`}
                          >
                            {cell.date.getDate()}
                          </div>
                          <div className="mt-0.5 h-3 text-[10px] leading-3 text-amber-600">
                            {cell.holiday?.name || ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              >
                <button
                  type="button"
                  className="cursor-pointer rounded-md border-0 bg-transparent p-0 text-[14px] leading-none tracking-wide text-slate-700 transition-all duration-200 hover:text-slate-900 hover:opacity-90"
                >
                  {dateFull} · {dateWeek}
                </button>
              </Popover>
              <Popover
                trigger="click"
                placement="bottomRight"
                content={(
                  <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-[14px] font-medium text-slate-800">
                        {weatherInfo.city}天气
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-[13px] text-slate-600">
                        {WEATHER_ICON_RENDER(weatherInfo.weatherCode)}
                        <span>{weatherInfo.weather}</span>
                        <span className="font-medium text-sky-700">{weatherInfo.temp}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {(weatherInfo.forecast || []).map((item) => (
                        <div
                          key={item.date}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <span className="text-[13px] text-slate-600">
                            {item.date}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-700">
                            {WEATHER_ICON_RENDER(item.weatherCode)}
                            <span>{item.weather}</span>
                          </span>
                          <span className="text-[13px] text-slate-700">
                            {item.tempMin}~{item.tempMax}°C
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              >
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[13px] text-slate-700 transition-all duration-200 hover:text-slate-900 hover:opacity-90"
                >
                  <span>{weatherInfo.city}</span>
                  <span className="text-slate-300">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center">
                      {WEATHER_ICON_RENDER(weatherInfo.weatherCode)}
                    </span>
                    <span>{weatherInfo.weather}</span>
                    <span className="mt-[2px] inline-block font-medium text-sky-700">{weatherInfo.temp}</span>
                  </span>
                </button>
              </Popover>
            </div>
          </div>
      </div>
  );
};

const CaseUsageRing = ({ items = [] }) => {
  const topThree = (items || []).slice(0, 3);
  const hasData = topThree.length > 0;
  const series = hasData ? topThree.map((item) => Number(item.value || 0)) : [1];
  const labels = hasData ? topThree.map((item) => item.label || '-') : ['暂无数据'];
  const colors = hasData ? ['#bdb4fe', '#7592ff', '#7cd4fd'] : ['#E4E7EC'];

  const options = {
    colors,
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'donut',
      sparkline: { enabled: true },
    },
    labels,
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['#fff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: { show: false },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} 条`,
      },
    },
  };

  return (
    <div className="relative flex items-start justify-center pt-1">
      <ApexChart
        key={labels.join('-')}
        type="donut"
        options={options}
        series={series}
        height={176}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[12px] text-gray-400">总数</span>
        <span className="mt-1 text-[24px] font-semibold text-gray-900">
          {series.reduce((sum, item) => sum + Number(item || 0), 0)}
        </span>
      </div>
    </div>
  );
};

const CaseRankingList = ({ items = [] }) => {
  const topThree = (items || []).slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[48px_minmax(0,1fr)_72px] gap-3 px-1 pb-1 text-[12px] font-medium text-gray-400">
        <span>排名</span>
        <span>项目名称</span>
        <span className="text-right">条数</span>
      </div>
      {topThree.length > 0 ? (
        topThree.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="grid grid-cols-[48px_minmax(0,1fr)_72px] items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5"
          >
            <div className="flex items-center">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-brand-600 shadow-theme-xs">
                {index + 1}
              </span>
            </div>
            <span className="truncate text-[13px] text-gray-700">
              {item.label || item.project_name || item.name || '-'}
            </span>
            <span className="text-right text-[13px] font-semibold text-gray-800">
              {item.value}
            </span>
          </div>
        ))
      ) : (
        <div className="rounded-xl bg-gray-50 px-3 py-4 text-center text-[13px] text-gray-400">
          暂无数据
        </div>
      )}
    </div>
  );
};

const WeeklyCaseChart = ({ weekCase = [] }) => {
  const [visibleSeries, setVisibleSeries] = useState({
    api: true,
    functional: true,
    ui: true,
  });
  const categories = weekCase.map((item) => item?.date || '');
  const apiData = weekCase.map((item) =>
    Number(item?.api_case_count || item?.api_count || 0),
  );
  const functionalData = weekCase.map((item) =>
    Number(item?.functional_case_count || item?.functional_count || 0),
  );
  const uiData = weekCase.map((item) =>
    Number(item?.ui_case_count || item?.ui_count || 0),
  );
  const options = {
    colors: ['#7592ff', '#7cd4fd', '#f79009'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '39%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ['transparent'] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: '#667085', fontSize: '12px' },
        formatter: (value) => {
          if (!value) return '';
          const matched = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!matched) return value;
          return `${matched[2]}/${matched[3]}`;
        },
      },
    },
      legend: {
        show: false,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '13px',
        labels: { colors: '#667085' },
      },
    yaxis: { title: { text: undefined } },
    grid: {
      yaxis: { lines: { show: true } },
      padding: { top: 20, right: 8, bottom: 8, left: 20 },
    },
    fill: { opacity: 1 },
    tooltip: { x: { show: false }, y: { formatter: (val) => `${val} 条` } },
  };

  const chartSeries = [];
  if (visibleSeries.api) {
    chartSeries.push({ name: '接口用例', data: apiData, color: '#7592ff' });
  }
  if (visibleSeries.functional) {
    chartSeries.push({
      name: '功能用例',
      data: functionalData,
      color: '#7cd4fd',
    });
  }
  if (visibleSeries.ui) {
    chartSeries.push({
      name: 'UI用例',
      data: uiData,
      color: '#f79009',
    });
  }

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Card className="flex flex-col" padding="p-4 md:p-4 pb-0">
      <div className="flex h-9 items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-gray-800 leading-none">
          最近7天编写用例
        </h3>
        <button
          type="button"
          onClick={() => history.push('/apiTest/testcase')}
          className="cursor-pointer appearance-none rounded-full border-0 bg-brand-50 px-3 py-1 text-[13px] font-medium text-brand-600 outline-none transition-all duration-200 hover:bg-brand-100 hover:text-brand-700 focus:outline-none"
        >
          去编写
        </button>
      </div>
        <div className="mt-2 flex items-center gap-5 text-[13px] text-gray-600">
          <button
            type="button"
            onClick={() => toggleSeries('api')}
            className={`inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-all duration-200 hover:opacity-90 ${
              visibleSeries.api ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: visibleSeries.api ? '#7592ff' : '#D0D5DD' }}
            />
            接口用例
          </button>
          <button
            type="button"
            onClick={() => toggleSeries('functional')}
            className={`inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-all duration-200 hover:opacity-90 ${
              visibleSeries.functional ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: visibleSeries.functional ? '#7cd4fd' : '#D0D5DD' }}
            />
            功能用例
          </button>
          <button
            type="button"
            onClick={() => toggleSeries('ui')}
            className={`inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 transition-all duration-200 hover:opacity-90 ${
              visibleSeries.ui ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: visibleSeries.ui ? '#f79009' : '#D0D5DD' }}
            />
            UI用例
          </button>
        </div>
        <div className="mt-1 -mb-2 overflow-hidden">
          <ApexChart
            type="bar"
            options={options}
            series={chartSeries}
            height={320}
          />
        </div>
      </Card>
  );
};

const PlanCard = ({ item }) => {
  const latest = item.report?.[0];
  const planHref = resolvePlanHref(item);
  const planTypeLabel = resolvePlanTypeLabel(item);
  const planType = String(item?.plan_type || 'api').toLowerCase();
  const sparkData = useMemo(
    () => {
      const points = [...(item.report || [])]
        .reverse()
        .map((report) => Math.round(calculatePercent(report) * 100));
      if (planType === 'performance' && points.length === 1) {
        return [points[0], points[0]];
      }
      return points;
    },
    [item.report, planType],
  );

  return (
    <Card className="h-full" padding="p-5 md:p-6">
      <div className="flex items-center justify-between">
        <a
          href={planHref}
          className="text-base font-semibold text-gray-800 hover:text-brand-500"
        >
          {item.plan?.name || '未命名计划'}
        </a>
        <div className="flex items-center gap-2">
          <Badge size="sm" color="primary">
            {planTypeLabel}
          </Badge>
          <Badge size="sm" color={latest ? 'success' : 'light'}>
            {latest ? '已有报告' : '待执行'}
          </Badge>
        </div>
      </div>

      {!latest ? (
        <div className="mt-6 rounded-xl bg-gray-50 py-10 text-center text-theme-sm text-gray-400">
          这个测试计划还没有执行记录哦，先来一次漂亮的首跑吧
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-4">
            <ApexChart
              type="radialBar"
              options={{
                colors: ['#465FFF'],
                chart: {
                  fontFamily: 'Outfit, sans-serif',
                  type: 'radialBar',
                  sparkline: { enabled: true },
                },
                plotOptions: {
                  radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    hollow: { size: '65%' },
                    track: {
                      background: '#E4E7EC',
                      strokeWidth: '100%',
                      margin: 5,
                    },
                    dataLabels: {
                      name: {
                        show: true,
                        offsetY: 18,
                        color: '#667085',
                        fontSize: '12px',
                      },
                      value: {
                        fontSize: '26px',
                        fontWeight: '600',
                        offsetY: -16,
                        color: '#1D2939',
                        formatter: (val) => `${val}%`,
                      },
                    },
                  },
                },
                fill: { type: 'solid', colors: ['#465FFF'] },
                stroke: { lineCap: 'round' },
                labels: ['上次通过率'],
              }}
              series={[Math.round(calculatePercent(latest) * 100)]}
              height={200}
            />
            <p className="mt-2 text-center text-theme-xs text-gray-400">
              {latest.start_at}
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <CheckCircleFilled style={{ color: '#12b76a' }} />
              <span className="text-theme-sm text-gray-500">成功</span>
              <span className="ml-auto text-theme-sm font-semibold text-gray-800">
                {latest.success_count || 0}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <CloseCircleFilled style={{ color: '#f04438' }} />
              <span className="text-theme-sm text-gray-500">失败</span>
              <span className="ml-auto text-theme-sm font-semibold text-gray-800">
                {latest.failed_count || 0}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <ExclamationCircleFilled style={{ color: '#f79009' }} />
              <span className="text-theme-sm text-gray-500">错误</span>
              <span className="ml-auto text-theme-sm font-semibold text-gray-800">
                {latest.error_count || 0}
              </span>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col justify-center">
            <span className="text-theme-xs text-gray-500">近7次通过率</span>
            <ApexChart
              type="area"
              options={{
                chart: {
                  type: 'area',
                  fontFamily: 'Outfit, sans-serif',
                  sparkline: { enabled: true },
                },
                colors: ['#465fff'],
                stroke: { curve: 'smooth', width: 2 },
                fill: {
                  type: 'gradient',
                  gradient: { opacityFrom: 0.5, opacityTo: 0 },
                },
                tooltip: {
                  x: { show: false },
                  y: { formatter: (val) => `${val}%` },
                },
              }}
              series={[{ name: '通过率', data: sparkData }]}
              height={120}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

const CaseDistributionCard = ({
  total,
  items = [],
  activeKey,
  onChange,
  onMore,
}) => {
  const topThree = (items || []).slice(0, 3);

  return (
    <Card className="h-full flex flex-col min-h-[320px]" padding="p-4 md:p-4 pb-0">
      <div className="flex h-9 items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-gray-800">用例分布</h3>
        </div>
        <div className="inline-flex items-center rounded-full bg-gray-100 p-0.5 shadow-inner">
          <button
            type="button"
            onClick={() => onChange('api')}
            className={`appearance-none border-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition focus:outline-none focus:ring-0 ${
              activeKey === 'api'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            接口用例
          </button>
          <button
            type="button"
            onClick={() => onChange('functional')}
            className={`appearance-none border-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition focus:outline-none focus:ring-0 ${
              activeKey === 'functional'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            功能用例
          </button>
          <button
            type="button"
            onClick={() => onChange('ui')}
            className={`appearance-none border-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition focus:outline-none focus:ring-0 ${
              activeKey === 'ui'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            UI用例
          </button>
        </div>
      </div>
      <div className="mt-6 px-1 text-[13px] text-gray-500">
        以项目维度统计接口、功能与 UI 用例分布
      </div>

      <div className="mt-8 grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex items-start justify-center pt-4">
          <CaseUsageRing key={activeKey} items={topThree} />
        </div>
        <div className="rounded-2xl bg-white p-3 pt-4">
          <CaseRankingList items={topThree} />
        </div>
      </div>
    </Card>
  );
};

const Workspace = ({ user, dispatch }) => {
  const {
    project_count,
    case_count,
    api_case_count,
    functional_case_count,
    ui_case_count,
    weekly_new_api_case,
    weekly_new_functional_case,
    weekly_new_ui_case,
    user_rank,
    total_user,
    weekly_case,
    month_case,
    api_case_distribution,
    functional_case_distribution,
    ui_case_distribution,
    followPlan = [],
  } = user;

  const { initialState } = useModel('@@initialState');
  const { currentUser = {} } = initialState || {};
  const primaryColor = initialState?.settings?.colorPrimary || '#465fff';
  const [distributionKey, setDistributionKey] = useState('api');

  useEffect(() => {
    dispatch({ type: 'user/queryUserStatistics' });
    dispatch({ type: 'user/queryFollowTestPlanData' });
  }, [dispatch]);

  const normalizedWeekCase = useMemo(() => {
    if (Array.isArray(weekly_case) && weekly_case.length > 0) return weekly_case;
    if (Array.isArray(month_case) && month_case.length > 0) return month_case.slice(-7);
    return [];
  }, [weekly_case, month_case]);

  const weeklyApi = Number(weekly_new_api_case || 0);
  const weeklyFunctional = Number(weekly_new_functional_case || 0);
  const weeklyUi = Number(weekly_new_ui_case || 0);
  const weeklyTotal = weeklyApi + weeklyFunctional + weeklyUi;

  const distributionItems =
    distributionKey === 'api'
      ? api_case_distribution || []
      : distributionKey === 'functional'
        ? functional_case_distribution || []
        : ui_case_distribution || [];
  const distributionTotal = distributionItems.reduce(
    (sum, item) => sum + Number(item?.value || 0),
    0,
  );
  const distributionMoreUrl =
    distributionKey === 'api'
      ? '/scenario/testcase'
      : distributionKey === 'functional'
        ? '/scenario/functionalCase'
        : '/ui-test/cases';

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="tailadmin-scope grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <WelcomeBanner currentUser={currentUser} primaryColor={primaryColor} />
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <MetricCard
            icon={<FolderOpenOutlined />}
            label="参与项目"
            value={project_count || 0}
          />
          <MetricCard
            icon={<TeamOutlined />}
            label="团队排名"
            value={user_rank === 0 ? '-' : user_rank}
            suffix={`/ ${total_user || 0}`}
          />
          <SplitMetricCard
            icon={<FileDoneOutlined />}
            label="用例数量（接口/功能/UI）"
            total={Number(case_count || 0)}
            apiValue={Number(api_case_count || 0)}
            functionalValue={Number(functional_case_count || 0)}
            uiValue={Number(ui_case_count || 0)}
          />
          <SplitMetricCard
            icon={<EditOutlined />}
            label="最近7天新增（接口/功能/UI）"
            total={weeklyTotal}
            apiValue={weeklyApi}
            functionalValue={weeklyFunctional}
            uiValue={weeklyUi}
          />
        </div>

        <div className="col-span-12 grid grid-cols-1 items-start gap-4 xl:grid-cols-[3fr_2fr] md:gap-6">
          <WeeklyCaseChart weekCase={normalizedWeekCase} />
          <CaseDistributionCard
            total={distributionTotal}
            items={distributionItems}
            activeKey={distributionKey}
            onChange={setDistributionKey}
            onMore={() => history.push(distributionMoreUrl)}
          />
        </div>

        <div className="col-span-12">
          <div className="mb-4 flex items-center gap-2">
            <RocketOutlined className="text-brand-500" />
            <h3 className="text-[16px] font-semibold text-gray-800">
              关注中的测试计划
            </h3>
            <Badge size="sm" color="primary">
              {followPlan.length} 个
            </Badge>
          </div>

          {followPlan.length === 0 ? (
            <Card className="text-center">
              <div className="py-10 text-theme-sm text-gray-400">
                你还没有关注测试计划，赶紧去{' '}
                <a
                  href="/#/apiTest/testplan"
                  className="font-medium text-brand-500"
                >
                  接口测试计划
                </a>{' '}
                、UI 测试计划或性能测试计划吧！
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
              {followPlan.map((item) => (
                <PlanCard key={item.plan?.id || item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(Workspace);
