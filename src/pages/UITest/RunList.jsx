import React, { useEffect, useMemo, useState } from 'react';
import {
  Col,
  DatePicker,
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
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  EyeOutlined,
  RedoOutlined,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import { listProject } from '@/services/project';
import { listEnvironment } from '@/services/configure';
import UserLink from '@/components/Button/UserLink';
import { IconFont } from '@/components/Icon/IconFont';
import auth from '@/utils/auth';
import { listUsers } from '@/services/user';
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

const { RangePicker } = DatePicker;

const statusFilters = [
  { label: '全部', value: '' },
  { label: '排队中', value: 'queued' },
  { label: '运行中', value: 'running' },
  { label: '整理中', value: 'uploading' },
  { label: '测试成功', value: 'success' },
  { label: '测试失败', value: 'failed' },
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
  const [executorId, setExecutorId] = useState();
  const [envName, setEnvName] = useState();
  const [environments, setEnvironments] = useState([]);
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [startedRange, setStartedRange] = useState([dayjs().startOf('month'), dayjs().endOf('day')]);
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

  const fetchEnvironments = async () => {
    const res = await listEnvironment({ page: 1, size: 1000, exactly: true });
    if (auth.response(res)) {
      const list = normalizeApiList(res);
      setEnvironments(list);
    }
  };

  const fetchUsers = async () => {
    const res = await listUsers({ page: 1, size: 1000 });
    const list = normalizeApiList(res);
    const nextUserMap = {};
    list.forEach((item) => {
      if (item && item.id !== undefined && item.id !== null) {
        nextUserMap[String(item.id)] = item;
      }
    });
    setUsers(list);
    setUserMap(nextUserMap);
  };

  const fetchRuns = async (
    pid = projectId,
    page = pagination.current,
    size = pagination.pageSize,
    filters = {},
  ) => {
    if (!pid) return;
    const currentExecutorId = Object.prototype.hasOwnProperty.call(filters, 'executorId') ? filters.executorId : executorId;
    const currentEnvName = Object.prototype.hasOwnProperty.call(filters, 'envName') ? filters.envName : envName;
    const currentStatusFilter = Object.prototype.hasOwnProperty.call(filters, 'statusFilter') ? filters.statusFilter : statusFilter;
    const currentKeyword = Object.prototype.hasOwnProperty.call(filters, 'keyword') ? filters.keyword : keyword;
    const currentActiveTab = Object.prototype.hasOwnProperty.call(filters, 'activeTab') ? filters.activeTab : activeTab;
    const currentStartedRange = Object.prototype.hasOwnProperty.call(filters, 'startedRange') ? filters.startedRange : startedRange;
    const [startedAtStart, startedAtEnd] = currentStartedRange || [];
    setLoading(true);
    const res = await listUiTestRuns({
      project_id: pid,
      executor_id: currentExecutorId,
      env_name: currentEnvName,
      scope: 'report',
      status: currentStatusFilter,
      keyword: currentKeyword,
      source: currentActiveTab,
      started_at_start: startedAtStart ? startedAtStart.startOf('day').format('YYYY-MM-DD HH:mm:ss') : '',
      started_at_end: startedAtEnd ? startedAtEnd.endOf('day').format('YYYY-MM-DD HH:mm:ss') : '',
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
    fetchEnvironments();
    fetchUsers();
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
  }, [autoRefresh, projectId, pagination.current, pagination.pageSize, statusFilter, keyword, executorId, envName, startedRange, activeTab]);

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
      title: '报告ID',
      dataIndex: 'id',
      key: 'id',
      width: 136,
      render: (value, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {(Number(record.failed_count || 0) > 0 || Number(record.error_count || 0) > 0)
              ? <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 14 }} />
              : <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 14 }} />}
            <a onClick={() => openDetail(value)} style={{ fontWeight: 600 }}>
              {value}
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
      width: 420,
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
      title: '总数',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 90,
      render: (value) => (
        <Tag style={{ borderRadius: 999, border: 'none', background: '#eff6ff', color: '#1d4ed8' }}>
          {value || 0}
        </Tag>
      ),
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 90,
      render: (value) => <Tag color="success" style={{ borderRadius: 999, border: 'none' }}>{value || 0}</Tag>,
    },
    {
      title: '失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 90,
      render: (value) => <Tag color="error" style={{ borderRadius: 999, border: 'none' }}>{value || 0}</Tag>,
    },
    {
      title: '跳过',
      dataIndex: 'skipped_count',
      key: 'skipped_count',
      width: 90,
      render: (value) => <Tag color="blue" style={{ borderRadius: 999, border: 'none' }}>{value || 0}</Tag>,
    },
    {
      title: '执行人',
      dataIndex: 'create_user',
      key: 'create_user',
      width: 160,
      render: (value, record) => {
        if (Number(value) === 0) {
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, lineHeight: '24px' }}>
              <IconFont style={{ fontSize: 20, marginRight: 6 }} type="icon-a-jiqirenrengongzhineng" /> 机器人
            </span>
          );
        }
        const user = userMap[String(value)];
        if (user) return <UserLink user={user} />;
        if (record.executor_name) return <span style={{ color: '#475569' }}>{record.executor_name}</span>;
        return <span style={{ color: '#cbd5e1' }}>-</span>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (value, record) => value || record.created_at || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value) => uiStatusTag(value === 'success' ? 'ui_test_success' : value === 'failed' ? 'ui_test_failed' : value),
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
          <Col xs={24} md={3}>
            <Select
              value={getUiTestProjectSelectValue(projects, projectId)}
              style={{ width: '100%' }}
              placeholder={projects.length ? '选择项目' : '加载项目...'}
              loading={!projects.length}
              onChange={setProjectId}
              options={projects.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Col>
          <Col xs={24} md={4}>
            <Input
              value={keyword}
              placeholder="搜索报告ID / 名称 / 用例"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => fetchRuns(projectId, 1, pagination.pageSize)}
              allowClear
            />
          </Col>
          <Col xs={24} md={3}>
            <Select
              value={executorId}
              onChange={setExecutorId}
              placeholder="选择执行人"
              allowClear
              style={{ width: '100%' }}
              options={users.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </Col>
          <Col xs={24} md={3}>
            <Select
              value={envName}
              onChange={setEnvName}
              placeholder="选择执行环境"
              allowClear
              style={{ width: '100%' }}
              options={environments.map((item) => ({
                label: item.name,
                value: item.name,
              }))}
            />
          </Col>
          <Col xs={24} md={3}>
            <Select
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
              options={statusFilters}
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={5}>
            <RangePicker
              value={startedRange}
              onChange={(value) => setStartedRange(value || [])}
              allowClear
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Col>
          <Col xs={24} md={3}>
            <Space>
              <PillButton type="primary" onClick={() => fetchRuns(projectId, 1, pagination.pageSize)} loading={loading}>
                查询
              </PillButton>
              <PillButton
                onClick={() => {
                  const nextStartedRange = [dayjs().startOf('month'), dayjs().endOf('day')];
                  setExecutorId(undefined);
                  setEnvName(undefined);
                  setStatusFilter('');
                  setKeyword('');
                  setStartedRange(nextStartedRange);
                  fetchRuns(projectId, 1, pagination.pageSize, {
                    executorId: undefined,
                    envName: undefined,
                    statusFilter: '',
                    keyword: '',
                    startedRange: nextStartedRange,
                  });
                }}
              >
                重置
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
        title="测试报告"
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
