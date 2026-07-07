import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect, useLocation } from '@umijs/max';
import {
  Badge,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  listPerformanceReport,
  queryPerformanceMonitorConfig,
  queryPerformanceRunLogs,
} from '@/services/performance';
import auth from '@/utils/auth';
import UserLink from '@/components/Button/UserLink';
import { IconFont } from '@/components/Icon/IconFont';
import {
  performancePanelStyle,
} from './ModuleShell';
import { PillButton, SectionCard, UiEmpty, actionSplit, uiPalette, uiStatusTag } from '@/pages/UITest/shared';

const { RangePicker } = DatePicker;
const { Option } = Select;
const defaultReportDateRange = [dayjs().startOf('week'), dayjs().endOf('week')];
const defaultRangeTime = [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')];

const statusMap = {
  0: <Badge status="default" text="准备中" />,
  1: <Badge status="processing" text="运行中" />,
  2: <Badge status="warning" text="已停止" />,
  3: <Badge status="success" text="已完成" />,
};

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

const getSourceTag = (sourceType) => {
  if (!sourceType) {
    return <Tag>待生成</Tag>;
  }
  if (sourceType === 'api_scenario' || sourceType === 'link') {
    return <Tag color="geekblue">接口场景</Tag>;
  }
  if (sourceType === 'manual') {
    return <Tag color="gold">手动接口</Tag>;
  }
  return <Tag color="blue">接口资产</Tag>;
};

const runColumnsFactory = ({ userMap, onOpenLogs }) => [
  {
    title: '执行记录',
    dataIndex: 'id',
    key: 'id',
    width: 220,
    render: (value, record) => (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <a href={`/#/performance/report/${value}`} style={{ fontWeight: 600 }}>Run #{value}</a>
        </div>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{record.plan_name}</div>
      </div>
    ),
  },
  {
    title: '执行人',
    dataIndex: 'executor',
    key: 'executor',
    render: (value) => <UserLink user={userMap[value]} />,
  },
  {
    title: '来源',
    key: 'source',
    render: (_, record) => {
      const summary = parseSummary(record.summary_json);
      return (
        <Space wrap size={[6, 4]}>
          {getSourceTag(summary.source_type)}
          {summary.load_mode ? <Tag color="purple">{summary.load_mode === 'qps' ? 'QPS 模式' : '并发模式'}</Tag> : null}
        </Space>
      );
    },
  },
  {
    title: '核心指标',
    key: 'metrics',
    render: (_, record) => (
      <Space wrap>
        <Tag color="blue">总请求 {record.total_requests || 0}</Tag>
        <Tag color="success">成功 {record.success_count || 0}</Tag>
        <Tag color="error">失败 {record.failed_count || 0}</Tag>
        <Tag color="purple">P95 {record.p95_rt_ms || 0}ms</Tag>
        <Tag color="gold">错误率 {record.error_rate || 0}%</Tag>
      </Space>
    ),
  },
  {
    title: '开始时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (value) => value === 0 ? uiStatusTag('queued') : value === 1 ? uiStatusTag('running') : value === 2 ? uiStatusTag('cancelled') : value === 3 ? uiStatusTag('success') : (statusMap[value] || <Tag>{value}</Tag>),
  },
  {
    title: '操作',
    key: 'operation',
      render: (_, record) => (
      <Space split={actionSplit}>
        <a href={`/#/performance/report/${record.id}`}>查看详情</a>
        <a onClick={() => onOpenLogs(record.id)}>执行日志</a>
      </Space>
    ),
  },
];

const reportColumnsFactory = ({ userMap, monitorUrl }) => [
  {
    title: '报告ID',
    dataIndex: 'id',
    key: 'id',
    width: 136,
    render: (value, record) => {
      const success = Number(record.failed_count || 0) <= 0 && Number(record.error_rate || 0) <= 0;
      return (
        <Space size={8}>
          {success ? <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 14 }} /> : <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 14 }} />}
          <a href={`/#/performance/report/${value}`} style={{ fontWeight: 600 }}>{value}</a>
        </Space>
      );
    },
  },
  {
    title: '来源',
    key: 'plan',
    width: 420,
    render: (_, record) => {
      const summary = parseSummary(record.summary_json);
      return (
        <Space>
          <span style={{ fontWeight: 600 }}>{record.plan_name}</span>
          {getSourceTag(summary.source_type)}
          {summary.load_mode ? <Tag color="purple">{summary.load_mode === 'qps' ? 'QPS 模式' : '并发模式'}</Tag> : null}
        </Space>
      );
    },
  },
  {
    title: '执行人',
    dataIndex: 'executor',
    key: 'executor',
    width: 160,
    render: (value) => value === 0 ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, lineHeight: '24px' }}>
        <IconFont style={{ fontSize: 20, marginRight: 6 }} type="icon-a-jiqirenrengongzhineng" /> 机器人
      </span>
    ) : <UserLink user={userMap[value]} />,
  },
  {
    title: '核心指标',
    key: 'metrics',
    render: (_, record) => (
      <Space>
        <Tag color="blue">总请求 {record.total_requests || 0}</Tag>
        <Tag>Avg {record.avg_rt_ms || 0}ms</Tag>
        <Tag color="purple">P95 {record.p95_rt_ms || 0}ms</Tag>
        <Tag color="error">错误率 {record.error_rate || 0}%</Tag>
      </Space>
    ),
  },
  {
    title: '测试结果',
    key: 'threshold',
    render: (_, record) => {
      const summary = parseSummary(record.summary_json);
      const rules = summary.threshold_config || [];
      if (!rules.length) return <Tag>未配置阈值</Tag>;
      const errorRate = Number(record.error_rate || 0);
      const successRate = 100 - errorRate;
      const actualMap = {
        avg_rt_ms: Number(record.avg_rt_ms || 0),
        p90_rt_ms: Number(record.p90_rt_ms || 0),
        p95_rt_ms: Number(record.p95_rt_ms || 0),
        p99_rt_ms: Number(record.p99_rt_ms || 0),
        max_rt_ms: Number(record.max_rt_ms || 0),
        avg_rps: Number(record.avg_rps || 0),
        error_rate: errorRate,
        success_rate: successRate,
      };
      const passed = rules.every((item) => {
        const actual = actualMap[item.metric];
        const expected = Number(item.value || 0);
        if (item.operator === '<') return actual < expected;
        if (item.operator === '<=') return actual <= expected;
        if (item.operator === '>') return actual > expected;
        if (item.operator === '>=') return actual >= expected;
        return false;
      });
      return passed ? <Tag color="success" style={{ borderRadius: 999, border: 'none' }}>测试成功</Tag> : <Tag color="error" style={{ borderRadius: 999, border: 'none' }}>测试失败</Tag>;
    },
  },
  {
    title: '完成时间',
    dataIndex: 'finished_at',
    key: 'finished_at',
    width: 180,
    render: (value, record) => value || record.created_at,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (value) => value === 0 ? uiStatusTag('queued') : value === 1 ? uiStatusTag('running') : value === 2 ? uiStatusTag('cancelled') : value === 3 ? uiStatusTag('ui_test_success') : (statusMap[value] || <Tag>{value}</Tag>),
  },
  {
    title: '操作',
    key: 'operation',
    width: 180,
    render: (_, record) => (
      <Space split={actionSplit}>
        <a href={`/#/performance/report/${record.id}`}>查看报告</a>
        {monitorUrl ? (
          <a onClick={() => window.open(monitorUrl, '_blank', 'noopener,noreferrer')}>监控</a>
        ) : null}
      </Space>
    ),
  },
];

const ActivityHub = ({ dispatch, user, defaultTab }) => {
  const location = useLocation();
  const resolvedDefaultTab = defaultTab || (location.pathname.includes('/performance/report') ? 'reports' : 'runs');
  const isReportView = resolvedDefaultTab === 'reports';
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [logRows, setLogRows] = useState([]);
  const [activeRunId, setActiveRunId] = useState(null);
  const [monitorUrl, setMonitorUrl] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total) => `共${total}条记录`,
  });

  const { userMap } = user;
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('plan_id');

  const fetchList = async (page = 1, tab = resolvedDefaultTab) => {
    const value = await form.validateFields();
    const [startDate, endDate] = value.date || [];
    setLoading(true);
    const res = await listPerformanceReport({
      ...value,
      status: tab === 'reports' ? 3 : value.status,
      plan_id: planId && tab === 'reports' ? Number(planId) : undefined,
      start_time: startDate.format('YYYY-MM-DD HH:mm:ss'),
      end_time: endDate.format('YYYY-MM-DD HH:mm:ss'),
      page,
      size: pagination.pageSize,
      date: null,
    });
    setLoading(false);
    if (auth.response(res)) {
      setDataSource(res.data || []);
      setPagination((prev) => ({ ...prev, current: page, total: res.total || 0 }));
    }
  };

  const openLogs = async (runId) => {
    setActiveRunId(runId);
    const res = await queryPerformanceRunLogs({ run_id: runId });
    if (auth.response(res)) {
      setLogRows(res.data || []);
      setLogVisible(true);
    }
  };

  const fetchMonitorConfig = async () => {
    const res = await queryPerformanceMonitorConfig();
    if (auth.response(res)) {
      setMonitorUrl(res.data?.grafana_url || '');
    }
  };

  useEffect(() => {
    dispatch({ type: 'user/fetchUserList' });
    form.setFieldsValue({ date: defaultReportDateRange });
    fetchList(1, resolvedDefaultTab);
    fetchMonitorConfig();
  }, [resolvedDefaultTab, planId]);

  const columns = useMemo(
    () => (isReportView
      ? reportColumnsFactory({ userMap, monitorUrl })
      : runColumnsFactory({ userMap, onOpenLogs: openLogs })),
    [isReportView, userMap, monitorUrl],
  );

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div style={{ padding: '8px 0 24px', background: uiPalette.page, minHeight: 'calc(100vh - 120px)' }}>
        <SectionCard>
          <div style={{ paddingTop: 12 }}>
            <Form form={form}>
              <Row gutter={[12, 12]} align="bottom">
                <Col xs={24} sm={12} lg={4}>
                  <Form.Item label="执行人" name="executor" style={{ marginBottom: 0 }}>
                    <Select placeholder="选择执行人" allowClear>
                      <Option value={0}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, lineHeight: '24px' }}>
                          <IconFont style={{ fontSize: 20, marginRight: 6 }} type="icon-a-jiqirenrengongzhineng" /> 机器人
                        </span>
                      </Option>
                      {Object.keys(userMap).map((v) => (
                        <Option key={v} value={Number(v)}>
                          <UserLink user={userMap[v]} />
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                {!isReportView ? (
                  <Col xs={24} sm={12} lg={4}>
                    <Form.Item label="状态" name="status" style={{ marginBottom: 0 }}>
                      <Select placeholder="选择状态" allowClear>
                        <Option value={0}>准备中</Option>
                        <Option value={1}>运行中</Option>
                        <Option value={2}>已停止</Option>
                        <Option value={3}>已完成</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                ) : null}
                <Col xs={24} lg={6}>
                  <Form.Item
                    label="执行时间"
                    name="date"
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: '请选择开始/结束时间' }]}
                    initialValue={defaultReportDateRange}
                  >
                    <RangePicker
                      style={{ width: '100%', maxWidth: 420 }}
                      ranges={{
                        今天: [dayjs().startOf('day'), dayjs().endOf('day')],
                        本周: [dayjs().startOf('week'), dayjs().endOf('week')],
                        本月: [dayjs().startOf('month'), dayjs().endOf('month')],
                      }}
                      showTime={{ format: 'HH:mm:ss', defaultValue: defaultRangeTime }}
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder={['开始时间', '结束时间']}
                      inputReadOnly
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Space>
                    <PillButton type="primary" onClick={() => fetchList(1)}>
                      <SearchOutlined /> 查询
                    </PillButton>
                    <PillButton
                      onClick={() => {
                        form.resetFields();
                        form.setFieldsValue({ date: defaultReportDateRange });
                        fetchList(1);
                      }}
                    >
                      <ReloadOutlined /> 重置
                    </PillButton>
                  </Space>
                </Col>
              </Row>
            </Form>
          </div>
        </SectionCard>

        <SectionCard
          title={isReportView ? '测试报告' : undefined}
          extra={isReportView ? <span style={{ color: uiPalette.subtle, fontSize: 13 }}>共 {pagination.total || dataSource.length} 条记录</span> : undefined}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={pagination}
            locale={{ emptyText: <UiEmpty description={isReportView ? '当前还没有性能测试报告记录' : '当前还没有性能测试执行记录'} /> }}
            onChange={(pg) => fetchList(pg.current, resolvedDefaultTab)}
          />
        </SectionCard>
      </div>

      <Drawer
        title={activeRunId ? `执行日志 #${activeRunId}` : '执行日志'}
        open={logVisible}
        width={640}
        onClose={() => setLogVisible(false)}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {logRows.map((item) => (
            <Card key={item.id} size="small" style={performancePanelStyle}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space>
                  <Tag color={item.level === 'ERROR' ? 'error' : item.level === 'WARN' ? 'warning' : 'blue'}>{item.level}</Tag>
                  <span>{item.message}</span>
                </Space>
                <span style={{ color: '#64748b', fontSize: 12 }}>{item.created_at}</span>
                {item.detail ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.detail}</pre> : null}
              </Space>
            </Card>
          ))}
        </Space>
      </Drawer>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(ActivityHub);
