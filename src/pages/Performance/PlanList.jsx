import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { connect } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Descriptions,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  TreeSelect,
} from 'antd';
import {
  ApiOutlined,
  BranchesOutlined,
  CodeOutlined,
  DeleteOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  deletePerformancePlan,
  executePerformancePlan,
  followPerformancePlan,
  insertPerformancePlan,
  listPerformanceParameterFiles,
  listPerformancePlan,
  previewPerformanceParameterFile,
  queryPerformancePlanSource,
  queryPerformanceCasePreview,
  unFollowPerformancePlan,
  updatePerformancePlan,
  validatePerformancePlanParameters,
} from '@/services/performance';
import { listFile } from '@/services/configure';
import { listApiEndpoints, listApiEndpointVersions, listApiServices } from '@/services/interfaceManage';
import { listTestPlanCaseTree } from '@/services/testplan';
import auth from '@/utils/auth';
import UserLink from '@/components/Button/UserLink';
import CONFIG from '@/consts/config';
import {
  PerformanceDataTableCard,
  PerformanceModalFrame,
  PerformanceToolbar,
  performanceInsetPanelStyle,
  performancePalette,
  railPanelStyle,
} from './ModuleShell';

const { TextArea } = Input;
const { Option } = Select;
const SOURCE_TYPE = {
  API_ASSET: 'api_asset',
  API_SCENARIO: 'api_scenario',
  MANUAL: 'manual',
  SINGLE: 'single',
  LINK: 'link',
};
const SOURCE_OPTIONS = [
  {
    value: SOURCE_TYPE.API_ASSET,
    icon: <ApiOutlined />,
    title: '接口资产',
    subtitle: '从已维护的接口服务和版本生成请求快照',
    tags: ['适合单接口', '资产复用', '可追溯'],
  },
  {
    value: SOURCE_TYPE.API_SCENARIO,
    icon: <BranchesOutlined />,
    title: '接口用例',
    subtitle: '按接口用例链路顺序执行，复用变量提取和断言',
    tags: ['适合业务链路', '变量串联', '场景压测'],
  },
  {
    value: SOURCE_TYPE.MANUAL,
    icon: <CodeOutlined />,
    title: '自定义接口',
    subtitle: '临时填写 URL、Header、Query 和 Body',
    tags: ['快速验证', '临时接口', '轻量配置'],
  },
];
const LOAD_MODE = {
  CONCURRENCY: 'concurrency',
  QPS: 'qps',
};
const SETUP_SCOPE = {
  PER_RUN: 'per_run',
  PER_WORKER: 'per_worker',
};
const THRESHOLD_METRICS = [
  { value: 'avg_rt_ms', label: '平均响应时间', unit: 'ms' },
  { value: 'p90_rt_ms', label: 'P90', unit: 'ms' },
  { value: 'p95_rt_ms', label: 'P95', unit: 'ms' },
  { value: 'p99_rt_ms', label: 'P99', unit: 'ms' },
  { value: 'max_rt_ms', label: '最大响应时间', unit: 'ms' },
  { value: 'avg_rps', label: 'TPS/QPS', unit: '' },
  { value: 'error_rate', label: '错误率', unit: '%' },
  { value: 'success_rate', label: '成功率', unit: '%' },
  { value: 'assertion_failed_count', label: '断言失败数', unit: '' },
];
const THRESHOLD_OPERATORS = ['<', '<=', '>', '>='];
const ASSERTION_TYPES = [
  { value: 'status_code', label: '状态码断言' },
  { value: 'body_contains', label: '响应包含文本' },
  { value: 'json_path', label: 'JSONPath 断言' },
  { value: 'header_contains', label: '响应头包含文本' },
];

const defaultPlan = {
  source_type: SOURCE_TYPE.API_ASSET,
  case_list: [],
  enabled: true,
  request_method: 'GET',
  request_url: '',
  request_headers: '{}',
  request_query: '{}',
  request_body: '',
  load_mode: LOAD_MODE.CONCURRENCY,
  load_config: {
    concurrency: 10,
    duration_seconds: 60,
    ramp_up_seconds: 0,
    iterations: 0,
    think_time_ms: 0,
    request_timeout_ms: 10000,
    target_qps: 50,
    max_concurrency: 20,
  },
  threshold_config: [
    { metric: 'p95_rt_ms', label: 'P95', operator: '<=', value: 1000 },
    { metric: 'error_rate', label: '错误率', operator: '<=', value: 1 },
  ],
  assertions_config: [],
  parameter_config: {
    manual_variables: [],
    file_variables: [],
    global_headers: [],
    setup_config: {
      enabled: false,
      scope: SETUP_SCOPE.PER_RUN,
      source: 'chain',
      case_list: [],
    },
    builtin_functions_enabled: true,
  },
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.list)) return value.list;
  if (Array.isArray(value.records)) return value.records;
  if (Array.isArray(value.rows)) return value.rows;
  return [];
};

const safeJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }
  return value;
};

const prettyJson = (value, fallback = '{}') => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch (e) {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return fallback;
  }
};

const parseCsvLine = (line, delimiter = ',') => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values.map((item) => item.trim());
};

const parseCsvPreview = (text, delimiter = ',', limit = 10) => {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (!lines.length) {
    return { columns: [], rows: [], row_count: 0 };
  }
  const columns = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1, limit + 1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    return columns.reduce((acc, column, idx) => ({
      ...acc,
      [column || `column_${idx + 1}`]: values[idx] ?? '',
    }), {});
  });
  return {
    columns,
    rows,
    row_count: Math.max(lines.length - 1, 0),
  };
};

const toCaseKeys = (caseList) => {
  if (!caseList) return [];
  if (Array.isArray(caseList)) return caseList;
  return String(caseList).split(',').filter(Boolean).map((id) => `testcase_${id}`);
};

const toCaseIdString = (caseList) => (caseList || [])
  .filter((item) => String(item).startsWith('testcase_'))
  .map((item) => String(item).replace('testcase_', ''))
  .join(',');

const normalizeSelectableCaseTree = (nodes = []) => nodes.map((node) => {
  const children = normalizeSelectableCaseTree(node.children || []);
  const next = { ...node, children };
  if (!String(next.value || next.key || '').startsWith('testcase_')) {
    next.disabled = false;
  }
  return next;
});

const collectCaseLeafValues = (nodes = []) => {
  const values = [];
  nodes.forEach((node) => {
    const nodeValue = String(node?.value ?? node?.key ?? '');
    if (nodeValue.startsWith('testcase_')) {
      values.push(nodeValue);
    }
    if (Array.isArray(node?.children) && node.children.length) {
      values.push(...collectCaseLeafValues(node.children));
    }
  });
  return values;
};

const buildDirectoryCaseMap = (nodes = []) => {
  const map = new Map();
  const walk = (items = []) => {
    items.forEach((node) => {
      const nodeValue = String(node?.value ?? node?.key ?? '');
      const children = Array.isArray(node?.children) ? node.children : [];
      if (!nodeValue.startsWith('testcase_')) {
        map.set(nodeValue, collectCaseLeafValues(children));
      }
      walk(children);
    });
  };
  walk(nodes);
  return map;
};

const expandSelectedCaseValues = (values = [], directoryCaseMap = new Map()) => {
  const ordered = [];
  const seen = new Set();
  values.forEach((item) => {
    const key = String(item);
    const expanded = directoryCaseMap.get(key) || [key];
    expanded.forEach((value) => {
      if (!String(value).startsWith('testcase_') || seen.has(value)) return;
      seen.add(value);
      ordered.push(value);
    });
  });
  return ordered;
};

const formatSourceType = (value) => {
  if (value === SOURCE_TYPE.API_SCENARIO || value === SOURCE_TYPE.LINK) return '接口场景';
  if (value === SOURCE_TYPE.MANUAL) return '手动接口';
  return '接口资产';
};

const formatLoadMode = (value) => {
  if (value === LOAD_MODE.QPS) return 'QPS 模式';
  return '并发模式';
};

const workspaceCardStyle = {
  borderRadius: 20,
  border: '1px solid #dbe7f4',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
};

const workspaceMutedCardStyle = {
  ...workspaceCardStyle,
  background: 'linear-gradient(180deg, #f8fbff 0%, #f2f7fd 100%)',
};

const StepWorkspaceHeader = ({ eyebrow, title, description, extra }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Space direction="vertical" size={6}>
        <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 12 }}>{eyebrow}</span>
        <span style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 700, color: '#0f172a' }}>{title}</span>
        <span style={{ color: '#64748b', lineHeight: 1.7 }}>{description}</span>
      </Space>
      {extra}
    </div>
  </div>
);

const SourceOptionCard = ({ item, active }) => (
  <div
    style={{
      height: '100%',
      padding: 18,
      borderRadius: 14,
      border: active ? '1px solid #06b6d4' : '1px solid #dbe6f3',
      background: active ? 'linear-gradient(180deg, #ecfeff 0%, #f8fbff 100%)' : '#fff',
      boxShadow: active ? '0 10px 22px rgba(6, 182, 212, 0.12)' : '0 6px 16px rgba(15, 23, 42, 0.04)',
      cursor: 'pointer',
      transition: 'all 160ms ease',
    }}
  >
    <Space direction="vertical" size={10} style={{ width: '100%' }}>
      <Space align="center" size={10}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: active ? '#06b6d4' : '#eff6ff',
            color: active ? '#fff' : '#2563eb',
            fontSize: 18,
          }}
        >
          {item.icon}
        </span>
        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</span>
      </Space>
      <span style={{ minHeight: 44, color: '#475569', lineHeight: 1.6 }}>{item.subtitle}</span>
      <Space wrap size={[6, 6]}>
        {item.tags.map((tag) => (
          <Tag key={tag} color={active ? 'cyan' : 'blue'} style={{ marginInlineEnd: 0 }}>
            {tag}
          </Tag>
        ))}
      </Space>
    </Space>
  </div>
);

const executionGuardrailStyle = {
  border: '1px solid #bfdbfe',
  borderRadius: 16,
  background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 55%, #ecfeff 100%)',
};

const previewCodeStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 12,
  background: '#0f172a',
  color: '#e2e8f0',
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: 220,
  overflow: 'auto',
};

const PlanList = ({ dispatch, project, gconfig, user, loading }) => {
  const [filterForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [endpointOptions, setEndpointOptions] = useState([]);
  const [versionOptions, setVersionOptions] = useState([]);
  const [caseTree, setCaseTree] = useState([]);
  const [casePreview, setCasePreview] = useState([]);
  const [parameterFiles, setParameterFiles] = useState([]);
  const [parameterPreview, setParameterPreview] = useState(null);
  const [parameterValidation, setParameterValidation] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showTotal: (total) => `共${total}条记录`,
  });

  const { projects, projectsMap } = project;
  const { envList, envMap } = gconfig;
  const { userMap } = user;

  const editingId = Form.useWatch('id', editForm);
  const sourceTypeRaw = Form.useWatch('source_type', editForm);
  const sourceType = sourceTypeRaw || SOURCE_TYPE.API_ASSET;
  const loadMode = Form.useWatch('load_mode', editForm) || LOAD_MODE.CONCURRENCY;
  const selectedCases = Form.useWatch('case_list', editForm) || [];
  const planName = Form.useWatch('name', editForm);
  const projectId = Form.useWatch('project_id', editForm);
  const envId = Form.useWatch('env', editForm);
  const requestMethod = Form.useWatch('request_method', editForm);
  const requestUrl = Form.useWatch('request_url', editForm);
  const thresholdList = Form.useWatch('threshold_config', editForm) || [];
  const assertionsList = Form.useWatch('assertions_config', editForm) || [];
  const loadConfig = Form.useWatch('load_config', editForm) || {};
  const setupConfig = Form.useWatch(['parameter_config', 'setup_config'], editForm) || defaultPlan.parameter_config.setup_config;

  const pageLoading = loading.effects['project/listProject'] || loading.effects['gconfig/fetchEnvList'];
  const selectedCaseCount = selectedCases.filter((item) => String(item).startsWith('testcase_')).length;
  const selectableCaseTree = normalizeSelectableCaseTree(caseTree || []);
  const directoryCaseMap = buildDirectoryCaseMap(selectableCaseTree);
  const selectedServiceName = serviceOptions.find((item) => item.id === editForm.getFieldValue('service_id'))?.name;
  const selectedEndpointName = endpointOptions.find((item) => item.id === editForm.getFieldValue('endpoint_id'))?.name;
  const selectedVersionName = versionOptions.find((item) => item.id === editForm.getFieldValue('api_version_id'))?.version_no
    || versionOptions.find((item) => item.id === editForm.getFieldValue('api_version_id'))?.name;
  const submitPreview = buildSubmitPayload(editForm.getFieldsValue(true) || defaultPlan);
  const thresholdSummary = (submitPreview.threshold_config || []).map((item) => `${item.label || item.metric} ${item.operator} ${item.value}`).join('；');
  const fetchPlans = async (page = pagination.current) => {
    const values = filterForm.getFieldsValue();
    const res = await listPerformancePlan({
      ...values,
      page,
      size: pagination.pageSize,
    });
    if (auth.response(res)) {
      setDataSource(normalizeList(res.data));
      setPagination((prev) => ({ ...prev, current: page, total: res.total || 0 }));
    }
  };

  const loadServices = async (value) => {
    if (!value) {
      setServiceOptions([]);
      return;
    }
    const res = await listApiServices({ page: 1, size: 1000, project_id: value });
    if (auth.response(res)) {
      setServiceOptions(normalizeList(res.data));
    }
  };

  const loadEndpoints = async (value) => {
    if (!value) {
      setEndpointOptions([]);
      return;
    }
    const res = await listApiEndpoints({ page: 1, size: 1000, service_id: value });
    if (auth.response(res)) {
      setEndpointOptions(normalizeList(res.data));
    }
  };

  const loadVersions = async (value) => {
    if (!value) {
      setVersionOptions([]);
      return;
    }
    const res = await listApiEndpointVersions({ endpoint_id: value });
    if (auth.response(res)) {
      setVersionOptions(normalizeList(res.data));
    }
  };

  const loadCaseTree = async (value) => {
    if (!value) {
      setCaseTree([]);
      return;
    }
    const res = await listTestPlanCaseTree({ project_id: value });
    if (auth.response(res)) {
      setCaseTree(normalizeSelectableCaseTree(res.data?.tree || []));
    }
  };

  const loadParameterFiles = async (value) => {
    if (!value) {
      setParameterFiles([]);
      return;
    }
    const [legacyRes, bucketRes] = await Promise.all([
      listPerformanceParameterFiles({ project_id: value }),
      listFile({ suffix: '.csv' }),
    ]);

    const legacyFiles = auth.response(legacyRes, false)
      ? normalizeList(legacyRes.data).map((item) => ({
        ...item,
        option_type: 'legacy',
        option_label: item.name || item.file_name || `参数文件#${item.id}`,
      }))
      : [];

    const bucketFiles = auth.response(bucketRes, false)
      ? normalizeList(bucketRes.data)
        .filter((item) => !item?.is_dir && /\.csv$/i.test(String(item?.file_path || '')))
        .map((item) => ({
          ...item,
          id: `bucket:${item.file_path}`,
          option_type: 'bucket',
          name: item.name || item.file_path.split('/').pop(),
          row_count: item.file_size || '-',
          option_label: item.file_path,
        }))
      : [];

    const merged = [...bucketFiles, ...legacyFiles].filter((item, index, list) => (
      list.findIndex((candidate) => String(candidate.id) === String(item.id)) === index
    ));

    setParameterFiles(merged);
  };

  const loadCasePreview = async (caseList) => {
    const caseIds = toCaseIdString(caseList || []);
    if (!caseIds) {
      setCasePreview([]);
      return;
    }
    const res = await queryPerformanceCasePreview({ case_ids: caseIds });
    if (auth.response(res)) {
      const previewList = res.data || [];
      setCasePreview(previewList);
      const firstCase = previewList[0];
      if (firstCase) {
        editForm.setFieldsValue({
          request_method: firstCase.method || 'GET',
          request_url: firstCase.url || '',
          request_headers: prettyJson(firstCase.headers),
          request_query: prettyJson(firstCase.query),
          request_body: prettyJson(firstCase.body, ''),
          assertions_config: (firstCase.assertions || [])
            .map((item, index) => {
              const rawType = String(item?.type || '').trim();
              const rawPath = String(item?.path || '').trim();
              const name = item?.name || `断言${index + 1}`;
              const expected = item?.expected ?? '';
              if (rawPath === '${status_code}' || rawPath === 'status_code') {
                return {
                  type: 'status_code',
                  name,
                  operator: '=',
                  expected,
                };
              }
              if (rawPath === '${response}') {
                return {
                  type: 'body_contains',
                  name,
                  operator: 'contains',
                  expected,
                };
              }
              if (rawPath.startsWith('$.') || rawPath === '$') {
                return {
                  type: 'json_path',
                  name,
                  operator: rawType === 'contain' ? 'contains' : '=',
                  path: rawPath,
                  expected,
                };
              }
              if (/header/i.test(rawPath)) {
                return {
                  type: 'header_contains',
                  name,
                  operator: 'contains',
                  path: rawPath.replace(/^header[:.\s]*/i, ''),
                  expected,
                };
              }
              return null;
            })
            .filter(Boolean),
        });
      }
    }
  };

  const loadParameterPreview = async (fileId) => {
    if (!fileId) {
      setParameterPreview(null);
      return;
    }
    if (String(fileId).startsWith('bucket:')) {
      const filepath = String(fileId).replace(/^bucket:/, '').trim();
      const res = await fetch(`${CONFIG.URL}/oss/download?filepath=${encodeURIComponent(filepath)}`);
      if (!res.ok) {
        message.error('读取 bucket CSV 文件失败');
        setParameterPreview(null);
        return;
      }
      const text = await res.text();
      setParameterPreview(parseCsvPreview(text));
      return;
    }
    const res = await previewPerformanceParameterFile({ id: fileId });
    if (auth.response(res)) {
      setParameterPreview(res.data);
    }
  };

  const fillSourceByVersion = async (apiVersionId) => {
    if (!apiVersionId) return;
    const res = await queryPerformancePlanSource({ api_version_id: apiVersionId });
    if (auth.response(res)) {
      editForm.setFieldsValue({
        request_method: res.data.request_method || 'GET',
        request_url: res.data.request_url || '',
        request_headers: prettyJson(res.data.request_headers),
        request_query: prettyJson(res.data.request_query),
        request_body: prettyJson(res.data.request_body, ''),
      });
    }
  };

  const formatPreviewText = (value, fallback = '-') => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return fallback;
      try {
        return JSON.stringify(JSON.parse(text), null, 2);
      } catch (e) {
        return text;
      }
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  };

  const resetSourceOptions = () => {
    setServiceOptions([]);
    setEndpointOptions([]);
    setVersionOptions([]);
    setCaseTree([]);
  };

  const applyExpandedCaseSelection = (fieldName, values = []) => {
    const expandedValues = expandSelectedCaseValues(values, directoryCaseMap);
    editForm.setFieldValue(fieldName, expandedValues);
  };

  const hydrateEditForm = (values) => {
    setTimeout(() => {
      editForm.setFieldsValue(values);
    }, 0);
  };

  const openCreate = () => {
    setVisible(true);
    setCurrentStep(0);
    resetSourceOptions();
    setCasePreview([]);
    setParameterPreview(null);
    setParameterValidation(null);
    editForm.resetFields();
    hydrateEditForm(defaultPlan);
  };

  const openEdit = async (record) => {
    const normalizedSourceType = record.source_type === SOURCE_TYPE.SINGLE ? SOURCE_TYPE.API_ASSET
      : record.source_type === SOURCE_TYPE.LINK ? SOURCE_TYPE.API_SCENARIO
        : record.source_type || SOURCE_TYPE.API_ASSET;
    const editValues = {
      ...defaultPlan,
      ...record,
      source_type: normalizedSourceType,
      case_list: toCaseKeys(record.case_list),
      load_mode: record.load_mode || LOAD_MODE.CONCURRENCY,
      load_config: {
        ...defaultPlan.load_config,
        ...safeJson(record.load_config, {}),
      },
      threshold_config: safeJson(record.threshold_config, defaultPlan.threshold_config),
      assertions_config: safeJson(record.assertions_config, []),
      parameter_config: {
        ...defaultPlan.parameter_config,
        ...safeJson(record.parameter_config, {}),
        setup_config: {
          ...defaultPlan.parameter_config.setup_config,
          ...(safeJson(record.parameter_config, {})?.setup_config || {}),
          case_list: toCaseKeys(safeJson(record.parameter_config, {})?.setup_config?.case_list),
        },
      },
      request_headers: prettyJson(record.request_headers),
      request_query: prettyJson(record.request_query),
      request_body: prettyJson(record.request_body, ''),
    };
    setVisible(true);
    setCurrentStep(0);
    await loadServices(record.project_id);
    await loadEndpoints(record.service_id);
    await loadVersions(record.endpoint_id);
    await loadCaseTree(record.project_id);
    await loadParameterFiles(record.project_id);
    await loadCasePreview(toCaseKeys(record.case_list));
    setParameterValidation(null);
    hydrateEditForm(editValues);
  };

  const onDelete = async (id) => {
    const res = await deletePerformancePlan({ id });
    if (auth.response(res, true)) {
      fetchPlans(1);
    }
  };

  const onExecute = async (id) => {
    const res = await executePerformancePlan({ id });
    if (auth.response(res, true)) {
      window.location.hash = '/performance/run';
    }
  };

  const onFollow = async (record, checked) => {
    const res = checked
      ? await followPerformancePlan({ id: record.id })
      : await unFollowPerformancePlan({ id: record.id });
    if (auth.response(res, true)) {
      fetchPlans(pagination.current);
    }
  };

  function buildSubmitPayload(values) {
    const payload = {
      ...values,
      case_list: values.source_type === SOURCE_TYPE.API_SCENARIO ? toCaseIdString(values.case_list) : '',
      load_config: values.load_config,
      threshold_config: (values.threshold_config || []).filter((item) => item?.metric && item?.operator && item?.value !== undefined),
      assertions_config: (values.assertions_config || []).filter((item) => item?.type && (item?.expected !== undefined || item?.path)),
      parameter_config: {
        ...(values.parameter_config || defaultPlan.parameter_config),
        setup_config: {
          ...(values.parameter_config?.setup_config || defaultPlan.parameter_config.setup_config),
          case_id: undefined,
          case_list: toCaseIdString(values.parameter_config?.setup_config?.case_list),
        },
      },
      request_headers: values.request_headers || '{}',
      request_query: values.request_query || '{}',
      request_body: values.request_body || '',
      expect_p95_ms: undefined,
      expect_error_rate: undefined,
    };

    payload.request_timeout_ms = Number(values.load_config?.request_timeout_ms || 10000);
    payload.duration_seconds = Number(values.load_config?.duration_seconds || 60);
    payload.iterations = Number(values.load_config?.iterations || 0);
    payload.ramp_up_seconds = Number(values.load_config?.ramp_up_seconds || 0);
    payload.think_time_ms = Number(values.load_config?.think_time_ms || 0);

    if (values.load_mode === LOAD_MODE.QPS) {
      payload.concurrency = Number(values.load_config?.max_concurrency || 20);
    } else {
      payload.concurrency = Number(values.load_config?.concurrency || 10);
    }

    const p95Rule = payload.threshold_config.find((item) => item.metric === 'p95_rt_ms' && item.operator === '<=');
    const errorRule = payload.threshold_config.find((item) => item.metric === 'error_rate' && item.operator === '<=');
    if (p95Rule) payload.expect_p95_ms = Number(p95Rule.value);
    if (errorRule) payload.expect_error_rate = Number(errorRule.value);

    if (values.source_type === SOURCE_TYPE.API_SCENARIO) {
      payload.request_method = 'LINK';
      payload.request_url = `接口用例链路（${payload.case_list.split(',').filter(Boolean).length}个用例）`;
      payload.service_id = 0;
      payload.endpoint_id = 0;
      payload.api_version_id = 0;
    }

    return payload;
  }

  const onSubmit = async (executeAfterSave = false) => {
    await editForm.validateFields();
    const values = editForm.getFieldsValue(true);
    const payload = buildSubmitPayload(values);
    setSubmitting(true);
    const action = payload.id ? updatePerformancePlan : insertPerformancePlan;
    const res = await action(payload);
    setSubmitting(false);
    if (auth.response(res, true)) {
      setVisible(false);
      const savedPlanId = payload.id || res?.data?.id;
      fetchPlans(payload.id ? pagination.current : 1);
      if (executeAfterSave && savedPlanId) {
        await onExecute(savedPlanId);
      }
    }
  };

  const stepFields = [
    ['name', 'project_id', 'env'],
    sourceType === SOURCE_TYPE.API_ASSET
      ? ['source_type', 'service_id', 'endpoint_id', 'api_version_id']
      : sourceType === SOURCE_TYPE.API_SCENARIO
        ? ['source_type', 'case_list']
        : ['source_type', 'request_method', 'request_url'],
    sourceType === SOURCE_TYPE.API_SCENARIO ? [] : ['request_method', 'request_url'],
    setupConfig?.enabled ? [['parameter_config', 'setup_config', 'case_list']] : [],
    loadMode === LOAD_MODE.QPS
      ? [
        ['load_config', 'target_qps'],
        ['load_config', 'max_concurrency'],
        ['load_config', 'duration_seconds'],
        ['load_config', 'request_timeout_ms'],
      ]
      : [
        ['load_config', 'concurrency'],
        ['load_config', 'duration_seconds'],
        ['load_config', 'request_timeout_ms'],
      ],
    [],
    [],
  ];

  const nextStep = async () => {
    await editForm.validateFields(stepFields[currentStep] || []);
    if (currentStep === 1 && sourceType === SOURCE_TYPE.API_ASSET) {
      const apiVersionId = editForm.getFieldValue('api_version_id');
      if (apiVersionId) {
        await fillSourceByVersion(apiVersionId);
      }
    }
    if (currentStep === 3) {
      const formValues = editForm.getFieldsValue(true);
      const res = await validatePerformancePlanParameters({
        source_type: formValues.source_type,
        request_url: formValues.request_url,
        request_headers: formValues.request_headers,
        request_query: formValues.request_query,
        request_body: formValues.request_body,
        case_list: toCaseIdString(formValues.case_list),
        parameter_config: formValues.parameter_config,
      });
      if (auth.response(res)) {
        setParameterValidation(res.data);
        if (!res.data?.valid) {
          message.warning('参数化校验未通过，请先修正变量配置');
          return;
        }
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  useEffect(() => {
    dispatch({ type: 'project/listProject' });
    dispatch({ type: 'gconfig/fetchEnvList', payload: { page: 1, size: 1000, exactly: true } });
    dispatch({ type: 'user/fetchUserList' });
    fetchPlans(1);
  }, []);

  useEffect(() => {
    loadCasePreview(selectedCases);
  }, [JSON.stringify(selectedCases)]);

  const columns = useMemo(() => [
    {
      title: '项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (value) => projectsMap[value] || `项目#${value}`,
    },
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span style={{ fontWeight: 600 }}>{value}</span>
            <Tag color="blue">{formatSourceType(record.source_type)}</Tag>
            <Tag color="purple">{formatLoadMode(record.load_mode)}</Tag>
          </Space>
          <span style={{ color: '#6b7280', fontSize: 12 }}>{record.request_url}</span>
        </Space>
      ),
    },
    {
      title: '执行环境',
      dataIndex: 'env',
      key: 'env',
      render: (value) => envMap[value] || `环境#${value}`,
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      key: 'source_type',
      render: (value) => formatSourceType(value),
    },
    {
      title: '负载模型',
      dataIndex: 'load_mode',
      key: 'load_mode',
      render: (value) => formatLoadMode(value),
    },
    {
      title: '执行配置',
      key: 'config',
      render: (_, record) => {
        const config = safeJson(record.load_config, {});
        return (
          <Space wrap>
            {record.load_mode === LOAD_MODE.QPS ? (
              <>
                <Tag color="gold">目标QPS {config.target_qps || '-'}</Tag>
                <Tag>最大并发 {config.max_concurrency || record.concurrency}</Tag>
              </>
            ) : (
              <Tag color="blue">并发 {config.concurrency || record.concurrency}</Tag>
            )}
            <Tag color="purple">时长 {(config.duration_seconds || record.duration_seconds || 0)}s</Tag>
          </Space>
        );
      },
    },
    {
      title: '创建人',
      dataIndex: 'create_user',
      key: 'create_user',
      render: (value) => <UserLink user={userMap[value]} />,
    },
    {
      title: '操作',
      key: 'operation',
        render: (_, record) => (
          <Space split={<span style={{ color: '#d1d5db' }}>|</span>}>
            <a onClick={() => openEdit(record)}>编辑</a>
            <a onClick={() => onExecute(record.id)}>执行</a>
            <Popconfirm title="确认删除这个压测计划？" onConfirm={() => onDelete(record.id)}>
              <a>删除</a>
            </Popconfirm>
          </Space>
      ),
    },
  ], [projectsMap, envMap, userMap]);

  const modalFooter = [
    currentStep > 0 ? <Button key="prev" onClick={previousStep} style={{ borderRadius: 999 }}>上一步</Button> : null,
    currentStep < 6 ? <Button key="next" type="primary" onClick={nextStep} style={{ borderRadius: 999 }}>下一步</Button> : null,
    currentStep === 6 ? (
      <Space key="submit">
        <Button onClick={() => onSubmit(false)} style={{ borderRadius: 999 }}>保存计划</Button>
        <Button onClick={() => onSubmit(true)} style={{ borderRadius: 999 }}>保存并执行</Button>
        <Button type="primary" loading={submitting} onClick={() => onSubmit(false)} style={{ borderRadius: 999, background: '#06b6d4', borderColor: '#06b6d4' }}>完成</Button>
      </Space>
    ) : null,
  ];

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div style={{ padding: '8px 0 24px', background: performancePalette.page, minHeight: 'calc(100vh - 120px)' }}>
        <PerformanceToolbar>
          <Form form={filterForm}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Form.Item label="项目" name="project_id" style={{ marginBottom: 0 }}>
                <Select allowClear placeholder="选择项目" style={{ width: 220 }}>
                  {projects.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item label="名称" name="name" style={{ marginBottom: 0 }}>
                <Input placeholder="输入计划名称" style={{ width: 220 }} />
              </Form.Item>
              <Form.Item label="创建人" name="create_user" style={{ marginBottom: 0 }}>
                <Select allowClear placeholder="选择创建人" style={{ width: 220 }}>
                  {Object.values(userMap).filter(Boolean).map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                </Select>
              </Form.Item>
              <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: 999, flexShrink: 0 }} onClick={() => fetchPlans(1)}>查询</Button>
              <Button icon={<ReloadOutlined />} style={{ borderRadius: 999, flexShrink: 0 }} onClick={() => {
                filterForm.resetFields();
                setTimeout(() => fetchPlans(1), 0);
              }}>重置</Button>
            </div>
          </Form>
        </PerformanceToolbar>

        <PerformanceDataTableCard>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16, marginBottom: 12 }}>
            <Button type="primary" onClick={openCreate}>
              <PlusOutlined /> 添加计划
            </Button>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={dataSource}
            loading={pageLoading}
            pagination={pagination}
            onChange={(pg) => fetchPlans(pg.current)}
          />
        </PerformanceDataTableCard>
      </div>

      <Modal
        title={editingId ? '编辑性能计划' : '新建性能计划'}
        open={visible}
        onCancel={() => {
          setVisible(false);
          setCurrentStep(0);
        }}
        width={1360}
        destroyOnClose
        footer={modalFooter}
        styles={{
          content: {
            borderRadius: 28,
            padding: 18,
            background: 'linear-gradient(180deg, #f3f7fc 0%, #edf3fb 100%)',
          },
          header: {
            background: 'transparent',
            paddingInline: 14,
            paddingTop: 10,
          },
          body: {
            paddingInline: 14,
            paddingBottom: 14,
          },
          footer: {
            paddingInline: 14,
            paddingBottom: 10,
          },
        }}
      >
        <Form form={editForm} layout="vertical" initialValues={defaultPlan}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <PerformanceModalFrame
            rail={(
              <div style={{ ...railPanelStyle, padding: 22 }}>
                <Steps
                  direction="vertical"
                  current={currentStep}
                  items={[
                    { title: '基础信息', description: '计划名、项目、环境' },
                    { title: '压测对象', description: '接口资产/接口场景/手动接口' },
                    { title: '请求配置', description: '请求快照与超时' },
                    { title: '参数化配置', description: '手动变量 / 文件变量 / 动态函数' },
                    { title: '负载模型', description: '并发或 QPS' },
                    { title: '阈值配置', description: 'SLA 与通过条件' },
                    { title: '确认执行', description: '保存前总览' },
                  ]}
                />
                <Divider />
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Alert type="info" showIcon message="支持接口资产、接口场景链路、手动接口，以及参数化变量和阈值校验。" />
                  <Card size="small" style={{ ...performanceInsetPanelStyle, borderRadius: 18 }}>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <span style={{ fontWeight: 600 }}>当前配置摘要</span>
                      <span style={{ color: '#475569' }}>基础信息：{planName ? '已完成' : '待填写'}</span>
                      <span style={{ color: '#475569' }}>压测对象：{formatSourceType(sourceType)}</span>
                      <span style={{ color: '#475569' }}>
                        参数化：{(editForm.getFieldValue(['parameter_config', 'manual_variables']) || []).length
                          + (editForm.getFieldValue(['parameter_config', 'file_variables']) || []).length > 0 ? '已配置' : '未配置'}
                      </span>
                      <span style={{ color: '#475569' }}>断言：{assertionsList.length || 0} 个</span>
                      <span style={{ color: '#475569' }}>负载模型：{formatLoadMode(loadMode)}</span>
                      <span style={{ color: '#475569' }}>阈值：{thresholdList.length || 0} 个</span>
                    </Space>
                  </Card>
                </Space>
              </div>
            )}
          >
              <div style={{ minHeight: 560 }}>
                {currentStep === 0 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <StepWorkspaceHeader
                      eyebrow="Step 1"
                      title="基础信息"
                      description="先定义这次压测归属哪个项目、在哪个环境执行，以及它的目标说明。"
                    />
                    <Card bordered={false} style={workspaceCardStyle}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
                            <Input placeholder="例如：登录服务稳定性压测" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择项目' }]}>
                            <Select
                              placeholder="选择项目"
                              onChange={async (value) => {
                                editForm.setFieldsValue({
                                  service_id: undefined,
                                  endpoint_id: undefined,
                                  api_version_id: undefined,
                                  case_list: [],
                                });
                                setEndpointOptions([]);
                                setVersionOptions([]);
                                await loadServices(value);
                                await loadCaseTree(value);
                                await loadParameterFiles(value);
                              }}
                            >
                              {projects.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="env" label="执行环境" rules={[{ required: true, message: '请选择环境' }]}>
                            <Select placeholder="选择环境">
                              {envList.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="enabled" label="启用计划" valuePropName="checked">
                            <Switch />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                    <Card bordered={false} style={workspaceMutedCardStyle}>
                      <Form.Item name="description" label="压测说明" style={{ marginBottom: 0 }}>
                        <TextArea rows={5} placeholder="描述压测目标、压测窗口、预估风险与回滚说明" />
                      </Form.Item>
                    </Card>
                  </Space>
                ) : null}

                {currentStep === 1 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <StepWorkspaceHeader
                      eyebrow="Step 2"
                      title="选择压测目标"
                      description="先决定这次压力打到哪里：复用接口资产、串联接口用例，或者临时构造一个自定义请求。"
                    />
                    <Card bordered={false} style={workspaceCardStyle}>
                      <Form.Item name="source_type" rules={[{ required: true, message: '请选择压测来源' }]} style={{ marginBottom: 0 }}>
                        <Radio.Group
                          style={{ width: '100%' }}
                          onChange={() => {
                            editForm.setFieldsValue({
                              case_list: [],
                              request_method: 'GET',
                              request_url: '',
                              service_id: undefined,
                              endpoint_id: undefined,
                              api_version_id: undefined,
                            });
                          }}
                        >
                          <Row gutter={16}>
                            {SOURCE_OPTIONS.map((item) => (
                              <Col span={8} key={item.value}>
                                <Radio value={item.value} style={{ display: 'block', width: '100%' }}>
                                  <SourceOptionCard item={item} active={sourceType === item.value} />
                                </Radio>
                              </Col>
                            ))}
                          </Row>
                        </Radio.Group>
                      </Form.Item>
                    </Card>

                    {sourceType === SOURCE_TYPE.API_ASSET ? (
                      <Card bordered={false} style={workspaceMutedCardStyle}>
                        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="从接口资产选择接口版本后，会自动带出请求快照。" />
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item name="service_id" label="接口服务" rules={[{ required: true, message: '请选择接口服务' }]}>
                              <Select
                                placeholder="选择服务"
                                onChange={async (value) => {
                                  editForm.setFieldsValue({ endpoint_id: undefined, api_version_id: undefined });
                                  setVersionOptions([]);
                                  await loadEndpoints(value);
                                }}
                              >
                                {serviceOptions.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item name="endpoint_id" label="接口" rules={[{ required: true, message: '请选择接口' }]}>
                              <Select
                                placeholder="选择接口"
                                onChange={async (value) => {
                                  editForm.setFieldsValue({ api_version_id: undefined });
                                  await loadVersions(value);
                                }}
                              >
                                {endpointOptions.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item name="api_version_id" label="接口版本" rules={[{ required: true, message: '请选择接口版本' }]}>
                              <Select placeholder="选择接口版本" onChange={fillSourceByVersion}>
                                {versionOptions.map((item) => <Option key={item.id} value={item.id}>{item.version_no || item.name || `v${item.id}`}</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ) : null}

                    {sourceType === SOURCE_TYPE.API_SCENARIO ? (
                      <Card bordered={false} style={workspaceMutedCardStyle}>
                        <Alert type="info" showIcon style={{ marginBottom: 16 }} message="链路压测会按你勾选的接口用例顺序执行，适合登录-下单-支付这类业务链路。" />
                        <Form.Item name="case_list" label="接口场景" rules={[{ required: true, message: '请选择接口用例链路' }]}>
                          <TreeSelect
                            treeData={selectableCaseTree}
                            treeCheckable
                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                            placeholder="从接口用例目录选择链路"
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 420, overflow: 'auto' }}
                            onChange={(values) => applyExpandedCaseSelection('case_list', values)}
                          />
                        </Form.Item>
                        <Tag color="geekblue">当前已选择 {selectedCaseCount} 个接口用例</Tag>
                      </Card>
                    ) : null}

                    {sourceType === SOURCE_TYPE.MANUAL ? (
                      <Card bordered={false} style={workspaceMutedCardStyle}>
                        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="手动接口适合做临时压测，仍然会保存请求快照，保证历史结果可复现。" />
                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item name="request_method" label="请求方式" rules={[{ required: true, message: '请选择请求方式' }]}>
                              <Select>
                                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((item) => <Option key={item} value={item}>{item}</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={18}>
                            <Form.Item name="request_url" label="请求地址" rules={[{ required: true, message: '请输入请求地址' }]}>
                              <Input placeholder="例如：https://api.example.com/order/create" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ) : null}
                  </Space>
                ) : null}

                {currentStep === 2 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <StepWorkspaceHeader
                      eyebrow="Step 3"
                      title="请求配置与断言"
                      description="这里决定请求快照、超时时间和断言策略。链路模式会直接复用接口用例的请求与断言。"
                    />
                    {sourceType === SOURCE_TYPE.API_SCENARIO ? (
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Card bordered={false} style={workspaceMutedCardStyle}>
                          <Alert type="success" showIcon style={{ marginBottom: 16 }} message="接口场景模式会复用接口用例里的请求配置、变量提取和断言，这里展示即将进入压测链路的请求快照。" />
                          <Descriptions column={1}>
                            <Descriptions.Item label="链路用例数">
                              {selectedCases.filter((item) => String(item).startsWith('testcase_')).length} 个
                            </Descriptions.Item>
                            <Descriptions.Item label="链路说明">
                              运行时按已选接口用例顺序串行执行，单个虚拟用户会复用前一步产出的变量。
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                        <Card title="链路请求快照" bordered={false} style={workspaceCardStyle}>
                          {casePreview.length ? (
                            <List
                              itemLayout="vertical"
                              dataSource={casePreview}
                              renderItem={(item) => (
                                <List.Item key={item.case_id}>
                                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Space wrap>
                                      <Tag color="blue">Step {item.step_order}</Tag>
                                      <Tag color="geekblue">{item.method || '-'}</Tag>
                                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                                    </Space>
                                    <Descriptions column={1} size="small">
                                      <Descriptions.Item label="请求地址">{item.url || '-'}</Descriptions.Item>
                                      <Descriptions.Item label="请求头">
                                        <pre style={previewCodeStyle}>{formatPreviewText(item.headers)}</pre>
                                      </Descriptions.Item>
                                      <Descriptions.Item label="请求体">
                                        <pre style={previewCodeStyle}>{formatPreviewText(item.body)}</pre>
                                      </Descriptions.Item>
                                      <Descriptions.Item label="提取变量">
                                        {(item.extractors || []).length
                                          ? (item.extractors || []).map((extractor) => extractor.name).join('、')
                                          : '无'}
                                      </Descriptions.Item>
                                    </Descriptions>
                                  </Space>
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Alert type="warning" showIcon message="当前未拿到接口用例链路快照，请先确认已选择有效用例。" />
                          )}
                        </Card>
                      </Space>
                    ) : (
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Card bordered={false} style={workspaceCardStyle}>
                        <Row gutter={16}>
                          <Col span={6}>
                            <Form.Item name="request_method" label="请求方式" rules={[{ required: true, message: '请选择请求方式' }]}>
                              <Select>
                                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((item) => <Option key={item} value={item}>{item}</Option>)}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={18}>
                            <Form.Item name="request_url" label="请求地址" rules={[{ required: true, message: '请输入请求地址' }]}>
                              <Input placeholder="输入要压测的完整地址" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item name="request_headers" label="请求头(JSON)">
                          <TextArea rows={4} placeholder='{"Authorization": "Bearer xxx"}' />
                        </Form.Item>
                        <Form.Item name="request_query" label="Query 参数(JSON)">
                          <TextArea rows={3} placeholder='{"page": 1, "size": 20}' />
                        </Form.Item>
                        <Form.Item name="request_body" label="请求体(JSON 或原始文本)">
                          <TextArea rows={6} placeholder='{"name": "demo"}' />
                        </Form.Item>
                        </Card>
                        <Card title="响应断言" bordered={false} style={workspaceMutedCardStyle}>
                          <Alert type="info" showIcon style={{ marginBottom: 12 }} message="断言失败会按失败请求计入报告，可直接用于错误率和断言失败数阈值校验。" />
                          <Form.List name="assertions_config">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map((field) => (
                                  <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                                    <Row gutter={12}>
                                      <Col span={5}>
                                        <Form.Item {...field} name={[field.name, 'type']} label="断言类型">
                                          <Select placeholder="选择类型">
                                            {ASSERTION_TYPES.map((item) => (
                                              <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                          </Select>
                                        </Form.Item>
                                      </Col>
                                      <Col span={5}>
                                        <Form.Item {...field} name={[field.name, 'name']} label="名称">
                                          <Input placeholder="例如：状态码=200" />
                                        </Form.Item>
                                      </Col>
                                      <Col span={4}>
                                        <Form.Item {...field} name={[field.name, 'operator']} label="比较符">
                                          <Select placeholder="比较符">
                                            {['=', '<', '<=', '>', '>=', 'contains'].map((item) => (
                                              <Option key={item} value={item}>{item}</Option>
                                            ))}
                                          </Select>
                                        </Form.Item>
                                      </Col>
                                      <Col span={5}>
                                        <Form.Item {...field} name={[field.name, 'path']} label="路径 / Header">
                                          <Input placeholder="$.data.code / Content-Type" />
                                        </Form.Item>
                                      </Col>
                                      <Col span={4}>
                                        <Form.Item {...field} name={[field.name, 'expected']} label="期望值">
                                          <Input placeholder="200 / success" />
                                        </Form.Item>
                                      </Col>
                                      <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                      </Col>
                                    </Row>
                                  </Card>
                                ))}
                                <Button onClick={() => add({ type: 'status_code', operator: '=', expected: '200' })}>添加断言</Button>
                              </>
                            )}
                          </Form.List>
                        </Card>
                      </Space>
                    )}
                  </Space>
                ) : null}

                {currentStep === 3 ? (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="支持全局预置、全局请求头、手动变量、CSV 文件变量和内置动态函数。变量可在 URL、Header、Query、Body 中通过 ${变量名} 引用。"
                    />
                    <Card title="全局预置" size="small" style={{ marginBottom: 16 }}>
                      <Space direction="vertical" size={14} style={{ width: '100%' }}>
                        <Alert
                          type="warning"
                          showIcon
                          message="推荐把登录、签名换取、一次性初始化这类请求放到全局预置里，而不是放进正式并发链路。这样可以避免每个并发循环重复登录，尤其适合“新 token 会顶掉旧 token”的业务系统。"
                        />
                        <Row gutter={12}>
                          <Col span={5}>
                            <Form.Item name={['parameter_config', 'setup_config', 'enabled']} label="启用预置" valuePropName="checked">
                              <Switch />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item name={['parameter_config', 'setup_config', 'scope']} label="执行范围">
                              <Select disabled={!setupConfig?.enabled}>
                                <Option value={SETUP_SCOPE.PER_RUN}>整次执行一次</Option>
                                <Option value={SETUP_SCOPE.PER_WORKER}>每并发用户一次</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <div style={{ color: '#64748b', lineHeight: 1.8, paddingTop: 30 }}>
                              {setupConfig?.scope === SETUP_SCOPE.PER_WORKER
                                ? '每个并发用户先拿自己的会话，再开始压测。'
                                : '整次压测先拿一次公共会话，后续所有并发复用。'}
                            </div>
                          </Col>
                        </Row>
                        <Form.Item
                          name={['parameter_config', 'setup_config', 'case_list']}
                          label="预置接口链"
                          rules={setupConfig?.enabled ? [{ required: true, message: '请选择预置接口链' }] : []}
                        >
                          <TreeSelect
                            treeData={selectableCaseTree}
                            treeCheckable
                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                            placeholder="选择登录 -> 鉴权 -> 初始化等预置接口，按顺序执行"
                            allowClear
                            multiple
                            onChange={(values) => applyExpandedCaseSelection(['parameter_config', 'setup_config', 'case_list'], values)}
                          />
                        </Form.Item>
                        <Alert
                          type="info"
                          showIcon
                          message="预置接口链支持勾选多个接口，并按勾选顺序有序执行，前一步提取的变量会自动传给后一步，适合登录 -> 切租户 -> 初始化这类依赖场景。"
                        />
                      </Space>
                    </Card>
                    <Row gutter={16}>
                      <Col span={14}>
                        <Card title="全局请求头" size="small" style={{ marginBottom: 16 }}>
                          <Form.List name={['parameter_config', 'global_headers']}>
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map((field) => (
                                  <Row gutter={12} key={field.key} align="middle">
                                    <Col span={6}>
                                      <Form.Item {...field} name={[field.name, 'name']} label="Header">
                                        <Input placeholder="Authorization" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={10}>
                                      <Form.Item {...field} name={[field.name, 'value']} label="值">
                                        <Input placeholder="Bearer ${token}" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={5}>
                                      <Form.Item {...field} name={[field.name, 'description']} label="说明">
                                        <Input placeholder="全局 token / 租户头" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={2}>
                                      <Form.Item {...field} name={[field.name, 'enabled']} label="启用" valuePropName="checked">
                                        <Switch />
                                      </Form.Item>
                                    </Col>
                                    <Col span={1}>
                                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                    </Col>
                                  </Row>
                                ))}
                                <Button onClick={() => add({ enabled: true })}>添加全局请求头</Button>
                              </>
                            )}
                          </Form.List>
                        </Card>
                        <Card title="手动变量" size="small" style={{ marginBottom: 16 }}>
                          <Form.List name={['parameter_config', 'manual_variables']}>
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map((field) => (
                                  <Row gutter={12} key={field.key} align="middle">
                                    <Col span={6}>
                                      <Form.Item {...field} name={[field.name, 'name']} label="变量名">
                                        <Input placeholder="tenantId" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                      <Form.Item {...field} name={[field.name, 'value']} label="变量值">
                                        <Input placeholder="308" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                      <Form.Item {...field} name={[field.name, 'description']} label="说明">
                                        <Input placeholder="变量用途" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={2}>
                                      <Form.Item {...field} name={[field.name, 'enabled']} label="启用" valuePropName="checked">
                                        <Switch />
                                      </Form.Item>
                                    </Col>
                                    <Col span={2}>
                                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                                    </Col>
                                  </Row>
                                ))}
                                <Button onClick={() => add({ enabled: true })}>添加手动变量</Button>
                              </>
                            )}
                          </Form.List>
                        </Card>

                        <Card title="文件变量" size="small">
                          <Space style={{ marginBottom: 12 }}>
                            <Button icon={<ReloadOutlined />} onClick={() => loadParameterFiles(editForm.getFieldValue('project_id'))}>
                              获取OSS存储CSV文件
                            </Button>
                          </Space>
                          <Form.List name={['parameter_config', 'file_variables']}>
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map((field) => (
                                  <Card key={field.key} size="small" style={{ marginBottom: 12, background: '#fafcff' }}>
                                    <Row gutter={12}>
                                      <Col span={24}>
                                        <Form.Item {...field} name={[field.name, 'file_id']} label="参数文件">
                                          <Select
                                            showSearch
                                            style={{ width: '100%' }}
                                            placeholder="选择CSV"
                                            optionFilterProp="label"
                                            optionLabelProp="label"
                                            dropdownMatchSelectWidth={false}
                                            onChange={loadParameterPreview}
                                          >
                                            {parameterFiles.map((item) => (
                                              <Option
                                                key={item.id}
                                                value={item.id}
                                                label={item.option_label}
                                              >
                                                {item.option_type === 'bucket'
                                                  ? item.file_path
                                                  : `[历史参数文件] ${item.option_label} (${item.row_count})`}
                                              </Option>
                                            ))}
                                          </Select>
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                    <Row gutter={12}>
                                      <Col span={8}>
                                        <Form.Item {...field} name={[field.name, 'read_mode']} label="读取策略">
                                          <Select>
                                            <Option value="CIRCULAR">循环读取</Option>
                                            <Option value="SEQUENTIAL">顺序读取</Option>
                                            <Option value="RANDOM">随机读取</Option>
                                          </Select>
                                        </Form.Item>
                                      </Col>
                                      <Col span={4}>
                                        <Form.Item {...field} name={[field.name, 'enabled']} label="启用" valuePropName="checked">
                                          <Switch />
                                        </Form.Item>
                                      </Col>
                                      <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Space>
                                          <Button type="text" onClick={() => loadParameterPreview(editForm.getFieldValue(['parameter_config', 'file_variables', field.name, 'file_id']))}>预览</Button>
                                          <Button type="text" danger onClick={() => remove(field.name)}>移除</Button>
                                        </Space>
                                      </Col>
                                    </Row>
                                  </Card>
                                ))}
                                <Button onClick={() => add({ read_mode: 'CIRCULAR', enabled: true })}>添加文件变量</Button>
                              </>
                            )}
                          </Form.List>
                        </Card>
                      </Col>
                      <Col span={10}>
                        <Card title="参数引用说明" size="small" style={{ marginBottom: 16 }}>
                          <List
                            size="small"
                            dataSource={[
                              '全局预置推荐优先选择“整次执行一次”，适合共享 token、一次性登录和新 token 会顶掉旧 token 的系统。',
                              '如果每个并发用户必须拿自己的账号态，再改用“每并发用户一次”。',
                              '全局请求头会自动注入正式压测请求；同名请求头以接口自身配置为准。',
                              '环境变量 > 手动变量 > 文件变量 > 内置函数 > 链路提取变量',
                              '全局请求头示例：Authorization = Bearer ${token}',
                              'Body 示例：{"tenantId":"${tenantId}","traceId":"${__uuid()}"}',
                              'Header 示例：{"Authorization":"Bearer ${token}"}',
                              '支持内置函数：${__uuid()}、${__timestamp()}、${__datetime()}、${__randomInt(1,100)}、${__randomString(8)}',
                            ]}
                            renderItem={(item) => <List.Item>{item}</List.Item>}
                          />
                        </Card>
                        {parameterPreview ? (
                          <Card title="文件预览" size="small" style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 8, color: '#64748b' }}>字段：{(parameterPreview.columns || []).join('、') || '-'}</div>
                            <pre style={{ maxHeight: 240, overflow: 'auto', margin: 0, fontSize: 12 }}>
                              {JSON.stringify(parameterPreview.rows || [], null, 2)}
                            </pre>
                          </Card>
                        ) : null}
                        {parameterValidation ? (
                          <Card title="参数使用检测" size="small">
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                              <Tag color={parameterValidation.valid ? 'success' : 'error'}>
                                {parameterValidation.valid ? '校验通过' : '校验未通过'}
                              </Tag>
                              {!!parameterValidation.errors?.length && (
                                <Alert type="error" showIcon message={parameterValidation.errors.join('；')} />
                              )}
                              {!!parameterValidation.warnings?.length && (
                                <Alert type="warning" showIcon message={parameterValidation.warnings.join('；')} />
                              )}
                              <div style={{ color: '#64748b', fontSize: 12 }}>
                                已检测变量：{(parameterValidation.references || []).join('、') || '无'}
                              </div>
                            </Space>
                          </Card>
                        ) : null}
                      </Col>
                    </Row>
                  </>
                ) : null}

                {currentStep === 4 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <StepWorkspaceHeader
                      eyebrow="Step 5"
                      title="负载模型"
                      description="定义压测节奏。这里更像是在配置一条负载曲线，而不是填几项数字。"
                    />
                    <Card bordered={false} style={workspaceCardStyle}>
                    <Form.Item name="load_mode" label="负载模型" style={{ marginBottom: 0 }}>
                      <Radio.Group optionType="button" buttonStyle="solid">
                        <Radio.Button value={LOAD_MODE.CONCURRENCY}><LineChartOutlined /> 并发模式</Radio.Button>
                        <Radio.Button value={LOAD_MODE.QPS}><ThunderboltOutlined /> QPS 模式</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    </Card>

                    {loadMode === LOAD_MODE.CONCURRENCY ? (
                      <Card bordered={false} style={workspaceMutedCardStyle}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'concurrency']} label="并发用户数" rules={[{ required: true, message: '请输入并发用户数' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'ramp_up_seconds']} label="启动时间 Ramp-up">
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'duration_seconds']} label="持续时间(秒)" rules={[{ required: true, message: '请输入持续时间' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'iterations']} label="总次数(0为按时长)">
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'think_time_ms']} label="Think Time(ms)">
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'request_timeout_ms']} label="超时(ms)" rules={[{ required: true, message: '请输入超时时间' }]}>
                            <InputNumber min={1000} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      </Card>
                    ) : (
                      <Card bordered={false} style={workspaceMutedCardStyle}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'target_qps']} label="目标 QPS" rules={[{ required: true, message: '请输入目标 QPS' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'max_concurrency']} label="最大并发" rules={[{ required: true, message: '请输入最大并发' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'duration_seconds']} label="持续时间(秒)" rules={[{ required: true, message: '请输入持续时间' }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'iterations']} label="总次数(0为按时长)">
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name={['load_config', 'request_timeout_ms']} label="超时(ms)" rules={[{ required: true, message: '请输入超时时间' }]}>
                            <InputNumber min={1000} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Card size="small" style={{ background: '#f8fbff', borderColor: '#dbe7ff' }}>
                            <Space direction="vertical" size={4}>
                              <span style={{ fontWeight: 600 }}>QPS 说明</span>
                              <span style={{ color: '#6b7280', fontSize: 12 }}>系统会在最大并发上限内，尽量按目标 QPS 进行节流发压。</span>
                            </Space>
                          </Card>
                        </Col>
                      </Row>
                      </Card>
                    )}
                  </Space>
                ) : null}

                {currentStep === 5 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <StepWorkspaceHeader
                      eyebrow="Step 6"
                      title="阈值配置"
                      description="这一步决定报告如何判定通过与失败，是性能测试最关键的验收标准。"
                    />
                    <Card bordered={false} style={workspaceMutedCardStyle}>
                    <Alert type="info" showIcon style={{ marginBottom: 16 }} message="阈值决定报告是否通过。你可以同时配置响应时间、TPS、错误率和成功率。" />
                    <Form.List name="threshold_config">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field) => (
                            <Card key={field.key} size="small" style={{ marginBottom: 12 }}>
                              <Row gutter={12}>
                                <Col span={7}>
                                  <Form.Item {...field} name={[field.name, 'metric']} label="指标" rules={[{ required: true, message: '请选择指标' }]}>
                                    <Select placeholder="选择指标">
                                      {THRESHOLD_METRICS.map((item) => <Option key={item.value} value={item.value}>{item.label}</Option>)}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={5}>
                                  <Form.Item {...field} name={[field.name, 'operator']} label="比较符" rules={[{ required: true, message: '请选择比较符' }]}>
                                    <Select placeholder="比较符">
                                      {THRESHOLD_OPERATORS.map((item) => <Option key={item} value={item}>{item}</Option>)}
                                    </Select>
                                  </Form.Item>
                                </Col>
                                <Col span={7}>
                                  <Form.Item {...field} name={[field.name, 'value']} label="目标值" rules={[{ required: true, message: '请输入目标值' }]}>
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                  </Form.Item>
                                </Col>
                                <Col span={5}>
                                  <Form.Item {...field} name={[field.name, 'label']} label="展示名称">
                                    <Input placeholder="例如 P95" />
                                  </Form.Item>
                                </Col>
                              </Row>
                              <Button danger type="link" onClick={() => remove(field.name)}>删除阈值</Button>
                            </Card>
                          ))}
                          <Button onClick={() => add({ metric: 'p95_rt_ms', label: 'P95', operator: '<=', value: 1000 })}>
                            添加阈值
                          </Button>
                        </>
                      )}
                    </Form.List>
                    </Card>
                  </Space>
                ) : null}

                {currentStep === 6 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <StepWorkspaceHeader
                      eyebrow="Step 7"
                      title="确认执行"
                      description="最后确认计划快照、阈值、链路和负载模型，确保这次执行结果是可复现、可追溯的。"
                    />
                    <Alert
                      showIcon
                      type="info"
                      style={executionGuardrailStyle}
                      message="执行保护"
                      description="保存并执行后会创建后台任务并立即返回，性能任务在独立队列中按服务端并发门闩执行。调度、报告列表和平台其他页面不会等待压测主循环结束。"
                    />
                  <Card bordered={false} style={workspaceMutedCardStyle}>
                    <Descriptions column={2} title="执行确认">
                      <Descriptions.Item label="计划名称">{submitPreview.name || planName || '-'}</Descriptions.Item>
                      <Descriptions.Item label="所属项目">{projectsMap[submitPreview.project_id] || projectsMap[projectId] || '-'}</Descriptions.Item>
                      <Descriptions.Item label="执行环境">{envMap[submitPreview.env] || envMap[envId] || '-'}</Descriptions.Item>
                      <Descriptions.Item label="压测来源">{formatSourceType(sourceType)}</Descriptions.Item>
                      <Descriptions.Item label="来源对象">
                        {sourceType === SOURCE_TYPE.API_ASSET
                          ? [selectedServiceName, selectedEndpointName, selectedVersionName].filter(Boolean).join(' / ') || '未选择接口资产'
                          : sourceType === SOURCE_TYPE.API_SCENARIO
                            ? `已选择 ${selectedCaseCount} 个接口用例`
                            : '手动填写接口'}
                      </Descriptions.Item>
                      <Descriptions.Item label="请求方式">
                        {sourceType === SOURCE_TYPE.API_SCENARIO ? '复用接口用例请求配置' : requestMethod || submitPreview.request_method || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="请求地址">
                        {sourceType === SOURCE_TYPE.API_SCENARIO ? submitPreview.request_url : requestUrl || submitPreview.request_url || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="负载模型">{formatLoadMode(loadMode)}</Descriptions.Item>
                      <Descriptions.Item label="负载配置">
                        {loadMode === LOAD_MODE.QPS
                          ? `目标QPS ${loadConfig.target_qps || '-'} / 最大并发 ${loadConfig.max_concurrency || '-'} / 时长 ${loadConfig.duration_seconds || '-'}s / 超时 ${loadConfig.request_timeout_ms || '-'}ms`
                          : `并发 ${loadConfig.concurrency || '-'} / 时长 ${loadConfig.duration_seconds || '-'}s / Ramp-up ${loadConfig.ramp_up_seconds || 0}s / Think Time ${loadConfig.think_time_ms || 0}ms`}
                      </Descriptions.Item>
                      <Descriptions.Item label="阈值配置">{thresholdSummary || '未配置阈值'}</Descriptions.Item>
                      <Descriptions.Item label="断言配置">
                        {sourceType === SOURCE_TYPE.API_SCENARIO
                          ? '复用接口用例断言'
                          : `${(submitPreview.assertions_config || []).length} 个响应断言`}
                      </Descriptions.Item>
                      <Descriptions.Item label="参数化配置">
                        手动变量 {(submitPreview.parameter_config?.manual_variables || []).filter((item) => item?.enabled !== false).length} 个，
                        文件变量 {(submitPreview.parameter_config?.file_variables || []).filter((item) => item?.enabled !== false).length} 个
                      </Descriptions.Item>
                      <Descriptions.Item label="全局预置">
                        {submitPreview.parameter_config?.setup_config?.enabled
                          ? `${submitPreview.parameter_config?.setup_config?.scope === SETUP_SCOPE.PER_WORKER ? '每并发用户一次' : '整次执行一次'} / 预置接口链`
                          : '未启用'}
                      </Descriptions.Item>
                      <Descriptions.Item label="全局请求头">
                        {(submitPreview.parameter_config?.global_headers || []).filter((item) => item?.enabled !== false).length} 个
                      </Descriptions.Item>
                      <Descriptions.Item label="链路预览">
                        {sourceType === SOURCE_TYPE.API_SCENARIO
                          ? `${casePreview.length} 个步骤，支持提取变量与顺序执行`
                          : '单接口压测'}
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">{editForm.getFieldValue('enabled') ? '启用' : '停用'}</Descriptions.Item>
                    </Descriptions>
                    {sourceType === SOURCE_TYPE.API_SCENARIO && casePreview.length ? (
                      <Card size="small" title="链路步骤预览" style={{ marginTop: 16 }}>
                        <List
                          size="small"
                          dataSource={casePreview}
                          renderItem={(item) => (
                            <List.Item>
                              <Space direction="vertical" size={2}>
                                <span>{item.step_order}. {item.name}</span>
                                <span style={{ color: '#64748b', fontSize: 12 }}>{item.method} {item.url}</span>
                                <span style={{ color: '#64748b', fontSize: 12 }}>
                                  提取变量：{(item.extractors || []).map((extractor) => extractor.name).join('、') || '无'}
                                </span>
                              </Space>
                            </List.Item>
                          )}
                        />
                      </Card>
                    ) : null}
                  </Card>
                  </Space>
                ) : null}
              </div>
          </PerformanceModalFrame>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default connect(({ project, gconfig, user, loading }) => ({
  project,
  gconfig,
  user,
  loading,
}))(PlanList);
