import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect, useParams } from '@umijs/max';
import { Area, Column } from '@ant-design/charts';
import { Alert, Button, Card, Col, Descriptions, Drawer, Empty, List, Progress, Row, Segmented, Space, Statistic, Table, Tabs, Tag } from 'antd';
import { queryPerformanceReport } from '@/services/performance';
import auth from '@/utils/auth';
import {
  performancePalette,
  performancePanelStyle,
} from './ModuleShell';

const parseSummary = (value) => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return {};
    }
  }
  return value;
};

const stringifyBlock = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const formatSourceType = (value) => {
  if (value === 'api_scenario' || value === 'link') return '接口场景';
  if (value === 'manual') return '手动接口';
  return '接口资产';
};

const formatLoadMode = (value) => (value === 'qps' ? 'QPS 模式' : '并发模式');

const formatSampleStatus = (value, errorType) => {
  if (value === 'success') return { label: '成功', color: 'success' };
  if (value === 'assertion_failed' || errorType === 'ASSERT_FAILED') return { label: '断言失败', color: 'warning' };
  return { label: '错误', color: 'error' };
};

const formatSampleScope = (value) => {
  if (value === 'setup') return '预置';
  if (value === 'runtime_chain') return '链路';
  if (value === 'report_finalize') return '收尾';
  return '请求';
};

const normalizeRequestRecord = (item, index) => {
  const status = item.status || (item.error_type === 'ASSERT_FAILED' ? 'assertion_failed' : 'error');
  const rawRequestSample = item.request_sample || {};
  const requestSample = rawRequestSample?.request
    ? rawRequestSample
    : {
      variables: rawRequestSample?.variables || {},
      request: {
        method: rawRequestSample?.method || item.method || '-',
        url: rawRequestSample?.url || item.url || '-',
        headers: rawRequestSample?.headers || {},
        query: rawRequestSample?.query || {},
        body: rawRequestSample?.body || '',
      },
    };
  return {
    key: `${item.timestamp || 'sample'}-${index}`,
    timestamp: item.timestamp || '-',
    status,
    method: item.method || requestSample?.request?.method || '-',
    url: item.url || requestSample?.request?.url || '-',
    status_code: item.status_code ?? '-',
    response_time_ms: item.response_time_ms ?? 0,
    error_type: item.error_type || '',
    message: item.message || (status === 'success' ? '请求成功' : '请求失败'),
    request_sample: requestSample,
    response_sample: item.response_sample || '',
    assertion_results: item.assertion_results || [],
    assertion_failed: !!item.assertion_failed || status === 'assertion_failed',
    sample_scope: item.sample_scope || 'runtime',
    setup_scope: item.setup_scope || '',
    steps: item.steps || [],
    step_count: item.step_count || (Array.isArray(item.steps) ? item.steps.length : 0),
  };
};

const thresholdColumns = [
  { title: '指标', dataIndex: 'name', key: 'name' },
  { title: '期望值', dataIndex: 'expected', key: 'expected' },
  { title: '实际值', dataIndex: 'actual', key: 'actual' },
  {
    title: '结果',
    dataIndex: 'passed',
    key: 'passed',
    width: 100,
    render: (value) => (value ? <Tag color="success">通过</Tag> : <Tag color="error">未通过</Tag>),
  },
];

const timelineColumns = [
  { title: '时间片', dataIndex: 'label', key: 'label', width: 110 },
  { title: 'RPS', dataIndex: 'rps', key: 'rps', width: 90 },
  { title: '成功', dataIndex: 'success', key: 'success', width: 90 },
  { title: '失败', dataIndex: 'failed', key: 'failed', width: 90 },
  { title: '平均耗时(ms)', dataIndex: 'avg_rt_ms', key: 'avg_rt_ms', width: 130 },
];

const metricCardStyle = {
  borderRadius: 18,
  border: '1px solid #e8eef8',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
};

const softCardStyle = {
  ...metricCardStyle,
  overflow: 'hidden',
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
};

const chainNodeStyle = {
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid #e6edf7',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
};

const buildSampleColumns = ({ onOpenRequest, onOpenResponse, onOpenAssertions }) => [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 168,
  },
  {
    title: '结果',
    key: 'status',
    dataIndex: 'status',
    width: 110,
    render: (value, record) => {
      const current = formatSampleStatus(value, record.error_type);
      return <Tag color={current.color}>{current.label}</Tag>;
    },
  },
  {
    title: '分类',
    key: 'sample_scope',
    dataIndex: 'sample_scope',
    width: 90,
    render: (value) => <Tag>{formatSampleScope(value)}</Tag>,
  },
  {
    title: '请求方式',
    dataIndex: 'method',
    key: 'method',
    width: 96,
  },
  {
    title: '请求地址',
    dataIndex: 'url',
    key: 'url',
    ellipsis: true,
  },
  {
    title: '响应时间',
    dataIndex: 'response_time_ms',
    key: 'response_time_ms',
    width: 110,
    render: (value) => `${value || 0} ms`,
  },
  {
    title: '响应码',
    dataIndex: 'status_code',
    key: 'status_code',
    width: 90,
    render: (value) => value ?? '-',
  },
  {
    title: '说明',
    dataIndex: 'message',
    key: 'message',
    width: 220,
    ellipsis: true,
  },
  {
    title: '请求样本',
    key: 'request',
    width: 110,
    render: (_, record) => (
      <Button type="link" size="small" onClick={() => onOpenRequest(record)}>
        查看请求
      </Button>
    ),
  },
  {
    title: '响应样本',
    key: 'response',
    width: 110,
    render: (_, record) => (
      <Button
        type="link"
        size="small"
        disabled={!record.response_sample}
        onClick={() => onOpenResponse(record)}
      >
        查看响应
      </Button>
    ),
  },
  {
    title: '断言',
    key: 'assertion',
    width: 110,
    render: (_, record) => (
      <Button
        type="link"
        size="small"
        disabled={!record.assertion_results?.length}
        onClick={() => onOpenAssertions(record)}
      >
        查看断言
      </Button>
    ),
  },
];

const areaChartConfig = {
  smooth: true,
  autoFit: true,
  height: 300,
  xAxis: {
    tickCount: 6,
    line: { style: { stroke: '#cbd5e1' } },
    label: { style: { fill: '#475569' } },
  },
  yAxis: {
    grid: { line: { style: { stroke: '#e2e8f0', lineDash: [4, 4] } } },
    label: { style: { fill: '#64748b' } },
  },
  tooltip: {
    domStyles: {
      'g2-tooltip': {
        borderRadius: '14px',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
      },
    },
  },
};

const reportTabStyle = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)',
  borderRadius: 24,
  border: '1px solid rgba(148, 163, 184, 0.16)',
  boxShadow: '0 20px 48px rgba(15, 23, 42, 0.08)',
  padding: 12,
};

const ReportDetail = ({ dispatch, gconfig, loading }) => {
  const { id } = useParams();
  const [fetching, setFetching] = useState(false);
  const [payload, setPayload] = useState(null);
  const [sampleFilter, setSampleFilter] = useState('all');
  const [activeSample, setActiveSample] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState('request');

  const { envMap = {} } = gconfig || {};

  const fetchReport = async () => {
    setFetching(true);
    const res = await queryPerformanceReport({ id });
    setFetching(false);
    if (auth.response(res)) {
      setPayload(res.data);
    }
  };

  useEffect(() => {
    dispatch({ type: 'gconfig/fetchEnvList', payload: { page: 1, size: 1000, exactly: true } });
    fetchReport();
  }, [id]);

  const derived = useMemo(() => {
    if (!payload) {
      return {
        summaryData: {},
        sourceType: '',
        successRate: 0,
        thresholdPassRate: 0,
        requestRecords: [],
        filteredRequestRecords: [],
        sampleStats: { all: 0, success: 0, error: 0, assertion_failed: 0 },
        requestRecordMeta: {
          total: 0, sampled: 0, truncated: false, mergedErrors: 0, errorTotal: 0, unsampledErrorMessage: '', setupTotal: 0,
        },
        throughputSeries: [],
        latencySeries: [],
        errorDistribution: [],
        isChainReport: false,
        chainPreview: [],
        chainStepRows: [],
        chainStepChartData: [],
        requestSnapshot: {},
        parameterSnapshot: {},
        startedAt: '',
        finishedAt: '',
        apiRankings: [],
        conclusion: '',
        failedReasons: [],
        suggestions: [],
      };
    }

    const { report, summary, timeline = [], errors = [], thresholds = [] } = payload;
    const summaryData = parseSummary(summary);
    const requestSnapshot = summaryData.request_snapshot || {
      method: report.request_method,
      url: report.request_url,
      headers: {},
      query: {},
      body: '',
    };
    const parameterSnapshot = summaryData.parameter_snapshot || summaryData.parameter_config || {};
    const startedAt = summaryData.started_at || report.created_at || '';
    const finishedAt = summaryData.finished_at || report.updated_at || report.created_at || '';
    const sourceType = formatSourceType(summaryData.source_type);
    const isChainReport = ['api_scenario', 'link'].includes(summaryData.source_type);
    const successRate = report.total_requests
      ? Number(((report.success_count / report.total_requests) * 100).toFixed(2))
      : 0;
    const thresholdPassRate = thresholds.length
      ? Number(((thresholds.filter((item) => item.passed).length / thresholds.length) * 100).toFixed(2))
      : 100;

    const sampledRequestRecords = Array.isArray(summaryData.request_records) ? summaryData.request_records : [];
    const setupRecords = Array.isArray(summaryData.setup_records) ? summaryData.setup_records : [];
    const sampledErrorCount = sampledRequestRecords.filter((item) => item.status === 'error' || item.status === 'assertion_failed' || item.error_type).length;
    const placeholderErrors = (errors || []).filter((item) => item.error_type === 'UNSAMPLED_FAILURE');
    const unsampledErrorMessage = placeholderErrors[0]?.message || '';
    const normalizedErrors = (errors || [])
      .filter((item) => item.error_type !== 'UNSAMPLED_FAILURE')
      .map((item) => ({
        ...item,
        status: item.error_type === 'ASSERT_FAILED' ? 'assertion_failed' : 'error',
      }));
    const shouldMergeErrors = !!normalizedErrors.length && (!sampledRequestRecords.length || sampledErrorCount < normalizedErrors.length);
    const rawRequestRecords = sampledRequestRecords.length
      ? [...setupRecords, ...sampledRequestRecords, ...(shouldMergeErrors ? normalizedErrors : [])]
      : [...setupRecords, ...normalizedErrors];
    const dedupedRequestRecords = rawRequestRecords.filter((item, index, list) => {
      const currentKey = [
        item.timestamp,
        item.status || item.error_type || '',
        item.response_time_ms,
        item.message || '',
      ].join('|');
      return list.findIndex((row) => [
        row.timestamp,
        row.status || row.error_type || '',
        row.response_time_ms,
        row.message || '',
      ].join('|') === currentKey) === index;
    });
    const requestRecords = dedupedRequestRecords.map(normalizeRequestRecord);
    const sampleStats = requestRecords.reduce((acc, item) => {
      acc.all += 1;
      if (item.status === 'success') {
        acc.success += 1;
      } else if (item.status === 'assertion_failed') {
        acc.assertion_failed += 1;
      } else {
        acc.error += 1;
      }
      return acc;
    }, { all: 0, success: 0, error: 0, assertion_failed: 0 });
    const requestRecordMeta = {
      total: Number(summaryData.request_records_total || requestRecords.length || 0),
      sampled: Number(summaryData.request_records_sampled || sampledRequestRecords.length || 0),
      truncated: !!summaryData.request_records_truncated,
      errorTotal: Number(summaryData.error_records_total || normalizedErrors.length || 0),
      mergedErrors: shouldMergeErrors ? normalizedErrors.length : 0,
      unsampledErrorMessage,
      setupTotal: Number(summaryData.setup_records_total || setupRecords.length || 0),
    };

    const filteredRequestRecords = requestRecords.filter((item) => sampleFilter === 'all' || item.status === sampleFilter);
    const throughputSeries = timeline.flatMap((item) => ([
      { second: item.label, value: Number(item.rps || 0), type: '总吞吐' },
      { second: item.label, value: Number(item.success || 0), type: '成功请求' },
      { second: item.label, value: Number(item.failed || 0), type: '失败请求' },
    ]));
    const latencySeries = timeline.map((item) => ({
      second: item.label,
      value: Number(item.avg_rt_ms || 0),
      type: '平均耗时',
    }));

    const errorMap = {};
    requestRecords
      .filter((item) => item.status !== 'success')
      .forEach((item) => {
        const currentKey = item.status === 'assertion_failed'
          ? '断言失败'
          : (item.status_code ? `HTTP ${item.status_code}` : item.error_type || '未知错误');
        errorMap[currentKey] = (errorMap[currentKey] || 0) + 1;
      });
    const errorDistribution = Object.keys(errorMap).map((key) => ({
      type: key,
      value: errorMap[key],
    }));

    const apiRankings = summaryData.api_rankings || [];
    const chainPreview = summaryData.chain_preview || [];
    const rankingMap = {};
    apiRankings.forEach((item) => {
      rankingMap[String(item.key || item.url || item.name)] = item;
    });
    const chainStepRows = chainPreview.map((item) => {
      const ranking = rankingMap[String(item.case_id)] || rankingMap[item.url] || rankingMap[item.name] || {};
      return {
        key: item.case_id || item.step_order,
        step_order: item.step_order,
        name: item.name,
        method: item.method,
        url: item.url,
        extractors: item.extractors || [],
        count: ranking.count || 0,
        avg_rt_ms: ranking.avg_rt_ms || 0,
        p95_rt_ms: ranking.p95_rt_ms || 0,
        error_rate: ranking.error_rate || 0,
      };
    });
    const chainStepChartData = chainStepRows.map((item) => ({
      name: `#${item.step_order} ${item.name?.length > 14 ? `${item.name.slice(0, 14)}...` : item.name}`,
      value: Number(item.p95_rt_ms || 0),
    }));
    const failedThresholds = thresholds.filter((item) => !item.passed).map((item) => item.name);
    const conclusion = failedThresholds.length
      ? `本次压测有 ${failedThresholds.join('、')} 未达标，建议优先关注错误样本、断言失败请求和耗时峰值时间片。`
      : '本次压测的核心阈值全部通过，结果可以作为这一轮版本或环境的性能基线。';
    const failedReasons = summaryData.failed_reasons || [];
    if (!failedReasons.length) {
      if (Number(report.error_rate || 0) > Number(summaryData.expect_error_rate || 0)) {
        failedReasons.push(`错误率 ${report.error_rate}% 超过阈值 ${summaryData.expect_error_rate || 0}%`);
      }
      if (requestRecords.some((item) => item.error_type === 'NETWORK_ERROR')) {
        failedReasons.push('报告样本中存在 NETWORK_ERROR，请优先检查网络连接、数据库连接池或下游依赖稳定性。');
      }
      if (!timeline.length && Number(report.total_requests || 0) > 0) {
        failedReasons.push('当前报告未保留时间片趋势数据，可能是旧报告或采样字段尚未写入。');
      }
    }
    const suggestions = [];
    if (Number(report.p95_rt_ms || 0) > Number(summaryData.expect_p95_ms || 0) && Number(summaryData.expect_p95_ms || 0) > 0) {
      suggestions.push('P95 超标，建议先检查慢 SQL、缓存命中率以及外部依赖链路。');
    }
    if (Number(report.error_rate || 0) > Number(summaryData.expect_error_rate || 0) && Number(summaryData.expect_error_rate || 0) > 0) {
      suggestions.push('错误率超标，建议排查请求超时、网关限流和服务端异常日志。');
    }
    if (sampleStats.assertion_failed > 0) {
      suggestions.push('存在断言失败，请重点核对返回状态码、响应字段与业务期望值是否一致。');
    }
    if (apiRankings[0]?.p95_rt_ms > 0) {
      suggestions.push(`当前最慢接口为 ${apiRankings[0].name}，P95=${apiRankings[0].p95_rt_ms}ms，建议优先针对该接口做定向优化。`);
    }
    if (!suggestions.length) {
      suggestions.push('本次报告整体平稳，可以继续做报告对比和基线回归。');
    }

    return {
      summaryData,
      sourceType,
      successRate,
      thresholdPassRate,
      requestRecords,
      filteredRequestRecords,
      sampleStats,
      requestRecordMeta,
      throughputSeries,
      latencySeries,
      errorDistribution,
      isChainReport,
      chainPreview,
      chainStepRows,
      chainStepChartData,
      requestSnapshot,
      parameterSnapshot,
      startedAt,
      finishedAt,
      apiRankings,
      conclusion,
      failedReasons,
      suggestions,
    };
  }, [payload, sampleFilter]);

  const openSampleDrawer = (sample, tab) => {
    setActiveSample(sample);
    setActiveDrawerTab(tab);
  };

  if (!payload) {
    return (
      <PageContainer title={false} breadcrumb={null}>
        <Card loading={fetching || loading.effects?.['gconfig/fetchEnvList']}>
          <Empty description="暂无性能报告数据" />
        </Card>
      </PageContainer>
    );
  }

  const { report, timeline, thresholds } = payload;
  const {
    summaryData,
    sourceType,
    successRate,
    thresholdPassRate,
    requestRecords,
    filteredRequestRecords,
    sampleStats,
    requestRecordMeta,
    throughputSeries,
    latencySeries,
    errorDistribution,
    isChainReport,
    chainPreview,
    chainStepRows,
    chainStepChartData,
    requestSnapshot,
    parameterSnapshot,
    startedAt,
    finishedAt,
    apiRankings,
    conclusion,
    failedReasons,
    suggestions,
  } = derived;
  const reportPassed = thresholds?.length ? thresholds.every((item) => item.passed) : true;
  const loadConfig = summaryData.load_config || {};
  const envName = envMap[summaryData.env] || envMap[report.env] || `环境#${summaryData.env || report.env || '-'}`;
  const sampleColumns = buildSampleColumns({
    onOpenRequest: (record) => openSampleDrawer(record, 'request'),
    onOpenResponse: (record) => openSampleDrawer(record, 'response'),
    onOpenAssertions: (record) => openSampleDrawer(record, 'assertion'),
  });
  const activeRequest = activeSample?.request_sample?.request || activeSample?.request_sample || {};
  const activeSteps = activeSample?.steps || activeSample?.request_sample?.steps || [];
  const configuredAssertions = summaryData.assertions_config || [];
  return (
    <PageContainer title={false} breadcrumb={null}>
      <div style={{ padding: '8px 0 24px', background: performancePalette.page, minHeight: 'calc(100vh - 120px)' }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card loading={fetching} style={{ ...softCardStyle, background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col span={16}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space size={8} wrap>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{report.plan_name}</span>
                  <Tag color="blue">{sourceType}</Tag>
                  <Tag color="purple">{formatLoadMode(summaryData.load_mode)}</Tag>
                  {isChainReport ? <Tag color="cyan">{`链路步骤 ${chainPreview.length}`}</Tag> : null}
                  {reportPassed ? <Tag color="success">报告通过</Tag> : <Tag color="error">报告未通过</Tag>}
                </Space>
                <span style={{ color: '#64748b' }}>{report.request_method} {report.request_url}</span>
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="报告ID">#{report.id}</Descriptions.Item>
                  <Descriptions.Item label="开始时间">{startedAt}</Descriptions.Item>
                  <Descriptions.Item label="结束时间">{finishedAt}</Descriptions.Item>
                  <Descriptions.Item label="执行环境">{envName}</Descriptions.Item>
                  <Descriptions.Item label="耗时">{report.cost || '-'}</Descriptions.Item>
                  <Descriptions.Item label="总请求">{report.total_requests || 0}</Descriptions.Item>
                </Descriptions>
              </Space>
            </Col>
            <Col span={8}>
              <Row gutter={12}>
                <Col span={12}>
                  <Card bordered={false} style={{ borderRadius: 16, background: 'linear-gradient(180deg, #f3f8ff 0%, #ffffff 100%)' }}>
                    <Statistic title="成功率" value={successRate} suffix="%" />
                    <Progress percent={successRate} showInfo={false} strokeColor="#1677ff" />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card bordered={false} style={{ borderRadius: 16, background: 'linear-gradient(180deg, #fff7eb 0%, #ffffff 100%)' }}>
                    <Statistic title="阈值通过率" value={thresholdPassRate} suffix="%" />
                    <Progress percent={thresholdPassRate} showInfo={false} strokeColor={reportPassed ? '#2f9f3d' : '#ec9a08'} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          <Col span={4}><Card style={metricCardStyle}><Statistic title="总请求数" value={report.total_requests || 0} /></Card></Col>
          <Col span={4}><Card style={metricCardStyle}><Statistic title="成功请求数" value={report.success_count || 0} /></Card></Col>
          <Col span={4}><Card style={metricCardStyle}><Statistic title="失败请求数" value={report.failed_count || 0} /></Card></Col>
          <Col span={4}><Card style={metricCardStyle}><Statistic title="平均响应时间" value={report.avg_rt_ms || 0} suffix="ms" /></Card></Col>
          <Col span={4}><Card style={metricCardStyle}><Statistic title="P95" value={report.p95_rt_ms || 0} suffix="ms" /></Card></Col>
          <Col span={4}><Card style={metricCardStyle}><Statistic title="断言失败数" value={summaryData.assertion_failed_count || 0} /></Card></Col>
        </Row>

        <Alert type={reportPassed ? 'success' : 'warning'} showIcon message={conclusion} />

        {!reportPassed && failedReasons.length ? (
          <Card title="通过 / 失败原因" style={metricCardStyle}>
            <List
              size="small"
              dataSource={failedReasons}
              renderItem={(item, index) => <List.Item>{index + 1}. {item}</List.Item>}
            />
          </Card>
        ) : null}

        <Tabs
          defaultActiveKey="overview"
          style={reportTabStyle}
          items={[
            {
              key: 'overview',
              label: '摘要与结论',
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Card title="压测配置" style={metricCardStyle}>
                    <Descriptions column={3}>
                      <Descriptions.Item label="并发数">{loadConfig.concurrency || report.concurrency || '-'}</Descriptions.Item>
                      <Descriptions.Item label="目标QPS">{loadConfig.target_qps || '-'}</Descriptions.Item>
                      <Descriptions.Item label="最大并发">{loadConfig.max_concurrency || report.concurrency || '-'}</Descriptions.Item>
                      <Descriptions.Item label="持续时间">{loadConfig.duration_seconds || summaryData.duration_seconds || '-'}s</Descriptions.Item>
                      <Descriptions.Item label="Ramp-up">{loadConfig.ramp_up_seconds || 0}s</Descriptions.Item>
                      <Descriptions.Item label="Think Time">{loadConfig.think_time_ms || 0}ms</Descriptions.Item>
                      <Descriptions.Item label="超时">{loadConfig.request_timeout_ms || '-'}ms</Descriptions.Item>
                      <Descriptions.Item label="总次数">{summaryData.iterations || '按时长执行'}</Descriptions.Item>
                      <Descriptions.Item label="错误率">{report.error_rate || 0}%</Descriptions.Item>
                    </Descriptions>
                  </Card>
                  {isChainReport ? (
                    <Card title="链路步骤编排" style={metricCardStyle}>
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        {chainStepRows.map((item, index) => (
                          <Row key={item.key} gutter={12} align="middle" wrap={false}>
                            <Col flex="48px">
                              <div style={{
                                width: 40,
                                height: 40,
                                lineHeight: '40px',
                                textAlign: 'center',
                                borderRadius: 12,
                                background: '#eaf3ff',
                                color: '#1677ff',
                                fontWeight: 700,
                              }}
                              >
                                {item.step_order}
                              </div>
                            </Col>
                            <Col flex="auto">
                              <div style={chainNodeStyle}>
                                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                  <Space wrap>
                                    <Tag color="blue">{item.method || '-'}</Tag>
                                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                                    <Tag color="gold">{`提取变量 ${item.extractors.length}`}</Tag>
                                    <Tag color="purple">{`请求 ${item.count}`}</Tag>
                                    <Tag color={item.error_rate > 0 ? 'error' : 'success'}>{`错误率 ${item.error_rate}%`}</Tag>
                                    <Tag>{`P95 ${item.p95_rt_ms}ms`}</Tag>
                                  </Space>
                                  <span style={{ color: '#64748b' }}>{item.url || '-'}</span>
                                </Space>
                              </div>
                            </Col>
                            {index < chainStepRows.length - 1 ? (
                              <Col flex="24px">
                                <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: 18 }}>↓</div>
                              </Col>
                            ) : null}
                          </Row>
                        ))}
                      </Space>
                    </Card>
                  ) : null}
                  {thresholds?.length ? (
                    <Card title="阈值校验" style={metricCardStyle}>
                      <Table rowKey="name" columns={thresholdColumns} dataSource={thresholds} pagination={false} />
                    </Card>
                  ) : null}
                  {!timeline.length && requestRecords.length ? (
                    <Card title="采样提示" style={metricCardStyle}>
                      <Alert
                        type="warning"
                        showIcon
                        message="当前报告缺少时间片与完整采样数据"
                        description="这份报告可以展示核心结论、错误样本和请求快照，但趋势图、成功样本与时间片明细可能不完整。建议重新执行一次，以生成更完整的性能报告。"
                      />
                    </Card>
                  ) : null}
                  <Card title="优化建议" style={metricCardStyle}>
                    <List
                      size="small"
                      dataSource={suggestions}
                      renderItem={(item, index) => <List.Item>{index + 1}. {item}</List.Item>}
                    />
                  </Card>
                </Space>
              ),
            },
              {
                key: 'trends',
                label: isChainReport ? '趋势与链路' : '趋势分析',
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={isChainReport ? 15 : 14}>
                        <Card title="吞吐趋势" style={softCardStyle}>
                          {throughputSeries.length ? (
                            <Area
                            data={throughputSeries}
                            xField="second"
                            yField="value"
                            seriesField="type"
                            {...areaChartConfig}
                            color={['#1677ff', '#2f9f3d', '#ff7a45']}
                            legend={{ position: 'top' }}
                          />
                        ) : <Empty description="暂无时间片趋势数据" />}
                      </Card>
                      </Col>
                      <Col span={isChainReport ? 9 : 10}>
                        <Card title="响应耗时趋势" style={softCardStyle}>
                          {latencySeries.length ? (
                            <Area
                            data={latencySeries}
                            xField="second"
                            yField="value"
                            seriesField="type"
                            {...areaChartConfig}
                            color={['#7c3aed']}
                            legend={false}
                          />
                        ) : <Empty description="暂无响应耗时数据" />}
                      </Card>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col span={isChainReport ? 10 : 24}>
                        <Card title="错误类型分布" style={softCardStyle}>
                          {errorDistribution.length ? (
                            <Column
                            data={errorDistribution}
                            xField="type"
                            yField="value"
                            autoFit
                            height={320}
                            color={({ type }) => type === '断言失败' ? '#f59e0b' : '#f43f5e'}
                            label={{ position: 'top' }}
                            xAxis={{ label: { autoRotate: false, style: { fill: '#475569' } } }}
                            yAxis={{ grid: { line: { style: { stroke: '#e2e8f0', lineDash: [4, 4] } } } }}
                            tooltip={{
                              domStyles: {
                                'g2-tooltip': {
                                  borderRadius: '14px',
                                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
                                },
                              },
                            }}
                          />
                        ) : <Empty description="暂无错误样本" />}
                      </Card>
                    </Col>
                  </Row>

                  {isChainReport ? (
                    <Card title="链路步骤健康明细" style={metricCardStyle}>
                      <Table
                        rowKey="key"
                        pagination={false}
                        dataSource={chainStepRows}
                        columns={[
                          { title: '步骤', dataIndex: 'step_order', key: 'step_order', width: 70, render: (value) => `#${value}` },
                          { title: '名称', dataIndex: 'name', key: 'name', width: 220 },
                          { title: '方法', dataIndex: 'method', key: 'method', width: 90 },
                          { title: '地址', dataIndex: 'url', key: 'url', ellipsis: true },
                          { title: '提取变量', key: 'extractors', width: 100, render: (_, record) => record.extractors.length },
                          { title: '请求数', dataIndex: 'count', key: 'count', width: 90 },
                          { title: '平均耗时(ms)', dataIndex: 'avg_rt_ms', key: 'avg_rt_ms', width: 120 },
                          { title: 'P95(ms)', dataIndex: 'p95_rt_ms', key: 'p95_rt_ms', width: 100 },
                          { title: '错误率', dataIndex: 'error_rate', key: 'error_rate', width: 100, render: (value) => `${value}%` },
                        ]}
                      />
                    </Card>
                  ) : null}

                  {isChainReport && apiRankings.length ? (
                    <Card title="步骤执行排行明细" style={metricCardStyle}>
                      <Table
                        rowKey="key"
                        pagination={false}
                        dataSource={apiRankings}
                        columns={[
                          { title: '接口', dataIndex: 'name', key: 'name' },
                          { title: '方法', dataIndex: 'method', key: 'method', width: 90 },
                          { title: '地址', dataIndex: 'url', key: 'url', ellipsis: true },
                          { title: '请求数', dataIndex: 'count', key: 'count', width: 90 },
                          { title: '平均耗时(ms)', dataIndex: 'avg_rt_ms', key: 'avg_rt_ms', width: 120 },
                          { title: 'P95(ms)', dataIndex: 'p95_rt_ms', key: 'p95_rt_ms', width: 100 },
                          { title: '错误率', dataIndex: 'error_rate', key: 'error_rate', width: 100, render: (value) => `${value}%` },
                        ]}
                      />
                    </Card>
                  ) : null}

                  <Card title="时间片明细" style={metricCardStyle}>
                    <Table rowKey="label" columns={timelineColumns} dataSource={timeline || []} pagination={false} scroll={{ y: 320 }} />
                  </Card>
                </Space>
              ),
            },
              {
                key: 'errors',
                label: '请求样本',
                children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={6}><Card style={metricCardStyle}><Statistic title="全部样本" value={sampleStats.all} /></Card></Col>
                    <Col span={6}><Card style={metricCardStyle}><Statistic title="成功样本" value={sampleStats.success} /></Card></Col>
                    <Col span={6}><Card style={metricCardStyle}><Statistic title="错误样本" value={sampleStats.error} /></Card></Col>
                    <Col span={6}><Card style={metricCardStyle}><Statistic title="断言失败样本" value={sampleStats.assertion_failed} /></Card></Col>
                  </Row>

                  <Card
                    title="请求样本列表"
                    extra={(
                      <Segmented
                        value={sampleFilter}
                        onChange={setSampleFilter}
                        options={[
                          { label: `全部 (${sampleStats.all})`, value: 'all' },
                          { label: `成功 (${sampleStats.success})`, value: 'success' },
                          { label: `错误 (${sampleStats.error})`, value: 'error' },
                          { label: `断言失败 (${sampleStats.assertion_failed})`, value: 'assertion_failed' },
                        ]}
                      />
                    )}
                    style={metricCardStyle}
                  >
                    {requestRecordMeta.unsampledErrorMessage ? (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message="当前报告未保留完整错误样本"
                        description={requestRecordMeta.unsampledErrorMessage}
                      />
                    ) : null}
                    {requestRecordMeta.truncated ? (
                        <Alert
                          type="info"
                          showIcon
                          style={{ marginBottom: 12 }}
                          message={`当前报告保留了 ${requestRecordMeta.sampled} 条成功样本，成功请求共 ${requestRecordMeta.total} 次。`}
                          description={requestRecordMeta.mergedErrors
                            ? `错误样本已全量返回，当前额外合并了 ${requestRecordMeta.mergedErrors} 条错误样本；错误总数 ${requestRecordMeta.errorTotal} 条。`
                            : `这是成功样本抽样后的展示结果；错误样本总数 ${requestRecordMeta.errorTotal} 条。`}
                        />
                    ) : null}
                    {requestRecordMeta.setupTotal ? (
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 12 }}
                        message={`本次报告额外保留了 ${requestRecordMeta.setupTotal} 条预置接口样本。`}
                        description="预置接口链会在正式压测前执行，样本中会展示每一步请求与响应，便于排查 token、请求头和初始化结果是否正确。"
                      />
                    ) : null}
                    <Table
                      rowKey="key"
                      columns={sampleColumns}
                      dataSource={filteredRequestRecords}
                      pagination={{ pageSize: 8, showSizeChanger: false }}
                      locale={{ emptyText: <Empty description="暂无请求样本" /> }}
                    />
                  </Card>

                  <Card title="断言配置" style={metricCardStyle}>
                    {configuredAssertions.length ? (
                      <List
                        size="small"
                        dataSource={configuredAssertions}
                        renderItem={(item, index) => (
                          <List.Item>
                            <Space wrap>
                              <Tag color="blue">断言 {index + 1}</Tag>
                              <span>{item.type || '-'}</span>
                              {item.expected !== undefined ? <Tag>{`期望: ${item.expected}`}</Tag> : null}
                              {item.path ? <Tag>{`Path: ${item.path}`}</Tag> : null}
                              {item.header ? <Tag>{`Header: ${item.header}`}</Tag> : null}
                              {item.text ? <Tag>{`包含: ${item.text}`}</Tag> : null}
                            </Space>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="当前计划未配置断言" />
                    )}
                  </Card>
                </Space>
              ),
            },
            {
              key: 'snapshots',
              label: '快照与日志',
              children: (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="环境与请求快照" style={metricCardStyle}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="环境">{envName}</Descriptions.Item>
                        {isChainReport ? (
                          <Descriptions.Item label="链路快照">
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(chainPreview)}</pre>
                          </Descriptions.Item>
                        ) : null}
                        {summaryData.setup_snapshot?.enabled ? (
                          <Descriptions.Item label="预置快照">
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(summaryData.setup_snapshot)}</pre>
                          </Descriptions.Item>
                        ) : null}
                        <Descriptions.Item label="参数快照">
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(parameterSnapshot)}</pre>
                        </Descriptions.Item>
                        <Descriptions.Item label="请求快照">
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(requestSnapshot)}</pre>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="执行日志" style={metricCardStyle}>
                      <List
                        size="small"
                        dataSource={payload.logs || []}
                        locale={{ emptyText: '暂无执行日志' }}
                        renderItem={(item) => (
                          <List.Item>
                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                              <Space>
                                <Tag color={item.level === 'ERROR' ? 'error' : item.level === 'WARN' ? 'warning' : 'blue'}>{item.level}</Tag>
                                <span>{item.message}</span>
                              </Space>
                              <span style={{ color: '#64748b', fontSize: 12 }}>{item.created_at}</span>
                              {item.detail ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.detail}</pre> : null}
                            </Space>
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Space>
      </div>

      <Drawer
        title="请求样本详情"
        width={820}
        open={!!activeSample}
        onClose={() => setActiveSample(null)}
      >
        {activeSample ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="分类">{formatSampleScope(activeSample.sample_scope)}</Descriptions.Item>
              <Descriptions.Item label="结果">
                <Tag color={formatSampleStatus(activeSample.status, activeSample.error_type).color}>
                  {formatSampleStatus(activeSample.status, activeSample.error_type).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="错误类型">{activeSample.error_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="请求方式">{activeSample.method || '-'}</Descriptions.Item>
              <Descriptions.Item label="响应状态码">{activeSample.status_code ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="请求地址" span={2}>{activeSample.url || activeRequest.url || '-'}</Descriptions.Item>
              <Descriptions.Item label="响应时间">{activeSample.response_time_ms || 0} ms</Descriptions.Item>
              <Descriptions.Item label="说明">{activeSample.message || '-'}</Descriptions.Item>
              {activeSample.step_count ? <Descriptions.Item label="链路步骤数">{activeSample.step_count}</Descriptions.Item> : null}
              {activeSample.setup_scope ? <Descriptions.Item label="预置范围">{activeSample.setup_scope === 'per_worker' ? '每并发用户一次' : '整次执行一次'}</Descriptions.Item> : null}
            </Descriptions>

            {activeSteps.length ? (
              <Card size="small" title="步骤执行明细" style={performancePanelStyle}>
                <List
                  size="small"
                  dataSource={activeSteps}
                  renderItem={(step, index) => (
                    <List.Item>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color="blue">{`步骤 ${index + 1}`}</Tag>
                          <Tag>{step.request?.method || '-'}</Tag>
                          <span style={{ fontWeight: 600 }}>{step.name || `接口#${step.case_id || index + 1}`}</span>
                          <Tag color={step.status === 'success' ? 'success' : 'error'}>
                            {step.status === 'success' ? '成功' : '失败'}
                          </Tag>
                          <Tag>{`${step.response_time_ms || 0} ms`}</Tag>
                          <Tag>{`HTTP ${step.status_code ?? '-'}`}</Tag>
                        </Space>
                        <span style={{ color: '#64748b' }}>{step.request?.url || '-'}</span>
                        <span>{step.message || '-'}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            ) : null}

            <Tabs
              activeKey={activeDrawerTab}
              onChange={setActiveDrawerTab}
              items={[
                {
                  key: 'request',
                  label: '请求信息',
                  children: (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Card size="small" title="请求 Headers" style={performancePanelStyle}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeRequest.headers || {})}</pre>
                      </Card>
                      <Card size="small" title="请求 Query 参数" style={performancePanelStyle}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeRequest.query || {})}</pre>
                      </Card>
                      <Card size="small" title="请求 Body" style={performancePanelStyle}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeRequest.body || '')}</pre>
                      </Card>
                      <Card size="small" title="变量快照" style={performancePanelStyle}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeSample.request_sample?.variables || {})}</pre>
                      </Card>
                      {activeSteps.length ? (
                        <Card size="small" title="链路 / 预置步骤请求" style={performancePanelStyle}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeSteps)}</pre>
                        </Card>
                      ) : null}
                    </Space>
                  ),
                },
                {
                  key: 'response',
                  label: '响应信息',
                  children: (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Card size="small" title="响应内容" style={performancePanelStyle}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeSample.response_sample || '')}</pre>
                      </Card>
                      {activeSteps.length ? (
                        <Card size="small" title="链路 / 预置步骤响应" style={performancePanelStyle}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{stringifyBlock(activeSteps.map((item) => ({
                            name: item.name,
                            status: item.status,
                            status_code: item.status_code,
                            response_time_ms: item.response_time_ms,
                            response_sample: item.response_sample,
                          })))}</pre>
                        </Card>
                      ) : null}
                    </Space>
                  ),
                },
                {
                  key: 'assertion',
                  label: '断言结果',
                  children: activeSample.assertion_results?.length ? (
                    <Table
                      rowKey={(_, index) => index}
                      pagination={false}
                      dataSource={activeSample.assertion_results}
                      columns={[
                        { title: '断言类型', dataIndex: 'type', key: 'type', width: 120 },
                        { title: '结果', dataIndex: 'passed', key: 'passed', width: 100, render: (value) => value ? <Tag color="success">通过</Tag> : <Tag color="error">失败</Tag> },
                        { title: '路径/字段', key: 'field', render: (_, record) => record.path || record.header || '-' },
                        { title: '实际值', dataIndex: 'actual', key: 'actual', ellipsis: true },
                        { title: '期望值', dataIndex: 'expected', key: 'expected', ellipsis: true },
                        { title: '说明', dataIndex: 'message', key: 'message', ellipsis: true },
                      ]}
                    />
                  ) : (
                    <Empty description="当前样本没有断言结果" />
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default connect(({ gconfig, loading }) => ({
  gconfig,
  loading,
}))(ReportDetail);
