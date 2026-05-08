import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Skeleton,
  Space,
  Table,
  Tabs,
} from 'antd';
import {
  ApiOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  FunctionOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { Line, TinyArea } from '@ant-design/charts';
import moment from 'moment';
import { queryStatistics } from '@/services/statistics';
import auth from '@/utils/auth';
import UserLink from '@/components/Button/UserLink';
import './Statistics.less';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const PERIOD_OPTIONS = [
  { key: 'week', label: '本周', getRange: () => [moment().startOf('isoWeek'), moment()] },
  { key: 'month', label: '本月', getRange: () => [moment().startOf('month'), moment()] },
  { key: 'quarter', label: '本季度', getRange: () => [moment().startOf('quarter'), moment()] },
  { key: 'year', label: '本年', getRange: () => [moment().startOf('year'), moment()] },
];

const getPresetRange = (period) => {
  const matched = PERIOD_OPTIONS.find((item) => item.key === period) || PERIOD_OPTIONS[0];
  return matched.getRange();
};

const buildTrendSource = (trend = []) => {
  const result = [];
  trend.forEach((item) => {
    result.push({
      date: item.date,
      type: '接口用例',
      count: item.api_case_count || 0,
    });
    result.push({
      date: item.date,
      type: '功能用例',
      count: item.functional_case_count || 0,
    });
  });
  return result;
};

const buildSparkline = (trend = [], field) => (
  (trend || []).map((item) => Number(item?.[field] || 0))
);

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const RankUser = ({ record, userMap = {} }) => {
  const matchedUser = userMap[record.user_id] || userMap[String(record.user_id)];
  return (
    <div className="statistics-rank-user">
      <UserLink user={matchedUser} size={30} marginLeft={6} />
      <div className="statistics-rank-user__meta">
        {!matchedUser ? <div className="statistics-rank-user__name">{record.name}</div> : null}
        <div className="statistics-rank-user__email">{record.email || matchedUser?.email || '-'}</div>
      </div>
    </div>
  );
};

const Statistics = ({ user, dispatch }) => {
  const { userMap = {} } = user || {};
  const [period, setPeriod] = useState('week');
  const [range, setRange] = useState(getPresetRange('week'));
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    range: {},
    overview: {},
    trend: [],
    ranking: {
      api_case: [],
      functional_case: [],
    },
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

  const trendData = useMemo(() => buildTrendSource(statistics.trend || []), [statistics.trend]);

  const trendConfig = {
    data: trendData,
    xField: 'date',
    yField: 'count',
    seriesField: 'type',
    smooth: true,
    color: ['#246BFD', '#12B886'],
    animation: false,
    legend: {
      position: 'top',
    },
    point: {
      size: 3,
      shape: 'circle',
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.type,
        value: `${datum.count}`,
      }),
    },
    yAxis: {
      nice: true,
    },
  };

  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 80,
      render: (value) => <span className={`statistics-rank-badge rank-${value}`}>{value}</span>,
    },
    {
      title: '测试人员',
      dataIndex: 'name',
      render: (_, record) => <RankUser record={record} userMap={userMap} />,
    },
    {
      title: '新增用例数',
      dataIndex: 'count',
      width: 120,
      align: 'right',
      render: (value) => <strong>{value || 0}</strong>,
    },
  ];

  const overview = statistics.overview || {};
  const sparkApi = useMemo(() => buildSparkline(statistics.trend, 'api_case_count'), [statistics.trend]);
  const sparkFunctional = useMemo(() => buildSparkline(statistics.trend, 'functional_case_count'), [statistics.trend]);
  const sparkCoverage = useMemo(() => (
    (statistics.trend || []).map((item) => {
      const apiCount = Number(item?.api_case_count || 0);
      const functionalCount = Number(item?.functional_case_count || 0);
      return functionalCount > 0 ? Number((apiCount / functionalCount * 100).toFixed(2)) : 0;
    })
  ), [statistics.trend]);
  const sparkPass = useMemo(() => (
    (statistics.trend || []).map((item) => {
      const apiCount = Number(item?.api_case_count || 0);
      const functionalCount = Number(item?.functional_case_count || 0);
      return apiCount > 0 ? Number((Math.min(functionalCount, apiCount) / apiCount * 100).toFixed(2)) : 0;
    })
  ), [statistics.trend]);

  const renderSparkline = (data, color, fill) => (
    <TinyArea
      height={56}
      autoFit
      smooth
      animation={false}
      data={data && data.length > 0 ? data : [0]}
      line={{ color, lineWidth: 1.5 }}
      areaStyle={{ fill }}
      tooltip={false}
    />
  );

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

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="statistics-board">
        <Card className="statistics-filter-card" bordered={false}>
          <div className="statistics-filter-card__content">
            <div>
              <div className="statistics-filter-card__title">接口与功能用例统计</div>
              <div className="statistics-filter-card__desc">
                当前区间：{statistics.range?.start_date || '-'} 至 {statistics.range?.end_date || '-'}
              </div>
            </div>
            <Space size={12} wrap className="statistics-filter-toolbar">
              {PERIOD_OPTIONS.map((item) => (
                <Button
                  key={item.key}
                  type={period === item.key ? 'primary' : 'default'}
                  onClick={() => handlePresetClick(item.key)}
                >
                  {item.label}
                </Button>
              ))}
              <RangePicker
                value={range}
                onChange={(value) => {
                  if (value && value.length === 2) {
                    setRange(value);
                  }
                }}
                allowClear={false}
              />
              <Button onClick={handleApplyCustomRange}>应用时间段</Button>
            </Space>
          </div>
        </Card>

        <Row gutter={[16, 16]} className="statistics-overview-row">
          <Col xs={24} sm={12} xl={6}>
            <Skeleton loading={loading} active paragraph={false}>
              <Card className="statistics-overview-card api" bordered={false}>
                <div className="statistics-overview-card__head">
                  <div>
                    <div className="statistics-overview-card__label">接口用例总数</div>
                    <div className="statistics-overview-card__value">{overview.api_case_total || 0}</div>
                    <div className="statistics-overview-card__hint">按所选时间段统计新增接口用例</div>
                  </div>
                  <div className="statistics-overview-card__icon api">
                    <ApiOutlined />
                  </div>
                </div>
                <div className="statistics-overview-card__chart">
                  {renderSparkline(sparkApi, '#1f9d68', 'l(270) 0:#dff7ec 1:rgba(223,247,236,0.05)')}
                </div>
              </Card>
            </Skeleton>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Skeleton loading={loading} active paragraph={false}>
              <Card className="statistics-overview-card functional" bordered={false}>
                <div className="statistics-overview-card__head">
                  <div>
                    <div className="statistics-overview-card__label">功能用例总数</div>
                    <div className="statistics-overview-card__value">{overview.functional_case_total || 0}</div>
                    <div className="statistics-overview-card__hint">按所选时间段统计新增功能用例</div>
                  </div>
                  <div className="statistics-overview-card__icon functional">
                    <FunctionOutlined />
                  </div>
                </div>
                <div className="statistics-overview-card__chart">
                  {renderSparkline(sparkFunctional, '#0ea5a6', 'l(270) 0:#def7f4 1:rgba(222,247,244,0.05)')}
                </div>
              </Card>
            </Skeleton>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Skeleton loading={loading} active paragraph={false}>
              <Card className="statistics-overview-card coverage" bordered={false}>
                <div className="statistics-overview-card__head">
                  <div>
                    <div className="statistics-overview-card__label">接口覆盖率</div>
                    <div className="statistics-overview-card__value">{formatPercent(overview.api_coverage_rate || 0)}</div>
                    <div className="statistics-overview-card__hint">接口用例总数 / 高优先级功能用例总数</div>
                  </div>
                  <div className="statistics-overview-card__icon coverage">
                    <BarChartOutlined />
                  </div>
                </div>
                <div className="statistics-overview-card__chart">
                  {renderSparkline(sparkCoverage, '#2f7df4', 'l(270) 0:#deebff 1:rgba(222,235,255,0.05)')}
                </div>
              </Card>
            </Skeleton>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Skeleton loading={loading} active paragraph={false}>
              <Card className="statistics-overview-card pass" bordered={false}>
                <div className="statistics-overview-card__head">
                  <div>
                    <div className="statistics-overview-card__label">接口通过率</div>
                    <div className="statistics-overview-card__value">{formatPercent(overview.api_pass_rate || 0)}</div>
                    <div className="statistics-overview-card__hint">按所选时间段统计已完成报告通过率</div>
                  </div>
                  <div className="statistics-overview-card__icon pass">
                    <CheckCircleOutlined />
                  </div>
                </div>
                <div className="statistics-overview-card__chart">
                  {renderSparkline(sparkPass, '#f59e0b', 'l(270) 0:#fff1d6 1:rgba(255,241,214,0.05)')}
                </div>
              </Card>
            </Skeleton>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="statistics-main-row">
          <Col xs={24} xl={16}>
            <Skeleton loading={loading} active>
              <Card
                className="statistics-panel-card statistics-trend-card"
                bordered={false}
                title={(
                  <div className="statistics-panel-card__header">
                    <div className="statistics-panel-card__title">
                      <LineChartOutlined />
                      <span>用例数趋势</span>
                    </div>
                  </div>
                )}
              >
                {trendData.length > 0 ? <Line {...trendConfig} /> : <Empty description="暂无趋势数据" />}
              </Card>
            </Skeleton>
          </Col>
          <Col xs={24} xl={8}>
            <Skeleton loading={loading} active>
              <Card
                className="statistics-panel-card statistics-ranking-card"
                bordered={false}
                title={(
                  <span className="statistics-panel-card__title">
                    <FileDoneOutlined />
                    <span>用例排行榜</span>
                  </span>
                )}
              >
                <Tabs defaultActiveKey="api">
                  <TabPane tab="接口用例数" key="api">
                    <Table
                      rowKey={(record) => `api-${record.user_id}-${record.rank}`}
                      columns={rankingColumns}
                      dataSource={statistics.ranking?.api_case || []}
                      pagination={false}
                      locale={{ emptyText: <Empty description="暂无接口用例排行数据" /> }}
                    />
                  </TabPane>
                  <TabPane tab="功能用例数" key="functional">
                    <Table
                      rowKey={(record) => `functional-${record.user_id}-${record.rank}`}
                      columns={rankingColumns}
                      dataSource={statistics.ranking?.functional_case || []}
                      pagination={false}
                      locale={{ emptyText: <Empty description="暂无功能用例排行数据" /> }}
                    />
                  </TabPane>
                </Tabs>
              </Card>
            </Skeleton>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="statistics-footnote-row">
          <Col span={24} />
        </Row>
      </div>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(Statistics);
