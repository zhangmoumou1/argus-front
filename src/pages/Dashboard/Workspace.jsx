import React, { useEffect, useMemo } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect, history, useModel } from '@umijs/max';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EditOutlined,
  ExclamationCircleFilled,
  FileDoneOutlined,
  FolderOpenOutlined,
  RocketOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import common from '@/utils/common';
import { getAvatarByUser } from '@/utils/avatar';
import Card from '@/components/tailadmin/Card';
import Badge from '@/components/tailadmin/Badge';
import ApexChart from '@/components/tailadmin/ApexChart';

const getWelcome = (user) => {
  const hour = new Date().getHours();
  if (hour < 6) return `Hi, ${user}! 凌晨了，跑任务也别忘了休息`;
  if (hour < 9) return `早上好，${user}!`;
  if (hour < 12) return `上午好，${user}!`;
  if (hour < 14) return `中午好，${user}!`;
  if (hour < 19) return `下午好，${user}!`;
  return `晚上好，${user}! 今天的质量地图也点亮一下`;
};

const calculatePercent = (report) =>
  common.calPiePercent(
    report?.success_count || 0,
    (report?.success_count || 0) +
      (report?.failed_count || 0) +
      (report?.error_count || 0),
  );

const MetricCard = ({ icon, label, value, suffix }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
    <div className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-lg text-brand-500 text-lg">
      {icon}
    </div>
    <div className="mt-3.5">
      <span className="text-sm text-gray-500">{label}</span>
      <h4 className="mt-2 font-bold text-gray-800 text-title-sm">
        {value}
        {suffix ? (
          <span className="ml-1 text-base font-medium text-gray-400">
            {suffix}
          </span>
        ) : null}
      </h4>
    </div>
  </div>
);

const SplitMetricCard = ({
  icon,
  label,
  total,
  apiValue,
  functionalValue,
  suffix = '',
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-3.5 md:p-4">
    <div className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-lg text-brand-500 text-lg">
      {icon}
    </div>
    <div className="mt-3">
      <span className="text-theme-sm text-gray-500">{label}</span>
      <h4 className="mt-1.5 font-bold text-gray-800 text-title-sm">
        {total}
        {suffix ? (
          <span className="ml-1 text-base font-medium text-gray-400">
            {suffix}
          </span>
        ) : null}
      </h4>
      <div className="mt-2.5 flex items-center gap-3 text-theme-xs text-gray-500">
        <span>
          接口：
          <span className="ml-1 font-semibold text-gray-800">{apiValue}</span>
        </span>
        <span className="text-gray-300">|</span>
        <span>
          功能：
          <span className="ml-1 font-semibold text-gray-800">{functionalValue}</span>
        </span>
      </div>
    </div>
  </div>
);

const WelcomeBanner = ({ currentUser }) => (
  <div className="rounded-2xl bg-brand-500 p-5 md:p-6">
    <div className="flex items-center gap-4">
      <img
        src={getAvatarByUser(currentUser)}
        alt="avatar"
        className="w-16 h-16 rounded-full bg-white/20 ring-2 ring-white/30"
      />
      <div>
        <div className="text-[16px] font-semibold text-white">
          {getWelcome(currentUser?.name || '同学')}
        </div>
        <div className="mt-1 text-sm text-white/80">
          {currentUser?.email || '-'}
          {currentUser?.nickname ? ` · ${currentUser.nickname}` : ''}
        </div>
      </div>
    </div>
  </div>
);

const WeeklyCaseChart = ({ weekCase = [] }) => {
  const categories = weekCase.map((item) => item?.date || '');
  const apiData = weekCase.map((item) => Number(item?.api_case_count || item?.api_count || 0));
  const functionalData = weekCase.map((item) =>
    Number(item?.functional_case_count || item?.functional_count || 0),
  );
  const options = {
    colors: ['#465fff', '#12b76a'],
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
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      labels: { colors: '#667085' },
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: false }, y: { formatter: (val) => `${val} 条` } },
  };

  return (
    <Card padding="px-5 pt-5 sm:px-6 sm:pt-6 pb-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-gray-800">最近7天编写用例</h3>
        <button
          type="button"
          onClick={() => history.push('/apiTest/testcase')}
          className="text-theme-sm font-medium text-brand-500 hover:text-brand-600"
        >
          去编写
        </button>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[550px]">
          <ApexChart
            type="bar"
            options={options}
            series={[
              { name: '接口用例', data: apiData },
              { name: '功能用例', data: functionalData },
            ]}
            height={205}
          />
        </div>
      </div>
    </Card>
  );
};

const PassRateRing = ({ percent }) => {
  const value = Math.round(percent * 100);
  const options = {
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
        track: { background: '#E4E7EC', strokeWidth: '100%', margin: 5 },
        dataLabels: {
          name: { show: true, offsetY: 18, color: '#667085', fontSize: '12px' },
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
  };
  return (
    <ApexChart
      type="radialBar"
      options={options}
      series={[value]}
      height={200}
    />
  );
};

const TrendSparkline = ({ data }) => {
  const options = {
    chart: {
      type: 'area',
      fontFamily: 'Outfit, sans-serif',
      sparkline: { enabled: true },
    },
    colors: ['#465fff'],
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0 } },
    tooltip: {
      x: { show: false },
      y: { formatter: (val) => `${val}%` },
    },
  };
  return (
    <ApexChart
      type="area"
      options={options}
      series={[{ name: '通过率', data }]}
      height={120}
    />
  );
};

const StatPill = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
    {icon}
    <span className="text-theme-sm text-gray-500">{label}</span>
    <span className="ml-auto text-theme-sm font-semibold text-gray-800">
      {value}
    </span>
  </div>
);

const PlanCard = ({ item }) => {
  const latest = item.report?.[0];
  const sparkData = useMemo(
    () =>
      [...(item.report || [])]
        .reverse()
        .map((report) => Math.round(calculatePercent(report) * 100)),
    [item.report],
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <a
          href="/#/apiTest/testplan"
          className="text-base font-semibold text-gray-800 hover:text-brand-500"
        >
          {item.plan?.name || '未命名计划'}
        </a>
        <Badge size="sm" color={latest ? 'success' : 'light'}>
          {latest ? '已有报告' : '待执行'}
        </Badge>
      </div>

      {!latest ? (
        <div className="mt-6 rounded-xl bg-gray-50 py-10 text-center text-theme-sm text-gray-400">
          这个测试计划还没有执行记录哦，先来一次漂亮的首跑吧
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-12 gap-5">
          <div className="col-span-12 md:col-span-4">
            <PassRateRing percent={calculatePercent(latest)} />
            <p className="mt-2 text-center text-theme-xs text-gray-400">
              {latest.start_at}
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col justify-center gap-2">
            <StatPill
              icon={<CheckCircleFilled style={{ color: '#12b76a' }} />}
              label="成功"
              value={latest.success_count || 0}
            />
            <StatPill
              icon={<CloseCircleFilled style={{ color: '#f04438' }} />}
              label="失败"
              value={latest.failed_count || 0}
            />
            <StatPill
              icon={<ExclamationCircleFilled style={{ color: '#f79009' }} />}
              label="错误"
              value={latest.error_count || 0}
            />
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col justify-center">
            <span className="text-theme-xs text-gray-500">近7次通过率</span>
            <TrendSparkline data={sparkData} />
          </div>
        </div>
      )}
    </div>
  );
};

const Workspace = ({ user, dispatch }) => {
  const {
    project_count,
    case_count,
    api_case_count,
    functional_case_count,
    weekly_new_api_case,
    weekly_new_functional_case,
    user_rank,
    total_user,
    weekly_case,
    month_case,
    followPlan = [],
  } = user;

  const { initialState } = useModel('@@initialState');
  const { currentUser = {} } = initialState || {};

  useEffect(() => {
    dispatch({ type: 'user/queryUserStatistics' });
    dispatch({ type: 'user/queryFollowTestPlanData' });
  }, []);

  const normalizedWeekCase = useMemo(() => {
    if (Array.isArray(weekly_case) && weekly_case.length > 0) return weekly_case;
    // backward fallback for older payloads
    if (Array.isArray(month_case) && month_case.length > 0) return month_case.slice(-7);
    return [];
  }, [weekly_case, month_case]);

  const weeklyApi = Number(weekly_new_api_case || 0);
  const weeklyFunctional = Number(weekly_new_functional_case || 0);
  const weeklyTotal = weeklyApi + weeklyFunctional;

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="tailadmin-scope grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <WelcomeBanner currentUser={currentUser} />
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
            label="用例数量（接口/功能）"
            total={Number(case_count || 0)}
            apiValue={Number(api_case_count || 0)}
            functionalValue={Number(functional_case_count || 0)}
            suffix="条"
          />
          <SplitMetricCard
            icon={<EditOutlined />}
            label="最近7天新增（接口/功能）"
            total={weeklyTotal}
            apiValue={weeklyApi}
            functionalValue={weeklyFunctional}
            suffix="条"
          />
        </div>

        <div className="col-span-12">
          <WeeklyCaseChart weekCase={normalizedWeekCase} />
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
                  关注
                </a>{' '}
                一个吧！
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
