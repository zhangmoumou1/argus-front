import React from 'react';
import { Badge, Button, Card, Segmented, Space, Tag, Tooltip } from 'antd';
import {
  ReloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  MinusCircleFilled,
  ClockCircleFilled,
  SyncOutlined,
  ThunderboltFilled,
  EyeFilled,
  CodeFilled,
  PlayCircleFilled,
  BugFilled,
  FileTextFilled,
  VideoCameraFilled,
  CameraFilled,
  LinkOutlined,
  CloudServerOutlined,
  DatabaseFilled,
  RocketFilled,
  ExperimentFilled,
  ScheduleOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import {
  PerformanceDataTableCard,
  performanceInsetPanelStyle,
} from '@/pages/Performance/ModuleShell';

/* ────────────────────────────── palette ────────────────────────────── */

export const uiPalette = {
  page: 'linear-gradient(180deg, #f5f7fb 0%, #edf2f7 100%)',
  primary: '#2563eb',
  accent: '#0f766e',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  text: '#0f172a',
  subtle: '#64748b',
  border: 'rgba(148, 163, 184, 0.22)',
  cardBg: '#ffffff',
};

const panelBorder = `1px solid ${uiPalette.border}`;
const softShadow = '0 8px 22px rgba(15, 23, 42, 0.06)';
const radius = 8;

const UI_TEST_PROJECT_STORAGE_KEY = 'argus.ui_test.project_id';
const UI_TEST_PROJECT_EVENT = 'argus:ui-test-project-change';

export const normalizeUiTestProjectId = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const text = String(value);
  const numeric = Number(text);
  return Number.isFinite(numeric) && String(numeric) === text ? numeric : value;
};

export const readUiTestProjectId = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    return normalizeUiTestProjectId(window.localStorage.getItem(UI_TEST_PROJECT_STORAGE_KEY));
  } catch {
    return undefined;
  }
};

export const writeUiTestProjectId = (value) => {
  const nextProjectId = normalizeUiTestProjectId(value);
  if (typeof window !== 'undefined') {
    try {
      if (nextProjectId === undefined) {
        window.localStorage.removeItem(UI_TEST_PROJECT_STORAGE_KEY);
      } else {
        window.localStorage.setItem(UI_TEST_PROJECT_STORAGE_KEY, String(nextProjectId));
      }
      window.dispatchEvent(new CustomEvent(UI_TEST_PROJECT_EVENT, { detail: nextProjectId }));
    } catch {
      // localStorage may be blocked; keep React state usable.
    }
  }
  return nextProjectId;
};

export const pickUiTestProjectId = (projects = [], currentProjectId) => {
  if (!projects.length) return undefined;
  const current = normalizeUiTestProjectId(currentProjectId);
  if (current !== undefined && projects.some((item) => String(item.id) === String(current))) {
    return current;
  }
  const persisted = readUiTestProjectId();
  if (persisted !== undefined && projects.some((item) => String(item.id) === String(persisted))) {
    return persisted;
  }
  return projects[0].id;
};

export const getUiTestProjectSelectValue = (projects = [], projectId) => {
  const normalizedProjectId = normalizeUiTestProjectId(projectId);
  if (normalizedProjectId === undefined) return undefined;
  return projects.some((item) => String(item.id) === String(normalizedProjectId))
    ? normalizedProjectId
    : undefined;
};

export const useUiTestProject = () => {
  const [projectId, setProjectIdState] = React.useState(() => readUiTestProjectId());

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleProjectChange = (event) => {
      setProjectIdState(normalizeUiTestProjectId(event.detail));
    };
    const handleStorageChange = (event) => {
      if (event.key === UI_TEST_PROJECT_STORAGE_KEY) {
        setProjectIdState(normalizeUiTestProjectId(event.newValue));
      }
    };
    window.addEventListener(UI_TEST_PROJECT_EVENT, handleProjectChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(UI_TEST_PROJECT_EVENT, handleProjectChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setProjectId = React.useCallback((value) => {
    setProjectIdState(writeUiTestProjectId(value));
  }, []);

  return [projectId, setProjectId];
};

/* ────────────────────────────── status helpers ────────────────────────────── */

const statusConfig = {
  valid:            { color: uiPalette.success, icon: <CheckCircleFilled />,      label: '可执行' },
  invalid_ui_node:  { color: uiPalette.error,   icon: <CloseCircleFilled />,      label: '校验失败' },
  empty_ui_node:    { color: uiPalette.warning,  icon: <ExclamationCircleFilled />, label: '空节点' },
  no_ui_node:       { color: '#94a3b8',          icon: <MinusCircleFilled />,      label: '无 UI 节点' },
  queued:           { color: '#94a3b8',          icon: <ClockCircleFilled />,      label: '排队中' },
  claimed:          { color: uiPalette.info,     icon: <SyncOutlined spin />,      label: '已领取' },
  running:          { color: uiPalette.info,     icon: <SyncOutlined spin />,      label: '运行中' },
  uploading:        { color: uiPalette.warning,  icon: <SyncOutlined spin />,      label: '产物处理中' },
  success:          { color: uiPalette.success,  icon: <CheckCircleFilled />,      label: '成功' },
  failed:           { color: uiPalette.error,    icon: <CloseCircleFilled />,      label: '失败' },
  cancelled:        { color: '#64748b',          icon: <MinusCircleFilled />,      label: '已停止' },
  skipped:          { color: uiPalette.warning,  icon: <ExclamationCircleFilled />, label: '跳过' },
  enabled:          { color: uiPalette.success,  icon: <CheckCircleFilled />,      label: '启用' },
  disabled:         { color: '#94a3b8',          icon: <MinusCircleFilled />,      label: '停用' },
};

export const uiStatusTag = (status) => {
  const cfg = statusConfig[status];
  if (!cfg) return <Tag>{status || '-'}</Tag>;
  return (
    <Tag
      icon={cfg.icon}
      color={cfg.color}
      style={{ borderRadius: 6, fontWeight: 500, border: 'none' }}
    >
      {cfg.label}
    </Tag>
  );
};

export const uiStatusBadge = (status) => {
  const cfg = statusConfig[status];
  if (!cfg) return <Badge status="default" text={status || '-'} />;
  const badgeStatus = ['success', 'valid'].includes(status) ? 'success'
    : ['failed', 'invalid_ui_node'].includes(status) ? 'error'
    : ['running', 'claimed', 'uploading'].includes(status) ? 'processing'
    : ['empty_ui_node', 'skipped'].includes(status) ? 'warning'
    : status === 'cancelled' ? 'default'
    : 'default';
  return <Badge status={badgeStatus} text={cfg.label} />;
};

/* ────────────────────────────── action type helpers ────────────────────────────── */

const stepTypeConfig = {
  open:          { color: uiPalette.info,    icon: <LinkOutlined />,        label: '打开' },
  click:         { color: uiPalette.primary, icon: <ThunderboltFilled />,   label: '点击' },
  input:         { color: uiPalette.cyan,    icon: <CodeFilled />,          label: '输入' },
  select:        { color: uiPalette.purple,  icon: <CodeFilled />,          label: '选择' },
  assert_exists: { color: uiPalette.success, icon: <EyeFilled />,           label: '断言存在' },
  assert_not_exists: { color: uiPalette.warning, icon: <EyeFilled />,       label: '断言不存在' },
  assert_text:   { color: uiPalette.success, icon: <FileTextFilled />,      label: '断言文本' },
  extract_text:  { color: uiPalette.purple,  icon: <DatabaseFilled />,      label: '提取' },
  screenshot:    { color: uiPalette.cyan,    icon: <CameraFilled />,        label: '截图' },
  wait_exists:   { color: uiPalette.info,    icon: <ClockCircleFilled />,   label: '等待出现' },
  wait_not_exists: { color: uiPalette.warning, icon: <ClockCircleFilled />, label: '等待消失' },
};

export const stepTypeTag = (type) => {
  const cfg = stepTypeConfig[type];
  if (!cfg) return <Tag>{type || '-'}</Tag>;
  return (
    <Tag
      icon={cfg.icon}
      color={cfg.color}
      style={{ borderRadius: 6, fontWeight: 500, border: 'none' }}
    >
      {cfg.label}
    </Tag>
  );
};

/* ────────────────────────────── page wrapper ────────────────────────────── */

const moduleNavItems = [
  {
    label: '用例库',
    value: '/ui-test/cases',
    icon: <FileTextFilled />,
    match: (pathname) => pathname.startsWith('/ui-test/cases'),
  },
  {
    label: '测试计划',
    value: '/ui-test/plans',
    icon: <ScheduleOutlined />,
    match: (pathname) => pathname.startsWith('/ui-test/plans'),
  },
  {
    label: '执行报告',
    value: '/ui-test/runs',
    icon: <RocketFilled />,
    match: (pathname) => pathname.startsWith('/ui-test/runs'),
  },
];

export const UiTestPage = ({ toolbar, children, extra }) => {
  const location = useLocation();
  const activeNav = moduleNavItems.find((item) => item.match(location.pathname))?.value || '/ui-test/cases';

  return (
    <PageContainer
      title={false}
      breadcrumb={null}
      style={{
        background: uiPalette.page,
        minHeight: 'calc(100vh - 56px)',
        paddingBottom: 24,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          borderRadius: radius,
          border: panelBorder,
          boxShadow: softShadow,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Space wrap size={[10, 10]} style={{ flex: '1 1 420px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: uiPalette.text }}>UI 自动化</span>
          <Segmented
            value={activeNav}
            onChange={(value) => history.push(value)}
            options={moduleNavItems.map((item) => ({
              value: item.value,
              label: (
                <Space size={6}>
                  {item.icon}
                  <span>{item.label}</span>
                </Space>
              ),
            }))}
          />
        </Space>
        {extra ? <Space wrap>{extra}</Space> : null}
      </div>
      {toolbar ? (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: radius,
            border: panelBorder,
            boxShadow: softShadow,
            background: '#fff',
          }}
        >
          {toolbar}
        </div>
      ) : null}
      {children}
    </PageContainer>
  );
};

/* ────────────────────────────── cards ────────────────────────────── */

export const SectionCard = ({ title, description, extra, children, style: extraStyle }) => (
  <div
    style={{
      border: panelBorder,
      borderRadius: radius,
      boxShadow: softShadow,
      overflow: 'hidden',
      marginBottom: 20,
      background: '#fff',
      ...extraStyle,
    }}
  >
    <PerformanceDataTableCard title={title} description={description} extra={extra}>
      {children}
    </PerformanceDataTableCard>
  </div>
);

export const InsetCard = ({ title, actions, children, compact = false, icon }) => (
  <Card
    bordered={false}
    bodyStyle={{ padding: compact ? 14 : 18 }}
    style={{
      ...performanceInsetPanelStyle,
      height: '100%',
      borderRadius: radius,
      border: panelBorder,
      boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
      background: uiPalette.cardBg,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: compact ? 10 : 14,
        gap: 12,
      }}
    >
      <Space size={8}>
        {icon ? <span style={{ color: uiPalette.primary, fontSize: 18 }}>{icon}</span> : null}
        <span style={{ fontSize: compact ? 15 : 16, fontWeight: 700, color: uiPalette.text }}>{title}</span>
      </Space>
      {actions}
    </div>
    {children}
  </Card>
);

/* ────────────────────────────── small widgets ────────────────────────────── */

export const RefreshButton = ({ onClick, loading, text = '刷新' }) => (
  <Button icon={<ReloadOutlined />} onClick={onClick} loading={loading} style={{ borderRadius: radius }}>
    {text}
  </Button>
);

export const PillButton = ({ children, ...rest }) => (
  <Button style={{ borderRadius: radius }} {...rest}>
    {children}
  </Button>
);

export const Kv = ({ label, value, icon }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ color: uiPalette.subtle, fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon}
      {label}
    </div>
    <div style={{ color: uiPalette.text, fontSize: 14, wordBreak: 'break-all', lineHeight: 1.6 }}>
      {value || <span style={{ color: '#cbd5e1' }}>-</span>}
    </div>
  </div>
);

export const InlineMeta = ({ items = [] }) => (
  <Space wrap size={[8, 8]}>
    {items.map((item) => (
      <Tag
        key={`${item.label}-${item.value}`}
        color={item.color || 'blue'}
        style={{ borderRadius: 999, border: 'none', fontWeight: 500 }}
      >
        {item.label} {item.value}
      </Tag>
    ))}
  </Space>
);

/* ────────────────────────────── DSL code block ────────────────────────────── */

export const DslCodeBlock = ({ data, style: extraStyle }) => (
  <pre
    style={{
      margin: 0,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontSize: 12,
      lineHeight: 1.7,
      padding: 16,
      borderRadius: 12,
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      color: '#334155',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      maxHeight: 480,
      overflow: 'auto',
      ...extraStyle,
    }}
  >
    {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
  </pre>
);

/* ────────────────────────────── step timeline ────────────────────────────── */

export const StepTimeline = ({ steps = [], onStepClick }) => (
  <div style={{ position: 'relative', paddingLeft: 28 }}>
    {steps.map((step, idx) => {
      const isLast = idx === steps.length - 1;
      const isFailed = step.status === 'failed';
      const isSuccess = step.status === 'success';
      const dotColor = isFailed ? uiPalette.error : isSuccess ? uiPalette.success : '#cbd5e1';
      return (
        <div
          key={step.step_index || idx}
          style={{
            position: 'relative',
            paddingBottom: isLast ? 0 : 20,
            cursor: onStepClick ? 'pointer' : 'default',
          }}
          onClick={() => onStepClick?.(step)}
        >
          {!isLast && (
            <div
              style={{
                position: 'absolute',
                left: -22,
                top: 14,
                width: 2,
                height: 'calc(100% - 4px)',
                background: '#e2e8f0',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              left: -28,
              top: 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: dotColor,
              border: '3px solid #fff',
              boxShadow: `0 0 0 2px ${dotColor}33`,
            }}
          />
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${isFailed ? 'rgba(239,68,68,0.2)' : '#e2e8f0'}`,
              background: isFailed ? 'rgba(239,68,68,0.03)' : '#fff',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Space size={8} wrap>
                <span style={{ fontWeight: 600, fontSize: 13, color: uiPalette.text }}>
                  #{step.step_index || idx + 1}
                </span>
                {stepTypeTag(step.step_type)}
                <span style={{ fontSize: 13, color: '#334155' }}>{step.step_name}</span>
              </Space>
              <Space size={8}>
                {uiStatusTag(step.status)}
                {step.duration_ms !== null && step.duration_ms !== undefined && (
                  <span style={{ color: uiPalette.subtle, fontSize: 12 }}>{step.duration_ms}ms</span>
                )}
              </Space>
            </div>
            {step.error_message && (
              <div
                style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'rgba(239,68,68,0.06)',
                  color: '#b91c1c',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {String(step.error_message).slice(0, 200)}
              </div>
            )}
          </div>
        </div>
      );
    })}
    {steps.length === 0 && (
      <div style={{ color: uiPalette.subtle, fontSize: 13, textAlign: 'center', padding: 24 }}>
        暂无步骤数据
      </div>
    )}
  </div>
);

/* ────────────────────────────── metric strip ────────────────────────────── */

export const MetricStrip = ({ items = [] }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 0,
      borderRadius: radius,
      border: panelBorder,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
      marginBottom: 20,
    }}
  >
    {items.map((item, idx) => (
      <div
        key={item.label}
        style={{
          padding: '16px 20px',
          background: '#fff',
          borderRight: idx < items.length - 1 ? `1px solid ${uiPalette.border}` : 'none',
          borderTop: item.accent ? `3px solid ${item.accent}` : '3px solid transparent',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div style={{ color: uiPalette.subtle, fontSize: 12, marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: item.accent || uiPalette.text, lineHeight: 1.2 }}>
            {item.value}
          </div>
          {item.hint && <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>{item.hint}</div>}
        </div>
      </div>
    ))}
  </div>
);

/* ────────────────────────────── empty state ────────────────────────────── */

export const UiEmpty = ({ description = '暂无数据', icon }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 12 }}>
      {icon || <ExperimentFilled />}
    </div>
    <div style={{ color: uiPalette.subtle, fontSize: 14 }}>{description}</div>
  </div>
);

/* ────────────────────────────── stat card (for resource page) ────────────────────────────── */

export const StatCard = ({ icon, label, value, suffix, color = uiPalette.primary }) => (
  <div
    style={{
      padding: '18px 20px',
      borderRadius: radius,
      border: panelBorder,
      background: uiPalette.cardBg,
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span style={{ color, fontSize: 18 }}>{icon}</span>
      <span style={{ color: uiPalette.subtle, fontSize: 12 }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: uiPalette.text, lineHeight: 1.2 }}>
      {value}
      {suffix && <span style={{ fontSize: 14, fontWeight: 400, color: uiPalette.subtle, marginLeft: 4 }}>{suffix}</span>}
    </div>
  </div>
);

/* ────────────────────────────── icon map for nav ────────────────────────────── */

export const uiMenuIcons = {
  cases: <FileTextFilled />,
  plans: <ScheduleOutlined />,
  runs: <RocketFilled />,
  resources: <CloudServerOutlined />,
};

/* ────────────────────────────── action column divider ────────────────────────────── */

export const ActionDivider = () => <span style={{ color: '#d1d5db', margin: '0 2px' }}>|</span>;

export const actionSplit = <span style={{ color: '#e2e8f0' }}>|</span>;

/* ────────────────────────────── tooltip button ────────────────────────────── */

export const TipButton = ({ tip, icon, onClick, danger, type = 'text', size = 'small', loading }) => (
  <Tooltip title={tip}>
    <Button
      type={type}
      size={size}
      icon={icon}
      onClick={onClick}
      danger={danger}
      loading={loading}
      style={{ borderRadius: 6 }}
    />
  </Tooltip>
);

export const numberOrZero = (value) => Number(value || 0);

export const percent = (part, total) => {
  const safeTotal = numberOrZero(total);
  if (!safeTotal) return 0;
  return Math.round((numberOrZero(part) / safeTotal) * 100);
};

export const normalizeApiList = (res) => {
  const data = res?.data !== undefined ? res.data : res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const normalizeApiPage = (res, fallback = {}) => {
  const data = res?.data !== undefined ? res.data : res;
  const list = normalizeApiList(res);
  return {
    list,
    total: Number(data?.total ?? fallback.total ?? list.length ?? 0),
    page: Number(data?.page ?? fallback.page ?? 1),
    size: Number(data?.size ?? fallback.size ?? 20),
  };
};

export const formatDuration = (ms) => {
  const value = Number(ms || 0);
  if (!value) return '-';
  if (value < 1000) return `${value}ms`;
  if (value < 60000) return `${(value / 1000).toFixed(1)}s`;
  const minutes = Math.floor(value / 60000);
  const seconds = Math.round((value % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};
