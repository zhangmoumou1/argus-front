import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect } from '@umijs/max';
import { DatePicker } from 'antd';
import {
  ApiOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FunctionOutlined,
  LineChartOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { queryStatistics } from '@/services/statistics';
import auth from '@/utils/auth';
import UserLink from '@/components/Button/UserLink';
import Card from '@/components/tailadmin/Card';
import ApexChart from '@/components/tailadmin/ApexChart';
import StatCard from '@/components/tailadmin/StatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/tailadmin/Table';
import { Tooltip } from 'antd';

const { RangePicker } = DatePicker;

dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);

const PERIOD_OPTIONS = [
  {
    key: 'week',
    label: '本周',
    getRange: () => [dayjs().startOf('isoWeek'), dayjs()],
  },
  {
    key: 'month',
    label: '本月',
    getRange: () => [dayjs().startOf('month'), dayjs()],
  },
  {
    key: 'quarter',
    label: '本季度',
    getRange: () => [dayjs().startOf('quarter'), dayjs()],
  },
  {
    key: 'year',
    label: '本年',
    getRange: () => [dayjs().startOf('year'), dayjs()],
  },
];

const getPresetRange = (period) => {
  const matched =
    PERIOD_OPTIONS.find((item) => item.key === period) || PERIOD_OPTIONS[0];
  return matched.getRange();
};

const formatPercent = (value) => {
  const normalized = Number(value || 0);
  const display = normalized > 1 ? normalized : normalized * 100;
  return `${display.toFixed(2)}%`;
};

const buildSparkline = (trend = [], field) =>
  (trend || []).map((item) => Number(item?.[field] || 0));

const formatAxisDate = (value) => {
  if (!value) return '';
  const text = String(value);
  const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return text;
  return `${matched[2]}/${matched[3]}`;
};

const buildFilledTrend = (range = {}, trend = []) => {
  const startSource = Array.isArray(range) ? range[0] : range?.start_date;
  const endSource = Array.isArray(range) ? range[1] : range?.end_date;
  const start = startSource ? dayjs(startSource) : null;
  const end = endSource ? dayjs(endSource) : null;
  if (!start || !end || !start.isValid() || !end.isValid()) {
    return trend || [];
  }

  const trendMap = new Map(
    (trend || []).map((item) => [String(item?.date || ''), item || {}]),
  );
  const result = [];
  let cursor = start.clone().startOf('day');
  const finalDay = end.clone().startOf('day');

  while (cursor.isSameOrBefore(finalDay, 'day')) {
    const date = cursor.format('YYYY-MM-DD');
    const current = trendMap.get(date) || {};
    result.push({
      date,
      api_case_count: Number(current?.api_case_count || 0),
      functional_case_count: Number(current?.functional_case_count || 0),
    });
    cursor = cursor.add(1, 'day');
  }

  return result;
};

const RankBadge = ({ rank }) => {
  const map = {
    1: 'bg-warning-100 text-warning-700',
    2: 'bg-gray-200 text-gray-700',
    3: 'bg-orange-100 text-orange-700',
  };
  const cls = map[rank] || 'bg-gray-100 text-gray-500';
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-theme-xs font-semibold ${cls}`}
    >
      {rank}
    </span>
  );
};

const RankingTable = ({ rows = [], userMap = {}, emptyText }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="py-10 text-center text-theme-sm text-gray-400">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-y border-gray-100">
          <TableCell
            isHeader
            className="py-3 font-medium text-gray-500 text-start text-theme-xs"
          >
            排名
          </TableCell>
          <TableCell
            isHeader
            className="py-3 font-medium text-gray-500 text-start text-theme-xs"
          >
            测试人员
          </TableCell>
          <TableCell
            isHeader
            className="py-3 pr-4 font-medium text-gray-500 text-end text-theme-xs"
          >
            新增用例数
          </TableCell>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100">
          {rows.map((record) => {
            const matchedUser =
              userMap[record.user_id] || userMap[String(record.user_id)];
            return (
              <TableRow key={`${record.user_id}-${record.rank}`}>
                <TableCell className="py-3">
                  <RankBadge rank={record.rank} />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center">
                    <UserLink
                      user={matchedUser}
                      size={30}
                      marginLeft={8}
                    />
                  </div>
                </TableCell>
                <TableCell className="py-3 pr-4 text-end">
                  <span className="text-theme-sm font-semibold text-gray-800">
                    {record.count || 0}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const Statistics = ({ user, dispatch }) => {
  const { userMap = {} } = user || {};
  const [period, setPeriod] = useState('week');
  const [range, setRange] = useState(getPresetRange('week'));
  const [loading, setLoading] = useState(false);
  const [rankingTab, setRankingTab] = useState('api');
  const [trendVisibility, setTrendVisibility] = useState({
    api: true,
    functional: true,
  });
  const [statistics, setStatistics] = useState({
    range: {},
    overview: {},
    trend: [],
    ranking: { api_case: [], functional_case: [] },
  });

  const fetchStatistics = async (nextPeriod, nextRange) => {
    if (!nextRange || nextRange.length !== 2) return;
    setLoading(true);
    const res = await queryStatistics({
      period: nextPeriod,
      start_date: nextRange[0].format('YYYY-MM-DD'),
      end_date: nextRange[1].format('YYYY-MM-DD'),
    });
    setLoading(false);
    if (auth.response(res)) {
      setStatistics(res.data || {});
    }
  };

  useEffect(() => {
    dispatch({ type: 'user/fetchUserList' });
    fetchStatistics(period, range);
  }, []);

  const overview = statistics.overview || {};
  const overviewChange = statistics.overview_change || {};
  const trend = statistics.trend || [];
  const filledTrend = useMemo(
    () => buildFilledTrend(range, trend),
    [range, trend],
  );

  const trendDates = useMemo(
    () => filledTrend.map((item) => item.date),
    [filledTrend],
  );
  const sparkApi = useMemo(
    () => buildSparkline(filledTrend, 'api_case_count'),
    [filledTrend],
  );
  const sparkFunctional = useMemo(
    () => buildSparkline(filledTrend, 'functional_case_count'),
    [filledTrend],
  );
  const sparkCoverage = useMemo(
    () => {
      const values = filledTrend.map((item) => {
        const apiCount = Number(item?.api_case_count || 0);
        const functionalCount = Number(item?.functional_case_count || 0);
        return functionalCount > 0
          ? Number(((apiCount / functionalCount) * 100).toFixed(2))
          : 0;
      });

      // When the selected range only has a single day, the overview percentage
      // can still be meaningful even if the daily denominator is zero.
      if (
        values.length === 1 &&
        values[0] === 0 &&
        Number(overview.api_coverage_rate || 0) > 0
      ) {
        const overviewValue = Number(overview.api_coverage_rate || 0);
        return [overviewValue > 1 ? overviewValue : Number((overviewValue * 100).toFixed(2))];
      }

      return values;
    },
    [filledTrend, overview.api_coverage_rate],
  );
  const sparkPass = useMemo(
    () =>
      filledTrend.map((item) => {
        const apiCount = Number(item?.api_case_count || 0);
        const functionalCount = Number(item?.functional_case_count || 0);
        return apiCount > 0
          ? Number(
              (
                (Math.min(functionalCount, apiCount) / apiCount) *
                100
              ).toFixed(2),
            )
          : 0;
      }),
    [filledTrend],
  );

  const trendOptions = {
    legend: { show: false },
    colors: ['#465FFF', '#12b76a'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: [2, 2],
      lineCap: 'round',
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.58,
        opacityTo: 0.14,
        shadeIntensity: 0.4,
        stops: [0, 78, 100],
      },
    },
    markers: {
      size: 3,
      strokeWidth: 2,
      hover: { size: 4 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      borderColor: '#E5E7EB',
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      theme: 'light',
      x: { show: false },
    },
    xaxis: {
      type: 'category',
      categories: trendDates,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '12px', colors: '#667085' },
        formatter: formatAxisDate,
      },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', colors: ['#6B7280'] } },
      min: 0,
      forceNiceScale: true,
    },
  };
  const trendSeries = [
    trendVisibility.api
      ? { name: '接口用例', data: sparkApi }
      : null,
    trendVisibility.functional
      ? { name: '功能用例', data: sparkFunctional }
      : null,
  ].filter(Boolean);

  const handlePresetClick = (nextPeriod) => {
    const nextRange = getPresetRange(nextPeriod);
    setPeriod(nextPeriod);
    setRange(nextRange);
    fetchStatistics(nextPeriod, nextRange);
  };

  const handleApplyCustomRange = () => {
    if (!range || range.length !== 2) return;
    setPeriod('custom');
    fetchStatistics('custom', range);
  };

  const rankingRows =
    rankingTab === 'api'
      ? statistics.ranking?.api_case
      : statistics.ranking?.functional_case;
  const currentRangeText =
    Array.isArray(range) && range.length === 2
      ? `${range[0]?.format?.('YYYY-MM-DD') || '-'} 至 ${range[1]?.format?.('YYYY-MM-DD') || '-'}`
      : '-';

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div
        className="tailadmin-scope grid grid-cols-12 gap-4 md:gap-6"
        style={{ opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}
      >
        {/* Filter toolbar */}
        <div className="col-span-12">
          <Card>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-800">
                  接口与功能用例统计
                </h3>
                <p className="mt-0.5 text-[13px] text-gray-500">
                  当前区间：{currentRangeText}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-0.5 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0.5 shadow-theme-xs">
                  {PERIOD_OPTIONS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handlePresetClick(item.key)}
                      className={`appearance-none rounded-md border-0 px-2.5 py-1.5 text-theme-sm font-medium outline-none transition focus:outline-none ${
                        period === item.key
                          ? 'bg-white text-gray-900 shadow-theme-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <RangePicker
                  size="small"
                  className="statistics-range-picker"
                  value={range}
                  onChange={(value) => {
                    if (value && value.length === 2) setRange(value);
                  }}
                  allowClear={false}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomRange}
                  className="appearance-none rounded-lg border-0 bg-brand-500 px-3.5 py-1.5 text-theme-sm font-medium text-white outline-none transition hover:bg-brand-600 focus:outline-none"
                >
                  应用时间段
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Overview cards */}
        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <StatCard
            icon={<ApiOutlined />}
            label="接口用例总数"
            value={overview.api_case_total || 0}
            sparkData={sparkApi}
            color="#12b76a"
            changeMeta={overviewChange.api_case_total}
          />
          <StatCard
            icon={<FunctionOutlined />}
            label="功能用例总数"
            value={overview.functional_case_total || 0}
            sparkData={sparkFunctional}
            color="#0ba5ec"
            changeMeta={overviewChange.functional_case_total}
          />
          <StatCard
            icon={<BarChartOutlined />}
            label="接口覆盖率"
            value={formatPercent(overview.api_coverage_rate)}
            sparkData={sparkCoverage}
            color="#465fff"
            changeMeta={overviewChange.api_coverage_rate}
          />
          <StatCard
            icon={<CheckCircleOutlined />}
            label="接口通过率"
            value={formatPercent(overview.api_pass_rate)}
            sparkData={sparkPass}
            color="#f79009"
            changeMeta={overviewChange.api_pass_rate}
          />
        </div>

        {/* Trend chart */}
        <div className="col-span-12 xl:col-span-8">
          <Card padding="px-5 pt-5 sm:px-6 sm:pt-6 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <LineChartOutlined className="text-brand-500" />
                <h3 className="text-[16px] font-semibold text-gray-800">
                  用例数趋势
                </h3>
                <Tooltip title="按当前区间展示接口用例与功能用例的每日变化">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[11px] text-gray-400">
                    <QuestionCircleOutlined />
                  </span>
                </Tooltip>
              </div>
              <div className="flex items-center gap-4 text-theme-sm sm:ml-auto sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTrendVisibility((prev) => ({ ...prev, api: !prev.api }))}
                  className={`flex items-center gap-2 border-0 bg-transparent p-0 shadow-none appearance-none transition outline-none focus:outline-none focus-visible:outline-none ${
                    trendVisibility.api ? 'text-gray-600' : 'text-gray-300'
                  }`}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'transparent',
                    border: 0,
                    padding: 0,
                    boxShadow: 'none',
                    borderRadius: 0,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: trendVisibility.api ? '#465FFF' : '#D0D5DD' }}
                  />
                  <span>接口用例</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrendVisibility((prev) => ({ ...prev, functional: !prev.functional }))}
                  className={`flex items-center gap-2 border-0 bg-transparent p-0 shadow-none appearance-none transition outline-none focus:outline-none focus-visible:outline-none ${
                    trendVisibility.functional ? 'text-gray-600' : 'text-gray-300'
                  }`}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'transparent',
                    border: 0,
                    padding: 0,
                    boxShadow: 'none',
                    borderRadius: 0,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: trendVisibility.functional ? '#12b76a' : '#D0D5DD' }}
                  />
                  <span>功能用例</span>
                </button>
              </div>
            </div>
            {filledTrend.length > 0 ? (
              <div className="mt-2.5">
                <ApexChart
                  type="area"
                  options={trendOptions}
                  series={trendSeries}
                  height={356}
                />
              </div>
            ) : (
              <div className="py-16 text-center text-theme-sm text-gray-400">
                暂无趋势数据
              </div>
            )}
          </Card>
        </div>

        {/* Ranking */}
        <div className="col-span-12 xl:col-span-4">
          <Card className="xl:h-[478px] xl:flex xl:flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrophyOutlined className="text-brand-500" />
                <h3 className="text-[16px] font-semibold text-gray-800">
                  用例排行榜
                </h3>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-0.5 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0.5 shadow-theme-xs">
              <button
                type="button"
                onClick={() => setRankingTab('api')}
                className={`w-full appearance-none rounded-md border-0 px-3 py-2 text-theme-sm font-medium outline-none transition focus:outline-none ${
                  rankingTab === 'api'
                    ? 'bg-white text-gray-900 shadow-theme-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                接口用例数
              </button>
              <button
                type="button"
                onClick={() => setRankingTab('functional')}
                className={`w-full appearance-none rounded-md border-0 px-3 py-2 text-theme-sm font-medium outline-none transition focus:outline-none ${
                  rankingTab === 'functional'
                    ? 'bg-white text-gray-900 shadow-theme-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                功能用例数
              </button>
            </div>
            <div className="mt-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
              <RankingTable
                rows={rankingRows}
                userMap={userMap}
                emptyText={
                  rankingTab === 'api'
                    ? '暂无接口用例排行数据'
                    : '暂无功能用例排行数据'
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(Statistics);
