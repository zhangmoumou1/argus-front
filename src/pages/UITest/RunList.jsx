import React, { useEffect, useMemo, useState } from 'react';
import {
  Col,
  Input,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import {
  ClockCircleFilled,
  EyeOutlined,
  PlayCircleOutlined,
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
  RefreshButton,
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
  { label: '产物中', value: 'uploading' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '已停止', value: 'cancelled' },
];

const activeRunStatuses = ['queued', 'claimed', 'running', 'uploading'];

const RunList = () => {
  const [projectId, setProjectId] = useUiTestProject();
  const [projects, setProjects] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
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
    if (projectId) fetchRuns(projectId, 1, pagination.pageSize);
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchRuns(projectId, 1, pagination.pageSize);
  }, [statusFilter]);

  useEffect(() => {
    if (!autoRefresh || !projectId) return undefined;
    const timer = window.setInterval(() => fetchRuns(projectId, pagination.current, pagination.pageSize), 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, projectId, pagination.current, pagination.pageSize, statusFilter, keyword]);

  const filteredRuns = useMemo(() => {
    return runs;
  }, [runs]);

  const columns = [
    {
      title: 'Run',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (value, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <RocketFilled style={{ color: uiPalette.primary, fontSize: 14 }} />
            <a onClick={() => openDetail(value)} style={{ fontWeight: 600 }}>
              Run #{value}
            </a>
          </div>
          {record.run_name && (
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
          <Space wrap size={[6, 4]} style={{ marginBottom: 4 }}>
            {record.plan_id && (
              <Tag style={{ borderRadius: 999, border: 'none', background: '#ede9fe', color: '#7c3aed' }}>
                计划 #{record.plan_id}
              </Tag>
            )}
            {record.case_ref_id && (
              <Tag style={{ borderRadius: 999, border: 'none', background: '#dbeafe', color: '#1d4ed8' }}>
                用例 #{record.case_ref_id}
              </Tag>
            )}
            {record.trigger_mode && (
              <Tag
                icon={record.trigger_mode === 'manual' ? <PlayCircleOutlined /> : <ClockCircleFilled />}
                style={{ borderRadius: 999, border: 'none', background: '#f1f5f9', color: '#475569' }}
              >
                {record.trigger_mode}
              </Tag>
            )}
          </Space>
          <div style={{ color: uiPalette.subtle, fontSize: 12 }}>
            {[record.file_title, record.node_title].filter(Boolean).join(' / ') || record.node_path || '-'}
          </div>
        </div>
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
      title: '环境',
      key: 'browser',
      width: 140,
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
      toolbar={
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Select
              value={getUiTestProjectSelectValue(projects, projectId)}
              style={{ width: '100%' }}
              placeholder={projects.length ? '选择项目' : '加载项目...'}
              loading={!projects.length}
              onChange={setProjectId}
              options={projects.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusFilters}
              block
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
          <Col xs={24} md={4}>
            <Space>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren="30s"
                unCheckedChildren="手动"
              />
              <RefreshButton onClick={() => fetchRuns(projectId, pagination.current, pagination.pageSize)} loading={loading} />
            </Space>
          </Col>
        </Row>
      }
    >
      <SectionCard
        title="执行记录"
        description="Run 状态、来源、环境和执行窗口"
        extra={
          <div style={{ color: uiPalette.subtle, fontSize: 13 }}>
            共 {pagination.total || filteredRuns.length} 条记录
          </div>
        }
      >
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
