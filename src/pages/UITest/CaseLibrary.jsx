import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Col,
  Drawer,
  Input,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  BugOutlined,
  CodeOutlined,
  CloudDownloadOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  ScanOutlined,
  SearchOutlined,
  StopOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { listProject } from '@/services/project';
import auth from '@/utils/auth';
import {
  getUiTestRunDetail,
  listUiTestCases,
  listUiTestCaseNodes,
  listUiTestRuns,
  previewUiTestDsl,
  scanUiTestCases,
  stopUiTestRun,
  trialRunUiTestCase,
  validateUiTestCase,
} from '@/services/uiTest';
import {
  DslCodeBlock,
  InsetCard,
  Kv,
  MetricStrip,
  PillButton,
  RefreshButton,
  SectionCard,
  TipButton,
  UiEmpty,
  UiTestPage,
  actionSplit,
  formatDuration,
  getUiTestProjectSelectValue,
  normalizeApiList,
  normalizeApiPage,
  percent,
  pickUiTestProjectId,
  stepTypeTag,
  uiPalette,
  uiStatusTag,
  useUiTestProject,
} from './shared';

const CaseLibrary = () => {
  const activeRunStatuses = ['queued', 'claimed', 'running', 'uploading'];
  const [projectId, setProjectId] = useUiTestProject();
  const [projects, setProjects] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [data, setData] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [dslPreview, setDslPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('nodes');
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeKeyword, setNodeKeyword] = useState('');
  const [nodeStatusFilter, setNodeStatusFilter] = useState('');
  const [validateLoading, setValidateLoading] = useState({});
  const [trialLoading, setTrialLoading] = useState({});
  const [casePagination, setCasePagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [activeDebugCase, setActiveDebugCase] = useState(null);
  const [debugRuns, setDebugRuns] = useState([]);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugDetail, setDebugDetail] = useState(null);
  const [debugDetailLoading, setDebugDetailLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState({});

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

  const fetchCases = async (
    currentProjectId = projectId,
    page = casePagination.current,
    size = casePagination.pageSize,
  ) => {
    if (!currentProjectId) return;
    setLoading(true);
    const res = await listUiTestCases({
      project_id: currentProjectId,
      keyword,
      status: statusFilter,
      page,
      size,
      paged: true,
    });
    setLoading(false);
    if (auth.response(res)) {
      const pageData = normalizeApiPage(res, { page, size });
      setData(pageData.list);
      setCasePagination({
        current: pageData.page,
        pageSize: pageData.size,
        total: pageData.total,
      });
    }
  };

  const handleScan = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    setScanLoading(true);
    const res = await scanUiTestCases({ project_id: projectId });
    setScanLoading(false);
    if (auth.response(res, true)) {
      fetchCases(projectId, 1, casePagination.pageSize);
    }
  };

  const openFileNodes = async (record) => {
    const res = await listUiTestCaseNodes({ file_id: record.file_id, include_dsl: false });
    if (auth.response(res)) {
      setActiveFile(record);
      setNodes(normalizeApiList(res));
      setDrawerOpen(true);
      setDslPreview(null);
      setActiveTab('nodes');
      setSelectedNode(null);
      setNodeKeyword('');
      setNodeStatusFilter('');
    }
  };

  const handleValidate = async (id) => {
    setValidateLoading((prev) => ({ ...prev, [id]: true }));
    const res = await validateUiTestCase({ id });
    setValidateLoading((prev) => ({ ...prev, [id]: false }));
    if (auth.response(res, true) && activeFile) {
      openFileNodes(activeFile);
      fetchCases(projectId);
    }
  };

  const handlePreviewDsl = async (id, node) => {
    const res = await previewUiTestDsl({ id });
    if (auth.response(res)) {
      setDslPreview(res.data || res);
      setActiveTab('dsl');
      setSelectedNode(node);
    }
  };

  const fetchDebugDetail = async (runId) => {
    if (!runId) return;
    setDebugDetailLoading(true);
    const res = await getUiTestRunDetail({
      id: runId,
      include_payload: true,
      include_artifacts: true,
      include_step_payload: false,
      include_step_artifacts: true,
    });
    setDebugDetailLoading(false);
    if (auth.response(res)) {
      setDebugDetail(res.data || res);
    }
  };

  const fetchDebugRuns = async (caseRefId = activeDebugCase?.id, focusRunId) => {
    if (!projectId || !caseRefId) return;
    setDebugLoading(true);
    const res = await listUiTestRuns({
      project_id: projectId,
      case_ref_id: caseRefId,
      scope: 'debug',
      page: 1,
      size: 20,
      paged: true,
    });
    setDebugLoading(false);
    if (auth.response(res)) {
      const list = normalizeApiList(res);
      setDebugRuns(list);
      const targetRunId = focusRunId || debugDetail?.id || list[0]?.id;
      if (targetRunId) {
        fetchDebugDetail(targetRunId);
      } else {
        setDebugDetail(null);
      }
    }
  };

  const openDebugConsole = (node) => {
    setActiveDebugCase(node);
    setSelectedNode(node);
    setActiveTab('debug');
    fetchDebugRuns(node?.id);
  };

  const handleTrialRun = async (id, node) => {
    if (node) {
      setActiveDebugCase(node);
      setSelectedNode(node);
      setActiveTab('debug');
    }
    setTrialLoading((prev) => ({ ...prev, [id]: true }));
    const res = await trialRunUiTestCase({ id });
    setTrialLoading((prev) => ({ ...prev, [id]: false }));
    if (auth.response(res, true)) {
      const runId = res.data?.run_id || res.run_id;
      message.success(`已创建调试任务 #${runId}`);
      fetchDebugRuns(id, runId);
    }
  };

  const handleStopRun = async (runId) => {
    if (!runId) return;
    setStopLoading((prev) => ({ ...prev, [runId]: true }));
    const res = await stopUiTestRun({ id: runId });
    setStopLoading((prev) => ({ ...prev, [runId]: false }));
    if (auth.response(res, true)) {
      message.success('已发送停止指令');
      fetchDebugRuns(activeDebugCase?.id, runId);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) fetchCases(projectId, 1, casePagination.pageSize);
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchCases(projectId, 1, casePagination.pageSize);
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab !== 'debug' || !activeDebugCase?.id) return undefined;
    const hasRunningDebug = debugRuns.some((item) => ['queued', 'claimed', 'running', 'uploading'].includes(item.status));
    if (!hasRunningDebug) return undefined;
    const timer = window.setInterval(() => {
      fetchDebugRuns(activeDebugCase.id, debugDetail?.id);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeTab, activeDebugCase?.id, debugRuns, debugDetail?.id]);

  const filteredData = useMemo(() => {
    return data;
  }, [data]);

  const debugArtifacts = useMemo(
    () =>
      Array.isArray(debugDetail?.artifacts)
        ? debugDetail.artifacts.filter((item) => item?.label !== '结果JSON' && item?.name !== 'result.json')
        : [],
    [debugDetail],
  );

  const debugArtifactWarnings = useMemo(
    () => (
      Array.isArray(debugDetail?.result_payload?.artifact_warnings)
        ? debugDetail.result_payload.artifact_warnings
        : []
    ),
    [debugDetail],
  );

  const filteredNodes = useMemo(() => {
    const kw = nodeKeyword.trim().toLowerCase();
    return nodes.filter((item) => {
      const matchedStatus = nodeStatusFilter ? item.status === nodeStatusFilter : true;
      if (!matchedStatus) return false;
      if (!kw) return true;
      return [item.node_path, item.node_title, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(kw));
    });
  }, [nodes, nodeKeyword, nodeStatusFilter]);

  const nodeMetrics = useMemo(() => {
    const valid = nodes.filter((item) => item.status === 'valid').length;
    const invalid = nodes.filter((item) => item.status === 'invalid_ui_node').length;
    const empty = nodes.filter((item) => item.status === 'empty_ui_node').length;
    return [
      { label: '节点', value: nodes.length, hint: `${filteredNodes.length} 个当前可见`, accent: uiPalette.primary },
      { label: '可执行', value: valid, hint: `${percent(valid, nodes.length)}%`, accent: uiPalette.success },
      { label: '校验失败', value: invalid, hint: '需补充动作或断言', accent: uiPalette.error },
      { label: '空节点', value: empty, hint: '需补充步骤', accent: uiPalette.warning },
    ];
  }, [nodes, filteredNodes.length]);

  const columns = [
    {
      title: '功能用例文件',
      dataIndex: 'file_title',
      key: 'file_title',
      render: (value, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FileTextOutlined style={{ color: uiPalette.primary, fontSize: 16 }} />
            <a onClick={() => openFileNodes(record)} style={{ fontWeight: 600 }}>
              {value}
            </a>
          </div>
          <div style={{ color: uiPalette.subtle, fontSize: 12, paddingLeft: 24 }}>
            file_id: {record.file_id}
          </div>
        </div>
      ),
    },
    {
      title: '扫描结果',
      key: 'counts',
      width: 280,
      render: (_, record) => {
        const total = record.ui_case_count || 0;
        const valid = record.valid_ui_case_count || 0;
        const invalid = record.invalid_ui_case_count || 0;
        const empty = record.empty_ui_case_count || 0;
        const validRate = total > 0 ? Math.round((valid / total) * 100) : 0;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Progress
                percent={validRate}
                size="small"
                style={{ flex: 1, margin: 0 }}
                strokeColor={validRate === 100 ? uiPalette.success : uiPalette.primary}
              />
              <span style={{ color: uiPalette.subtle, fontSize: 12, whiteSpace: 'nowrap' }}>{validRate}%</span>
            </div>
            <Space wrap size={[6, 4]}>
              <Tag color="blue" style={{ borderRadius: 999, border: 'none' }}>总计 {total}</Tag>
              <Tag color="success" style={{ borderRadius: 999, border: 'none' }}>可执行 {valid}</Tag>
              {invalid > 0 && <Tag color="error" style={{ borderRadius: 999, border: 'none' }}>失败 {invalid}</Tag>}
              {empty > 0 && <Tag color="warning" style={{ borderRadius: 999, border: 'none' }}>空节点 {empty}</Tag>}
            </Space>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '最近扫描',
      dataIndex: 'last_scanned_at',
      key: 'last_scanned_at',
      width: 180,
      render: (value) => value ? (
        <span style={{ color: uiPalette.subtle, fontSize: 13 }}>{value}</span>
      ) : (
        <span style={{ color: '#cbd5e1' }}>-</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space split={actionSplit}>
          <a onClick={() => openFileNodes(record)}>查看节点</a>
          <a onClick={() => handleScan()} style={{ color: uiPalette.primary }}>扫描</a>
        </Space>
      ),
    },
  ];

  const nodeColumns = [
    {
      title: '节点信息',
      dataIndex: 'node_path',
      key: 'node_path',
      render: (value, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: uiPalette.text }}>
            {value || record.node_title}
          </div>
          <Space wrap size={[6, 4]}>
            {uiStatusTag(record.status)}
            <Tag
              icon={<ThunderboltOutlined />}
              style={{ borderRadius: 999, border: 'none', background: '#f1f5f9' }}
            >
              {record.step_count || 0} 步骤
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Space>
          <TipButton
            tip="校验节点"
            icon={<BugOutlined />}
            onClick={() => handleValidate(record.id)}
            loading={validateLoading[record.id]}
          />
          <TipButton
            tip="预览 DSL"
            icon={<CodeOutlined />}
            onClick={() => handlePreviewDsl(record.id, record)}
          />
          <TipButton
            tip="试运行"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTrialRun(record.id, record)}
            loading={trialLoading[record.id]}
          />
          <TipButton
            tip="调试台"
            icon={<HistoryOutlined />}
            onClick={() => openDebugConsole(record)}
          />
        </Space>
      ),
    },
  ];

  const debugRunColumns = [
    {
      title: '调试任务',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (value, record) => (
        <a onClick={() => fetchDebugDetail(value)} style={{ fontWeight: debugDetail?.id === value ? 700 : 500 }}>
          #{value}
          {record.status === 'running' && <span style={{ color: uiPalette.info, marginLeft: 4 }}>运行中</span>}
          {record.status === 'uploading' && <span style={{ color: uiPalette.warning, marginLeft: 4 }}>产物中</span>}
        </a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '环境',
      key: 'env',
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>{record.browser || 'chromium'}</Tag>
          <Tag style={{ borderRadius: 6, border: 'none', background: record.headless ? '#f1f5f9' : '#fef3c7' }}>
            {record.headless ? '无头' : '有头'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value) => <span style={{ color: uiPalette.subtle }}>{value || '-'}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_, record) =>
        activeRunStatuses.includes(record.status) ? (
          <Popconfirm
            title="确认停止该调试任务？"
            onConfirm={() => handleStopRun(record.id)}
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
        ) : (
          <span style={{ color: uiPalette.subtle }}>-</span>
        ),
    },
  ];

  const debugStepColumns = [
    {
      title: '#',
      dataIndex: 'step_index',
      key: 'step_index',
      width: 56,
    },
    {
      title: '步骤',
      dataIndex: 'step_name',
      key: 'step_name',
      render: (value, record) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{value || '-'}</div>
          <Space size={6}>
            {stepTypeTag(record.step_type)}
            {uiStatusTag(record.status)}
            {record.duration_ms ? (
              <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                {formatDuration(record.duration_ms)}
              </Tag>
            ) : null}
          </Space>
        </div>
      ),
    },
    {
      title: '截图',
      key: 'screenshot',
      width: 110,
      render: (_, record) => {
        const artifact = record.screenshot_artifact || {};
        if (artifact.view_url) {
          return (
            <PillButton
              size="small"
              icon={<EyeOutlined />}
              href={artifact.view_url}
              target="_blank"
              rel="noreferrer"
            >
              查看
            </PillButton>
          );
        }
        if (record.screenshot_path) {
          return (
            <Tag color="warning" style={{ borderRadius: 6, border: 'none' }}>
              未就绪
            </Tag>
          );
        }
        return <span style={{ color: uiPalette.subtle }}>-</span>;
      },
    },
    {
      title: '错误',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 280,
      render: (value) => (
        value ? (
          <div style={{ color: uiPalette.error, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 96, overflow: 'auto' }}>
            {value}
          </div>
        ) : <span style={{ color: uiPalette.subtle }}>-</span>
      ),
    },
  ];

  return (
    <UiTestPage
      toolbar={
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={7}>
            <Select
              value={getUiTestProjectSelectValue(projects, projectId)}
              style={{ width: '100%' }}
              placeholder={projects.length ? '选择项目' : '加载项目...'}
              loading={!projects.length}
              onChange={setProjectId}
              options={projects.map((item) => ({ label: item.name, value: item.id }))}
              suffixIcon={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} md={6}>
            <Input
              value={keyword}
              placeholder="搜索功能用例文件"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => fetchCases(projectId, 1, casePagination.pageSize)}
              allowClear
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              value={statusFilter || 'all'}
              style={{ width: '100%' }}
              placeholder="状态筛选"
              onChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '可执行', value: 'valid' },
                { label: '校验失败', value: 'invalid_ui_node' },
                { label: '空节点', value: 'empty_ui_node' },
                { label: '无 UI 节点', value: 'no_ui_node' },
              ]}
            />
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <PillButton type="primary" onClick={() => fetchCases(projectId, 1, casePagination.pageSize)}>
                查询
              </PillButton>
              <PillButton icon={<ScanOutlined />} loading={scanLoading} onClick={handleScan}>
                重新扫描
              </PillButton>
              <RefreshButton onClick={() => fetchCases(projectId, casePagination.current, casePagination.pageSize)} loading={loading} />
            </Space>
          </Col>
        </Row>
      }
    >
      <SectionCard
        title="扫描资产"
        description="功能用例文件、UI 节点与可执行率"
        extra={<span style={{ color: uiPalette.subtle, fontSize: 13 }}>当前 {filteredData.length} 个文件</span>}
      >
        <Table
          rowKey="file_id"
          loading={loading}
          columns={columns}
          dataSource={filteredData}
          size="middle"
          pagination={{
            current: casePagination.current,
            pageSize: casePagination.pageSize,
            total: casePagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个文件`,
          }}
          onChange={(pagination) => {
            fetchCases(projectId, pagination.current, pagination.pageSize);
          }}
          locale={{ emptyText: <UiEmpty description="当前项目还没有 UI 自动化扫描结果，点击「重新扫描」开始" /> }}
        />
      </SectionCard>

      <Drawer
        width={1200}
        title={
          <Space>
            <FileTextOutlined style={{ color: uiPalette.primary }} />
            <span>{activeFile?.file_title || 'UI 用例节点'}</span>
            <Badge count={nodes.length} style={{ backgroundColor: uiPalette.primary }} />
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{
          body: { background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', padding: 0 },
          header: { borderBottom: `1px solid ${uiPalette.border}` },
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 20px' }}
          items={[
            {
              key: 'nodes',
              label: (
                <Space>
                  <FileTextOutlined />
                  <span>节点列表</span>
                  <Badge count={filteredNodes.length} size="small" style={{ backgroundColor: uiPalette.primary }} />
                </Space>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <MetricStrip items={nodeMetrics} />
                  <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={12}>
                      <Input
                        value={nodeKeyword}
                        placeholder="搜索节点路径 / 标题"
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        onChange={(e) => setNodeKeyword(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <Select
                        value={nodeStatusFilter || 'all'}
                        style={{ width: '100%' }}
                        onChange={(v) => setNodeStatusFilter(v === 'all' ? '' : v)}
                        options={[
                          { label: '全部节点', value: 'all' },
                          { label: '可执行', value: 'valid' },
                          { label: '校验失败', value: 'invalid_ui_node' },
                          { label: '空节点', value: 'empty_ui_node' },
                        ]}
                      />
                    </Col>
                  </Row>
                  <Table
                    rowKey="id"
                    size="small"
                    columns={nodeColumns}
                    dataSource={filteredNodes}
                    pagination={false}
                    locale={{ emptyText: <UiEmpty description="该文件暂无 UI 自动化节点" /> }}
                  />
                </div>
              ),
            },
            {
              key: 'dsl',
              label: (
                <Space>
                  <CodeOutlined />
                  <span>DSL 预览</span>
                </Space>
              ),
              children: (
                <div style={{ padding: '20px 0' }}>
                  {dslPreview ? (
                    <Row gutter={16}>
                      <Col span={8}>
                        <InsetCard title="用例信息" compact icon={<FileTextOutlined />}>
                          <Kv label="状态" value={uiStatusTag(dslPreview.status)} />
                          <Kv label="节点路径" value={selectedNode?.node_path || selectedNode?.node_title} />
                          <Kv label="步骤数" value={selectedNode?.step_count} />
                          <Kv label="模式" value={dslPreview.dsl?.mode} />
                          <Kv label="浏览器" value={dslPreview.dsl?.browser} />
                          <Kv label="入口 URL" value={dslPreview.dsl?.entry_url} />
                        </InsetCard>
                      </Col>
                      <Col span={16}>
                        <InsetCard title="DSL 结构" compact icon={<CodeOutlined />}>
                          <DslCodeBlock data={dslPreview.dsl} />
                        </InsetCard>
                      </Col>
                    </Row>
                  ) : (
                    <UiEmpty description="选择一个节点，点击「预览 DSL」查看编译结果" />
                  )}
                </div>
              ),
            },
            {
              key: 'debug',
              label: (
                <Space>
                  <HistoryOutlined />
                  <span>调试台</span>
                  {activeDebugCase?.id && (
                    <Badge count={debugRuns.length} size="small" style={{ backgroundColor: uiPalette.warning }} />
                  )}
                </Space>
              ),
              children: (
                <div style={{ padding: '20px 0' }}>
                  {activeDebugCase ? (
                    <Row gutter={16}>
                      <Col xs={24} lg={10}>
                        <InsetCard
                          title="调试任务"
                          compact
                          icon={<HistoryOutlined />}
                          actions={
                            <Space>
                              <PillButton
                                icon={<PlayCircleOutlined />}
                                loading={trialLoading[activeDebugCase.id]}
                                onClick={() => handleTrialRun(activeDebugCase.id, activeDebugCase)}
                              >
                                运行
                              </PillButton>
                              <RefreshButton
                                onClick={() => fetchDebugRuns(activeDebugCase.id)}
                                loading={debugLoading}
                              />
                            </Space>
                          }
                        >
                          <Kv label="当前用例" value={activeDebugCase.node_title || activeDebugCase.node_path} />
                          <Kv label="节点路径" value={activeDebugCase.node_path || '-'} />
                          <Table
                            rowKey="id"
                            size="small"
                            loading={debugLoading}
                            columns={debugRunColumns}
                            dataSource={debugRuns}
                            pagination={{ pageSize: 6, showSizeChanger: false }}
                            locale={{ emptyText: <UiEmpty description="当前用例还没有你的调试记录" /> }}
                            style={{ marginTop: 12 }}
                          />
                        </InsetCard>
                      </Col>
                      <Col xs={24} lg={14}>
                        <InsetCard
                          title={debugDetail ? `Run #${debugDetail.id} 步骤结果` : '步骤结果'}
                          compact
                          icon={<EyeOutlined />}
                          actions={debugDetail ? (
                            <Space>
                              {uiStatusTag(debugDetail.status)}
                              {activeRunStatuses.includes(debugDetail.status) && (
                                <Popconfirm
                                  title="确认停止该调试任务？"
                                  onConfirm={() => handleStopRun(debugDetail.id)}
                                  okText="停止"
                                  cancelText="取消"
                                >
                                  <PillButton
                                    size="small"
                                    danger
                                    icon={stopLoading[debugDetail.id] ? <SyncOutlined spin /> : <StopOutlined />}
                                  >
                                    停止
                                  </PillButton>
                                </Popconfirm>
                              )}
                            </Space>
                          ) : null}
                        >
                          {debugDetail ? (
                            <>
                              <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                                <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                                  触发: {debugDetail.trigger_mode || 'trial'}
                                </Tag>
                                <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                                  步骤: {debugDetail.steps?.length || 0}
                                </Tag>
                                <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                                  开始: {debugDetail.started_at || '-'}
                                </Tag>
                              </Space>
                              {debugDetail.error_message && (
                                <div
                                  style={{
                                    border: `1px solid ${uiPalette.error}22`,
                                    background: '#fff1f2',
                                    color: uiPalette.error,
                                    borderRadius: 8,
                                    padding: 10,
                                    marginBottom: 12,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {debugDetail.error_message}
                                </div>
                              )}
                              {debugArtifactWarnings.length > 0 && (
                                <Alert
                                  type="warning"
                                  showIcon
                                  icon={<CloudDownloadOutlined />}
                                  style={{ borderRadius: 8, marginBottom: 12 }}
                                  message={`对象存储上传存在 ${debugArtifactWarnings.length} 个告警`}
                                  description={
                                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                      {debugArtifactWarnings.slice(0, 4).map((item, index) => (
                                        <div
                                          key={`${item.object_key || item.local_path || index}`}
                                          style={{ fontSize: 12, lineHeight: 1.6, wordBreak: 'break-word' }}
                                        >
                                          <strong>{item.label || '产物'}：</strong>{item.message || '上传失败'}
                                          <div style={{ color: uiPalette.subtle }}>
                                            对象：{item.object_key || '-'}
                                          </div>
                                        </div>
                                      ))}
                                    </Space>
                                  }
                                />
                              )}
                              {debugArtifacts.length > 0 && (
                                <div
                                  style={{
                                    border: `1px solid ${uiPalette.border}`,
                                    background: '#fff',
                                    borderRadius: 8,
                                    padding: 10,
                                    marginBottom: 12,
                                  }}
                                >
                                  <Space wrap size={[8, 8]}>
                                    {debugArtifacts.map((item) => (
                                      <PillButton
                                        key={item.object_key}
                                        size="small"
                                        icon={item.preview_type === 'image' ? <FileImageOutlined /> : <CloudDownloadOutlined />}
                                        href={item.view_url || undefined}
                                        target="_blank"
                                        rel="noreferrer"
                                        disabled={!item.view_url}
                                      >
                                        {item.label || item.name}
                                        {!item.available ? '（未就绪）' : ''}
                                      </PillButton>
                                    ))}
                                  </Space>
                                </div>
                              )}
                              <Table
                                rowKey={(record) => record.id || record.step_index}
                                size="small"
                                loading={debugDetailLoading}
                                columns={debugStepColumns}
                                dataSource={debugDetail.steps || []}
                                pagination={false}
                                locale={{ emptyText: <UiEmpty description="Runner 尚未回传步骤结果" /> }}
                              />
                            </>
                          ) : (
                            <UiEmpty description="选择一次调试任务查看步骤、截图和错误" />
                          )}
                        </InsetCard>
                      </Col>
                    </Row>
                  ) : (
                    <UiEmpty description="选择一个节点，点击「调试台」或「试运行」开始调试" />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    </UiTestPage>
  );
};

export default CaseLibrary;
