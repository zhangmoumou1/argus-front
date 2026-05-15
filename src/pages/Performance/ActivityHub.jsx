import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect, useLocation } from '@umijs/max';
import {
  Badge,
  Button,
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
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { listPerformanceReport, queryPerformanceRunLogs } from '@/services/performance';
import auth from '@/utils/auth';
import UserLink from '@/components/Button/UserLink';
import {
  PerformanceDataTableCard,
  PerformanceToolbar,
  performancePalette,
  performancePanelStyle,
} from './ModuleShell';

const { RangePicker } = DatePicker;
const { Option } = Select;

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
    render: (value, record) => (
      <Space direction="vertical" size={0}>
        <a href={`/#/performance/report/${value}`}>Run #{value}</a>
        <span style={{ color: '#6b7280', fontSize: 12 }}>{record.plan_name}</span>
      </Space>
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
      return getSourceTag(summary.source_type);
    },
  },
  {
    title: '负载模型',
    key: 'load_mode',
    render: (_, record) => {
      const summary = parseSummary(record.summary_json);
      if (!summary.load_mode) {
        return <Tag>待生成</Tag>;
      }
      return <Tag color="purple">{summary.load_mode === 'qps' ? 'QPS 模式' : '并发模式'}</Tag>;
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
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (value) => statusMap[value] || <Tag>{value}</Tag>,
  },
  {
    title: '操作',
    key: 'operation',
    render: (_, record) => (
      <Space split={<span style={{ color: '#d1d5db' }}>|</span>}>
        <a href={`/#/performance/report/${record.id}`}>查看详情</a>
        <a onClick={() => onOpenLogs(record.id)}>执行日志</a>
      </Space>
    ),
  },
];

const reportColumnsFactory = ({ userMap }) => [
  {
    title: '报告ID',
    dataIndex: 'id',
    key: 'id',
    render: (value) => <a href={`/#/performance/report/${value}`}>#{value}</a>,
  },
  {
    title: '计划 / 来源',
    key: 'plan',
    render: (_, record) => {
      const summary = parseSummary(record.summary_json);
      return (
        <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 600 }}>{record.plan_name}</span>
            <Space size={6}>
              {getSourceTag(summary.source_type)}
              <Tag color="purple">{summary.load_mode === 'qps' ? 'QPS 模式' : (summary.load_mode ? '并发模式' : '待生成')}</Tag>
            </Space>
          </Space>
        );
    },
  },
  {
    title: '执行人',
    dataIndex: 'executor',
    key: 'executor',
    render: (value) => <UserLink user={userMap[value]} />,
  },
  {
    title: '核心指标',
    key: 'metrics',
    render: (_, record) => (
      <Space wrap>
        <Tag color="blue">总请求 {record.total_requests || 0}</Tag>
        <Tag>Avg {record.avg_rt_ms || 0}ms</Tag>
        <Tag color="purple">P95 {record.p95_rt_ms || 0}ms</Tag>
        <Tag color="error">错误率 {record.error_rate || 0}%</Tag>
      </Space>
    ),
  },
  {
    title: '报告结果',
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
      return passed ? <Tag color="success">通过</Tag> : <Tag color="error">未通过</Tag>;
    },
  },
  {
    title: '完成时间',
    dataIndex: 'finished_at',
    key: 'finished_at',
    render: (value, record) => value || record.created_at,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (value) => statusMap[value] || <Tag>{value}</Tag>,
  },
  {
    title: '操作',
    key: 'operation',
    render: (_, record) => <a href={`/#/performance/report/${record.id}`}>查看报告</a>,
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

  useEffect(() => {
    dispatch({ type: 'user/fetchUserList' });
    form.setFieldsValue({ date: [moment().startOf('week'), moment().endOf('week')] });
    fetchList(1, resolvedDefaultTab);
  }, [resolvedDefaultTab, planId]);

  const columns = useMemo(
    () => (isReportView
      ? reportColumnsFactory({ userMap })
      : runColumnsFactory({ userMap, onOpenLogs: openLogs })),
    [isReportView, userMap],
  );

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div style={{ padding: '8px 0 24px', background: performancePalette.page, minHeight: 'calc(100vh - 120px)' }}>
        <PerformanceToolbar
          extra={(
            <Space size={10}>
              <Button type="primary" onClick={() => fetchList(1)} style={{ borderRadius: 999 }}>
                <SearchOutlined /> 查询
              </Button>
              <Button
                style={{ borderRadius: 999 }}
                onClick={() => {
                  form.resetFields();
                  form.setFieldsValue({ date: [moment().startOf('week'), moment().endOf('week')] });
                  fetchList(1);
                }}
              >
                <ReloadOutlined /> 重置
              </Button>
            </Space>
          )}
        >
          <Form form={form}>
            <Row gutter={[14, 12]}>
              <Col span={6}>
                <Form.Item label="执行人" name="executor" style={{ marginBottom: 0 }}>
                  <Select placeholder="选择执行人" allowClear>
                    {Object.keys(userMap).map((v) => (
                      <Option key={v} value={Number(v)}>
                        <UserLink user={userMap[v]} />
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {!isReportView ? (
                <Col span={5}>
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
              <Col span={!isReportView ? 13 : 18}>
                <Form.Item
                  label="执行时间"
                  name="date"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: '请选择开始/结束时间' }]}
                  initialValue={[moment().startOf('week'), moment().endOf('week')]}
                >
                  <RangePicker
                    style={{ width: '100%' }}
                    ranges={{
                      今天: [moment(), moment()],
                      本周: [moment().startOf('week'), moment().endOf('week')],
                      本月: [moment().startOf('month'), moment().endOf('month')],
                    }}
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </PerformanceToolbar>

        <PerformanceDataTableCard
          title={isReportView ? '性能报告列表' : '执行记录列表'}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            pagination={pagination}
            onChange={(pg) => fetchList(pg.current, resolvedDefaultTab)}
          />
        </PerformanceDataTableCard>
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
