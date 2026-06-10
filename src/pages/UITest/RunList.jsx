import React, { useEffect, useMemo, useState } from 'react';
import {
  Col,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tabs,
  message,
} from 'antd';
import {
  EyeOutlined,
  RedoOutlined,
  RocketFilled,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { listProject } from '@/services/project';
import auth from '@/utils/auth';
import {
  listUiTestRuns,
  retryUiTestRun,
  stopUiTestRun,
} from '@/services/uiTest';
import {
  PillButton,
  SectionCard,
  UiEmpty,
  UiTestPage,
  actionSplit,
  getUiTestProjectSelectValue,
  normalizeApiList,
  normalizeApiPage,
  pickUiTestProjectId,
  uiPalette,
  uiStatusTag,
  useUiTestProject,
} from './shared';

const statusFilters = [
  { label: '全部', value: '' },
  { label: '排队中', value: 'queued' },
  { label: '运行中', value: 'running' },
  { label: '整理中', value: 'uploading' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '已停止', value: 'cancelled' },
];

const activeRunStatuses = ['queued', 'claimed', 'running', 'uploading'];
const runSourceTabs = [
  { key: 'formal', label: '正式运行' },
  { key: 'trial', label: '试运行' },
];

const RunList = () => {
  const [projectId, setProjectId] = useUiTestProject();
  const [projects, setProjects] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('formal');
  const [retryLoading, setRetryLoading] = useState({});
  const [stopLoading, setStopLoading] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchProjects = async () => {
    const res = await listProject({ page: 1, size: 1000 });
    if (auth.response(res)) {
      const list = normalizeApiList(res);
      setProjects(list);
      const nextProjectId = pickUiTestProjectId(list, projectId);
      if (nextProjectId !== undefined && String(nextProjectId) !== String(projectId)) {
        setProjectId(nextProjectId);
      }
    }
  };

  const fetchRuns = async (
    pid = projectId,
    page = pagination.current,
    size = pagination.pageSize,
  ) => {
    if (!pid) return;
    setLoading(true);
    const res = await listUiTestRuns({
      project_id: pid,
      scope: 'report',
      status: statusFilter,
      keyword,
      source: activeTab,
      page,
      size,
      paged: true,
    });
    setLoading(false);
    if (auth.response(res)) {
      const pageData = normalizeApiPage(res, { page, size });
      setRuns(pageData.list);
      setPagination({
        current: pageData.page,
        pageSize: pageData.size,
        total: pageData.total,
      });
    }
  };

  const openDetail = (id) => {
    history.push(`/ui-test/runs/${id}`);
  };

  const handleRetry = async (id) => {
    setRetryLoading((prev) => ({ ...prev, [id]: true }));
    const res = await retryUiTestRun({ id });
    setRetryLoading((prev) => ({ ...prev, [id]: false }));
    if (auth.response(res, true)) {
      fetchRuns(projectId, pagination.current, pagination.pageSize);
    }
  };

  const handleStop = async (id) => {
    setStopLoading((prev) => ({ ...prev, [id]: true }));
    const res = await stopUiTestRun({ id });
    setStopLoading((prev) => ({ ...prev, [id]: false }));
    if (auth.response(res, true)) {
      message.success('已发送停止指令');
      fetchRuns(projectId, pagination.current, pagination.pageSize);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchRuns(projectId, 1, pagination.pageSize);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchRuns(projectId, 1, pagination.pageSize);
    }
  }, [statusFilter, activeTab]);

  useEffect(() => {
    if (!autoRefresh || !projectId) return undefined;
    const timer = window.setInterval(() => {
      fetchRuns(projectId, pagination.current, pagination.pageSize);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, projectId, pagination.current, pagination.pageSize, statusFilter, keyword]);

  const filteredRuns = useMemo(() => runs, [runs]);

  const renderSourceTitle = (record) => {
    const title = [record.file_title, record.node_title].filter(Boolean).join(' / ') || record.node_path || '-';
    if (activeTab === 'trial') {
      return (
        <Space size={6} wrap>
          <span>{`用例：${title}`}</span>
          <Tag style={{ borderRadius: 999, border: 'none', background: '#ede9fe', color: '#7c3aed' }}>
            试运行
          </Tag>
        </Space>
      );
    }
    if (record.plan_id) return `计划：${record.plan_name || `#${record.plan_id}`}`;
    return `计划：${title}`;
  };

  const columns = [
    {
      title: 'Run',
      dataIndex: 'id',
      key: 'id',
      width: 220,
      render: (value, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <RocketFilled style={{ color: uiPalette.primary, fontSize: 14 }} />
            <a onClick={() => openDetail(value)} style={{ fontWeight: 600 }}>
              Run #{value}
            </a>
            {activeTab === 'formal' && record.trigger_mode === 'retry' && (
              <Tag style={{ borderRadius: 999, border: 'none', background: '#fef3c7', color: '#92400e' }}>
                Retry
              </Tag>
            )}
          </div>
          {!!record.run_name && activeTab === 'formal' && !record.plan_id && (
            <div style={{ color: uiPalette.subtle, fontSize: 12, paddingLeft: 22, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.run_name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '来源',
      key: 'source',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#334155', marginBottom: 4 }}>
            {renderSourceTitle(record)}
          </div>
          {activeTab === 'formal' && (
            <div style={{ color: uiPalette.subtle, fontSize: 12 }}>
              {[record.file_title, record.node_title].filter(Boolean).join(' / ') || record.node_path || ''}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '执行环境',
      dataIndex: 'env_name',
      key: 'env_name',
      width: 140,
      render: (value) => (
        value ? (
          <Tag style={{ borderRadius: 999, border: 'none', background: '#eef2ff', color: '#4338ca' }}>
            {value}
          </Tag>
        ) : <span style={{ color: '#cbd5e1' }}>-</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '浏览器',
      key: 'browser',
      width: 190,
      render: (_, record) => (
        <Space wrap size={[4, 4]}>
          <Tag style={{ borderRadius: 999, border: 'none', background: '#f1f5f9', color: '#475569' }}>
            {record.browser || 'chromium'}
          </Tag>
          <Tag style={{ borderRadius: 999, border: 'none', background: record.headless ? '#f1f5f9' : '#fef3c7', color: record.headless ? '#64748b' : '#92400e' }}>
            {record.headless ? '无头' : '有头'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '执行人',
      dataIndex: 'executor_name',
      key: 'executor_name',
      width: 120,
      render: (value) => (
        value ? (
          <span style={{ color: '#475569' }}>{value}</span>
        ) : <span style={{ color: '#cbd5e1' }}>-</span>
      ),
    },
    {
      title: '时间',
      key: 'time',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: 12, color: uiPalette.subtle, lineHeight: 1.8 }}>
          <div>开始: {record.started_at || '-'}</div>
          <div>结束: {record.finished_at || '-'}</div>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space split={actionSplit}>
          <a onClick={() => openDetail(record.id)}>
            <Space size={4}><EyeOutlined /> 详情</Space>
          </a>
          {record.status === 'failed' && (
            <a onClick={() => handleRetry(record.id)} style={{ color: uiPalette.warning }}>
              <Space size={4}>
                {retryLoading[record.id] ? <SyncOutlined spin /> : <RedoOutlined />}
                重试
              </Space>
            </a>
          )}
          {activeRunStatuses.includes(record.status) && (
            <Popconfirm
              title="确认停止该执行？"
              description="停止后 Runner 会在当前步骤或上传检查点结束后退出。"
              onConfirm={() => handleStop(record.id)}
              okText="停止"
              cancelText="取消"
            >
              <a style={{ color: uiPalette.error }}>
                <Space size={4}>
                  {stopLoading[record.id] ? <SyncOutlined spin /> : <StopOutlined />}
                  停止
                </Space>
              </a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <UiTestPage
      showModuleNav={false}
      toolbar={
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={5}>
            <Select
              value={getUiTestProjectSelectValue(projects, projectId)}
              style={{ width: '100%' }}
              placeholder={projects.length ? '选择项目' : '加载项目...'}
              loading={!projects.length}
              onChange={setProjectId}
              options={projects.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Col>
          <Col xs={24} md={3}>
            <Select
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
              options={statusFilters}
              placeholder="选择状态"
              allowClear
              style={{ width: '100%', maxWidth: 180 }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Input
              value={keyword}
              placeholder="搜索 Run ID / 名称 / 用例"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => fetchRuns(projectId, 1, pagination.pageSize)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Space>
              <PillButton type="primary" onClick={() => fetchRuns(projectId, 1, pagination.pageSize)} loading={loading}>
                查询
              </PillButton>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="30s"
                unCheckedChildren="手动"
              />
            </Space>
          </Col>
        </Row>
      }
    >
      <SectionCard
        title="执行记录"
        description="按正式运行与试运行分别查看执行记录"
        extra={
          <div style={{ color: uiPalette.subtle, fontSize: 13 }}>
            共 {pagination.total || filteredRuns.length} 条记录
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 12px' }}
          tabBarStyle={{ marginBottom: 12 }}
          items={runSourceTabs.map((item) => ({
            key: item.key,
            label: item.label,
          }))}
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredRuns}
          size="middle"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={(nextPagination) => fetchRuns(projectId, nextPagination.current, nextPagination.pageSize)}
          locale={{ emptyText: <UiEmpty description="当前项目还没有 UI 执行记录" /> }}
          columns={columns}
        />
      </SectionCard>
    </UiTestPage>
  );
};

export default RunList;
