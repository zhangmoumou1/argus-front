import React, { useEffect, useMemo, useState } from 'react';
import parser from 'cron-parser';
import moment from 'moment';
import {
  Alert,
  Badge,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  TreeSelect,
  Tooltip,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { listProject } from '@/services/project';
import { getAiModelConfig, listEnvironment, listGateway } from '@/services/configure';
import auth from '@/utils/auth';
import {
  deleteUiTestPlan,
  followUiTestPlan,
  getUiTestPlanDetail,
  listUiTestPlanCandidates,
  listUiTestPlans,
  runUiTestPlan,
  saveUiTestPlan,
  switchUiTestPlan,
  unFollowUiTestPlan,
} from '@/services/uiTest';
import { listAllNotificationConfigs } from '@/services/notificationConfig';
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

const defaultForm = {
  project_id: undefined,
  name: '',
  description: '',
  env_name: '',
  env_id: undefined,
  address_id: undefined,
  base_url: '',
  browser: 'chromium',
  headless: true,
  ordered: true,
  cron: '',
  retry_times: 0,
  status: 'enabled',
  case_ref_ids: [],
  ai_model_id: '',
  record_video: true,
  record_trace: true,
  capture_screenshot: true,
  notification_config_id: undefined,
  pass_rate: undefined,
};

const buildUiCaseTreeChildren = (nodes = [], rootTitle = '') => {
  const treeMap = new Map();

  nodes.forEach((item) => {
    const rawPath = String(item.node_path || item.node_title || '').trim();
    const pathParts = rawPath
      .split('/')
      .map((part) => String(part || '').trim())
      .filter(Boolean);
    const normalizedParts =
      rootTitle && pathParts[0] === rootTitle ? pathParts.slice(1) : pathParts.slice();
    const leafParts = normalizedParts.length
      ? normalizedParts
      : [String(item.node_title || '未命名用例').trim()];

    let currentMap = treeMap;
    const currentPath = [];

    leafParts.forEach((part, index) => {
      currentPath.push(part);
      const mapKey = currentPath.join('__');
      const isLeaf = index === leafParts.length - 1;

      if (!currentMap.has(mapKey)) {
        currentMap.set(mapKey, {
          title: isLeaf ? `${part} (${item.step_count || 0}步)` : part,
          value: isLeaf ? item.id : `branch_${mapKey}`,
          key: isLeaf ? `case_${item.id}` : `branch_${mapKey}`,
          selectable: isLeaf,
          disabled: !isLeaf,
          childrenMap: new Map(),
        });
      }

      const target = currentMap.get(mapKey);
      if (isLeaf) {
        target.title = `${part} (${item.step_count || 0}步)`;
        target.value = item.id;
        target.key = `case_${item.id}`;
        target.selectable = true;
        target.disabled = false;
      }
      currentMap = target.childrenMap;
    });
  });

  const toTreeNodes = (map) =>
    Array.from(map.values()).map((entry) => {
      const children = toTreeNodes(entry.childrenMap);
      return {
        title: entry.title,
        value: entry.value,
        key: entry.key,
        selectable: entry.selectable,
        disabled: entry.disabled,
        children: children.length ? children : undefined,
      };
    });

  return toTreeNodes(treeMap);
};

const wizardSteps = [
  { title: '基本信息', icon: <UnorderedListOutlined /> },
  { title: '选择用例', icon: <ExperimentOutlined /> },
  { title: '执行配置', icon: <SettingOutlined /> },
];

const planStatusFilters = [
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

const cardSectionStyle = {
  borderRadius: 14,
  border: `1px solid ${uiPalette.border}`,
  background: uiPalette.cardBg,
  padding: '20px 24px',
  marginBottom: 16,
};

const resolveUiAddressPreview = (item) => {
  if (!item) return '';
  const pageUrl = String(item.page_url || '').trim();
  const gateway = String(item.gateway || '').trim().replace(/\/$/, '');
  if (!pageUrl) return gateway;
  if (/^https?:\/\//i.test(pageUrl)) return pageUrl.replace(/\/$/, '');
  if (!gateway) return pageUrl;
  return `${gateway}${pageUrl.startsWith('/') ? pageUrl : `/${pageUrl}`}`;
};

const PlanList = () => {
  const [projectId, setProjectId] = useUiTestProject();
  const [projects, setProjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [followFilter, setFollowFilter] = useState();
  const [candidateGroups, setCandidateGroups] = useState([]);
  const [aiModelOptions, setAiModelOptions] = useState([]);
  const [envOptions, setEnvOptions] = useState([]);
  const [addressOptions, setAddressOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [notificationConfigs, setNotificationConfigs] = useState([]);
  const [aiModelLoading, setAiModelLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [detail, setDetail] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [runLoading, setRunLoading] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();
  const selectedPlanProjectId = Form.useWatch('project_id', form);
  const selectedCaseIds = Form.useWatch('case_ref_ids', form) || [];
  const watchedCron = Form.useWatch('cron', form);
  const selectedEnvId = Form.useWatch('env_id', form);
  const selectedAddressId = Form.useWatch('address_id', form);

  const cronPreview = useMemo(() => {
    const cronValue = String(watchedCron || '').trim();
    if (!cronValue) return '* 留空仅手动执行，cron表达式只支持5位';
    try {
      const nextDate = parser.parseExpression(cronValue).next().toDate();
      return `下次执行时间：${moment(nextDate).format('YYYY-MM-DD HH:mm:ss')}`;
    } catch {
      return '* cron表达式只支持5位';
    }
  }, [watchedCron]);

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

  const fetchAiModels = async () => {
    setAiModelLoading(true);
    const res = await getAiModelConfig();
    setAiModelLoading(false);
    if (!auth.response(res, false)) {
      setAiModelOptions([]);
      return;
    }
    const data = res.data || res || {};
    const providers = Array.isArray(data.providers) ? data.providers : [];
    const enabledModels = providers
      .filter((item) => item?.enabled)
      .map((item) => {
        const providerName = String(item.provider_name || item.name || item.provider_type || 'AI模型').trim();
        const modelName = String(item.model || '').trim();
        const id = String(item.id || '').trim();
        return {
          label: modelName ? `${providerName} / ${modelName}` : providerName,
          value: id,
          provider_type: String(item.provider_type || item.provider || '').trim(),
        };
      })
      .filter((item) => item.value);
    setAiModelOptions(enabledModels);
    const currentValue = form.getFieldValue('ai_model_id');
    if (!currentValue && enabledModels[0]?.value) {
      form.setFieldValue('ai_model_id', enabledModels[0].value);
    }
  };

  const fetchEnvironments = async () => {
    const res = await listEnvironment({ page: 1, size: 1000, exactly: true });
    if (!auth.response(res, false)) {
      setEnvOptions([]);
      return;
    }
    setEnvOptions(Array.isArray(res.data) ? res.data : []);
  };

  const fetchAddresses = async (envId) => {
    const targetEnvId = Number(envId || 0);
    if (!targetEnvId) {
      setAddressOptions([]);
      return;
    }
    const res = await listGateway({ env: targetEnvId });
    if (!auth.response(res, false)) {
      setAddressOptions([]);
      return;
    }
    setAddressOptions(Array.isArray(res.data) ? res.data : []);
  };

  const fetchNotificationConfigs = async () => {
    const res = await listAllNotificationConfigs();
    if (res?.data) {
      setNotificationConfigs(Array.isArray(res.data) ? res.data : []);
    }
  };

  const fetchPlans = async (
    pid = projectId,
    page = pagination.current,
    size = pagination.pageSize,
  ) => {
    if (!pid) return;
    setLoading(true);
    const planRes = await listUiTestPlans({
      project_id: pid,
      keyword,
      status: statusFilter,
      follow: followFilter,
      page,
      size,
      paged: true,
    });
    setLoading(false);
    if (auth.response(planRes)) {
      const pageData = normalizeApiPage(planRes, { page, size });
      setPlans(pageData.list);
      setPagination({
        current: pageData.page,
        pageSize: pageData.size,
        total: pageData.total,
      });
    }
  };

  const fetchCandidateCases = async (pid) => {
    if (!pid) {
      setCandidateGroups([]);
      return;
    }
    setCandidateLoading(true);
    const candidateRes = await listUiTestPlanCandidates({ project_id: pid });
    setCandidateLoading(false);
    if (auth.response(candidateRes, false)) {
      setCandidateGroups(normalizeApiList(candidateRes));
    } else {
      setCandidateGroups([]);
    }
  };

  const openCreate = () => {
    setEditingPlan(null);
    setDetail(null);
    setCandidateGroups([]);
    form.setFieldsValue({
      ...defaultForm,
      project_id: projectId,
    });
    setCurrentStep(0);
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    const res = await getUiTestPlanDetail({ id: record.id });
    if (auth.response(res)) {
      const data = res.data || res;
      setEditingPlan(record);
      setDetail(data);
      setCandidateGroups([]);
      const runnerConfig = data.runner_config || {};
      form.setFieldsValue({
        ...defaultForm,
        ...data,
        ...runnerConfig,
        env_id: runnerConfig.env_id || undefined,
        address_id: runnerConfig.address_id || undefined,
        ai_model_id: runnerConfig.ai_model_id || '',
        project_id: data.project_id,
        case_ref_ids: (data.cases || []).map((item) => item.case_ref_id),
      });
      setCurrentStep(0);
      setModalOpen(true);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const targetProjectId = Number(values.project_id || 0);
      if (!targetProjectId) {
        message.warning('请先选择项目');
        return;
      }
      setSubmitting(true);
      const payload = {
        ...values,
        id: editingPlan?.id,
        project_id: targetProjectId,
        selected_case_ref_ids: values.case_ref_ids,
      };
      const res = await saveUiTestPlan(payload);
      setSubmitting(false);
      if (auth.response(res, true)) {
        setModalOpen(false);
        if (targetProjectId !== projectId) {
          setProjectId(targetProjectId);
        } else {
          fetchPlans(targetProjectId, pagination.current, pagination.pageSize);
        }
      }
    } catch (err) {
      // validation error, go to the step with errors
    }
  };

  const handleRun = async (id) => {
    setRunLoading((prev) => ({ ...prev, [id]: true }));
    const res = await runUiTestPlan({ id });
    setRunLoading((prev) => ({ ...prev, [id]: false }));
    if (auth.response(res, false)) {
      fetchPlans(projectId, pagination.current, pagination.pageSize);
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteUiTestPlan({ id });
    if (auth.response(res, true)) {
      fetchPlans(projectId, pagination.current, pagination.pageSize);
    }
  };

  const handleSwitch = async (record, checked) => {
    const res = await switchUiTestPlan({ id: record.id, status: checked });
    if (auth.response(res, true)) {
      fetchPlans(projectId, pagination.current, pagination.pageSize);
    }
  };

  const handleFollow = async (record, checked) => {
    const res = checked
      ? await followUiTestPlan({ id: record.id })
      : await unFollowUiTestPlan({ id: record.id });
    if (auth.response(res, true)) {
      fetchPlans(projectId, pagination.current, pagination.pageSize);
    }
  };

  const nextStep = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['project_id', 'name']);
      } else if (currentStep === 1) {
        await form.validateFields(['case_ref_ids']);
      }
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
    } catch {
      // stay on current step
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    fetchProjects();
    fetchAiModels();
    fetchEnvironments();
    fetchNotificationConfigs();
  }, []);

  useEffect(() => {
    if (projectId) fetchPlans(projectId, 1, pagination.pageSize);
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchPlans(projectId, 1, pagination.pageSize);
  }, [statusFilter]);

  useEffect(() => {
    if (projectId) fetchPlans(projectId, 1, pagination.pageSize);
  }, [followFilter]);

  useEffect(() => {
    if (!modalOpen) return;
    if (!selectedPlanProjectId) {
      setCandidateGroups([]);
      return;
    }
    fetchCandidateCases(selectedPlanProjectId);
  }, [modalOpen, selectedPlanProjectId]);

  useEffect(() => {
    if (!modalOpen) return;
    fetchAddresses(selectedEnvId);
  }, [modalOpen, selectedEnvId]);

  const filteredPlans = useMemo(() => plans, [plans]);

  const candidateTreeData = useMemo(
    () =>
      candidateGroups.map((group) => ({
        title: `${group.file_title} (${group.ui_case_count || (group.nodes || []).length})`,
        value: `group_${group.file_id}`,
        key: `group_${group.file_id}`,
        selectable: false,
        disabled: true,
        children: buildUiCaseTreeChildren(group.nodes || [], group.file_title),
      })),
    [candidateGroups],
  );

  const totalCandidates = candidateGroups.reduce(
    (sum, group) => sum + (group.ui_case_count || (group.nodes || []).length || 0),
    0,
  );

  const invalidCases = (detail?.cases || []).filter((item) => item.status !== 'valid');
  const selectedAddress = useMemo(
    () => addressOptions.find((item) => Number(item.id) === Number(selectedAddressId || 0)) || null,
    [addressOptions, selectedAddressId],
  );
  const addressPreview = useMemo(() => {
    return resolveUiAddressPreview(selectedAddress);
  }, [selectedAddress]);

  const columns = [
    {
      title: '项目',
      dataIndex: 'project_id',
      key: 'project_id',
      width: 120,
      render: (value) => projects.find((item) => String(item.id) === String(value))?.name || `项目#${value}`,
    },
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (value, record) => (
        <div>
          <a onClick={() => openEdit(record)} style={{ fontWeight: 600 }}>{value}</a>
          {record.description && (
            <div style={{ color: uiPalette.subtle, fontSize: 12, marginTop: 2, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.description}
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
      title: '执行配置',
      key: 'config',
      width: 360,
      render: (_, record) => (
        <Space wrap size={[6, 4]}>
          <Tag style={{ borderRadius: 999, border: 'none', background: '#ede9fe', color: '#7c3aed' }}>
            {record.browser || 'chromium'}
          </Tag>
          <Tag style={{ borderRadius: 999, border: 'none', background: record.headless ? '#f1f5f9' : '#fef3c7', color: record.headless ? '#475569' : '#92400e' }}>
            {record.headless ? '无头' : '有头'}
          </Tag>
          <Tag style={{ borderRadius: 999, border: 'none', background: '#dbeafe', color: '#1d4ed8' }}>
            {record.ordered ? '顺序' : '并发'}
          </Tag>
          <Tag style={{ borderRadius: 999, border: 'none', background: '#fce7f3', color: '#be185d' }}>
            重试 {record.retry_times || 0}
          </Tag>
          <Tag icon={<ThunderboltOutlined />} style={{ borderRadius: 999, border: 'none', background: '#dbeafe', color: '#1d4ed8' }}>
            {record.case_count || 0} 用例
          </Tag>
        </Space>
      ),
    },
    {
      title: '是否开启',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value, record) => (
        <Space size={10}>
          <Switch
            size="large"
            checked={record.status === 'enabled'}
            onChange={(checked) => handleSwitch(record, checked)}
          />
        </Space>
      ),
    },
    {
      title: '调度',
      dataIndex: 'cron',
      key: 'cron',
      width: 180,
      render: (value, record) => {
        if (!value) {
          return <span style={{ color: '#cbd5e1' }}>手动执行</span>;
        }
        const state = record.state;
        if (state === 2) {
          return (
            <Tooltip title="定时任务可能添加失败，请尝试重新添加">
              <Space size={4}>
                <Badge status="error" />
                <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
                  {value}
                </Tag>
              </Space>
            </Tooltip>
          );
        }
        if (state === 3) {
          return (
            <Tooltip title="任务已暂停">
              <Space size={4}>
                <Badge status="warning" />
                <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
                  {value}
                </Tag>
              </Space>
            </Tooltip>
          );
        }
        if (state === 1 && record.next_run) {
          return (
            <Tooltip title={`下次运行时间: ${record.next_run}`}>
              <Space size={4}>
                <Badge status="success" />
                <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
                  {value}
                </Tag>
              </Space>
            </Tooltip>
          );
        }
        return (
          <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
            {value}
          </Tag>
        );
      },
    },
    {
      title: (
        <span>
          是否关注 <Tooltip title="关注后会展示在 Dashboard 工作台的关注测试计划中"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'follow',
      key: 'follow',
      width: 110,
      render: (value, record) => (
        <Switch
          size="large"
          checked={!!value}
          onChange={(checked) => handleFollow(record, checked)}
        />
      ),
    },
    {
      title: '创建人',
      dataIndex: 'create_user',
      key: 'create_user',
      width: 140,
      render: (value, record) => record.create_user_name || record.create_user_username || record.creator_name || `用户#${value}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space split={actionSplit}>
          <a onClick={() => openEdit(record)}>
            <Space size={4}><EditOutlined /> 编辑</Space>
          </a>
          <a onClick={() => handleRun(record.id)} style={{ color: uiPalette.success }}>
            <Space size={4}>
              {runLoading[record.id] ? <SyncOutlined spin /> : <PlayCircleOutlined />}
              执行
            </Space>
          </a>
          <Popconfirm
            title="确认删除该计划？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <a style={{ color: uiPalette.error }}>
              <Space size={4}><DeleteOutlined /></Space>
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const modalFooter = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ color: uiPalette.subtle, fontSize: 12 }}>
        {currentStep + 1} / {wizardSteps.length}
        {selectedCaseIds.length ? ` · 已选 ${selectedCaseIds.length} 个用例` : ''}
      </div>
      <Space>
        <PillButton onClick={() => setModalOpen(false)}>取消</PillButton>
        {currentStep > 0 && <PillButton onClick={prevStep}>上一步</PillButton>}
        {currentStep < wizardSteps.length - 1 && (
          <PillButton type="primary" onClick={nextStep}>
            下一步
          </PillButton>
        )}
        {currentStep === wizardSteps.length - 1 && (
          <PillButton type="primary" loading={submitting} onClick={handleSubmit}>
            保存计划
          </PillButton>
        )}
      </Space>
    </div>
  );

  return (
    <UiTestPage
      showModuleNav={false}
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
          <Col xs={24} md={6}>
            <Select
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value || '')}
              options={planStatusFilters}
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Input
              value={keyword}
              placeholder="搜索计划 / 浏览器 / Cron"
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => fetchPlans(projectId, 1, pagination.pageSize)}
              allowClear
            />
          </Col>
          <Col xs={24} md={3}>
            <Select
              value={followFilter}
              onChange={(value) => setFollowFilter(value)}
              placeholder="是否关注"
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '已关注', value: true },
                { label: '未关注', value: false },
              ]}
            />
          </Col>
          <Col xs={24} md={3}>
            <Space>
              <PillButton type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                新建计划
              </PillButton>
            </Space>
          </Col>
        </Row>
      }
    >
      <SectionCard
        title="计划列表"
        description="运行策略、调度状态和用例覆盖"
        extra={<span style={{ color: uiPalette.subtle, fontSize: 13 }}>共 {pagination.total || filteredPlans.length} 个计划</span>}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredPlans}
          size="middle"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个计划`,
          }}
          onChange={(nextPagination) => fetchPlans(projectId, nextPagination.current, nextPagination.pageSize)}
          locale={{ emptyText: <UiEmpty description="当前项目还没有 UI 测试计划，点击「新建计划」创建" /> }}
          columns={columns}
        />
      </SectionCard>

      <Modal
        open={modalOpen}
        title={
          <Space>
            <ExperimentOutlined style={{ color: uiPalette.primary }} />
            <span>{editingPlan ? `编辑计划 #${editingPlan.id}` : '新建 UI 测试计划'}</span>
          </Space>
        }
        width={920}
        onCancel={() => setModalOpen(false)}
        footer={modalFooter}
        destroyOnClose
        styles={{
          content: {
            borderRadius: 20,
            padding: 0,
            overflow: 'hidden',
          },
          header: {
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${uiPalette.border}`,
            marginBottom: 0,
          },
          body: {
            padding: '20px 24px',
            background: 'linear-gradient(180deg, #fafbfd 0%, #f5f8fc 100%)',
            minHeight: 440,
          },
          footer: {
            padding: '12px 24px 16px',
            borderTop: `1px solid ${uiPalette.border}`,
          },
        }}
      >
        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={wizardSteps.map((s) => ({
            title: s.title,
            icon: s.icon,
          }))}
        />

        <Form form={form} layout="vertical" initialValues={defaultForm}>
          {/* Step 1: Basic Info */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <div style={cardSectionStyle}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: uiPalette.text }}>
                基本信息
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="project_id"
                    label="所属项目"
                    rules={[{ required: true, message: '请选择项目' }]}
                  >
                    <Select
                      placeholder="先选择项目，再选择 UI 用例"
                      options={projects.map((item) => ({ label: item.name, value: item.id }))}
                      onChange={() => form.setFieldValue('case_ref_ids', [])}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
                    <Input placeholder="例如：登录冒烟回归" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="env_id"
                    label="环境"
                    rules={[{ required: true, message: '请选择执行环境' }]}
                  >
                    <Select
                      placeholder="选择执行环境"
                      options={envOptions.map((item) => ({ label: item.name, value: item.id }))}
                      onChange={() => form.setFieldValue('address_id', undefined)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="描述">
                <Input.TextArea rows={3} placeholder="说明计划目标、覆盖范围或执行窗口" />
              </Form.Item>
              <Form.Item name="address_id" label="地址前缀">
                <Select
                  placeholder={selectedEnvId ? '选择地址前缀' : '请先选择环境'}
                  disabled={!selectedEnvId}
                  options={addressOptions.map((item) => ({
                    label: `${item.name} (${resolveUiAddressPreview(item) || item.gateway || '-'})`,
                    value: item.id,
                  }))}
                />
              </Form.Item>
              {addressPreview && (
                <div style={{ marginTop: -8, marginBottom: 8, color: uiPalette.subtle, fontSize: 12 }}>
                  当前页面前缀：{addressPreview}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Case Selection */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <div style={cardSectionStyle}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: uiPalette.text }}>
                选择 UI 用例
              </div>
              {editingPlan && invalidCases.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  style={{ marginBottom: 16, borderRadius: 12 }}
                  message={`该计划有 ${invalidCases.length} 个节点已经失效`}
                  description={
                    <div style={{ marginTop: 8 }}>
                      {invalidCases.map((item, idx) => (
                        <Tag key={idx} color="error" style={{ borderRadius: 999, border: 'none', marginBottom: 4 }}>
                          {item.node_path || item.node_title}
                        </Tag>
                      ))}
                    </div>
                  }
                />
              )}
              <Form.Item
                name="case_ref_ids"
                label={`可选用例 (${totalCandidates})`}
                rules={[{ required: true, message: '请至少选择一个用例' }]}
              >
                <TreeSelect
                  loading={candidateLoading}
                  treeData={candidateTreeData}
                  treeCheckable
                  showCheckedStrategy={TreeSelect.SHOW_CHILD}
                  treeDefaultExpandAll
                  placeholder={selectedPlanProjectId ? '按层级选择 UI 用例' : '请先在上一步选择项目'}
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                  treeNodeFilterProp="title"
                  disabled={!selectedPlanProjectId}
                  showSearch
                  dropdownStyle={{ maxHeight: 420, overflow: 'auto' }}
                />
              </Form.Item>
              {editingPlan && detail?.cases?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ color: uiPalette.subtle, fontSize: 13, marginBottom: 8 }}>当前引用节点</div>
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={detail.cases}
                    columns={[
                      {
                        title: '节点路径',
                        dataIndex: 'node_path',
                        key: 'node_path',
                        render: (value, record) => value || record.node_title,
                      },
                      {
                        title: '状态',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: (value) => uiStatusTag(value),
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Execution Config */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <div style={cardSectionStyle}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: uiPalette.text }}>
                浏览器与执行
              </div>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="browser" label="浏览器">
                    <Select
                      options={[
                        { label: 'Chromium', value: 'chromium' },
                        { label: 'Firefox', value: 'firefox' },
                        { label: 'Webkit', value: 'webkit' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="headless" label="无头模式" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="ordered" label="顺序执行" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="cron"
                    label="cron表达式"
                    extra={<div>{cronPreview}</div>}
                    rules={[
                      { required: true, message: '请输入cron表达式' },
                      () => ({
                        validator(_, value) {
                          const cronValue = String(value || '').trim();
                          try {
                            parser.parseExpression(cronValue);
                            return Promise.resolve();
                          } catch {
                            return Promise.reject(new Error('请输入正确的cron表达式'));
                          }
                        },
                      }),
                    ]}
                  >
                    <Input placeholder="请输入执行cron表达式" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="retry_times" label="重试次数">
                    <InputNumber min={0} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="计划状态">
                    <Select
                      options={[
                        { label: '启用', value: 'enabled' },
                        { label: '停用', value: 'disabled' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={cardSectionStyle}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: uiPalette.text }}>
                产物采集
              </div>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="record_video" label="录屏" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="record_trace" label="Playwright Trace" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="capture_screenshot" label="每步截图" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={cardSectionStyle}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: uiPalette.text }}>
                AI 模型配置
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ai_model_id"
                    label="AI 模型"
                    rules={[{ required: true, message: '请选择一个已启用模型' }]}
                  >
                    <Select
                      loading={aiModelLoading}
                      placeholder="选择平台中已启用的模型"
                      options={aiModelOptions}
                      optionFilterProp="label"
                      showSearch
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div style={cardSectionStyle}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, color: uiPalette.text }}>
                通知设置
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="notification_config_id" label="通知配置">
                    <Select allowClear showSearch placeholder="选择通知配置" style={{ width: '100%' }}>
                      {notificationConfigs.map(item => (
                        <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="pass_rate"
                    label={<span>成功率阈值 <Tooltip title="未配置阈值时，每次执行完成都会通知；配置后，只有本次成功率低于该阈值才会发起通知。"><QuestionCircleOutlined /></Tooltip></span>}
                    extra="不填则每次执行后都通知；填写后仅当成功率低于阈值才通知"
                  >
                    <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="%" placeholder="请输入1-100" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>
        </Form>
      </Modal>
    </UiTestPage>
  );
};

export default PlanList;
