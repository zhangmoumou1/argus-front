import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Col,
  Image,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CodeOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RocketFilled,
  StopOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import auth from '@/utils/auth';
import { getUiTestRunDetail, getUiTestRunStepDetail, stopUiTestRun } from '@/services/uiTest';
import {
  DslCodeBlock,
  InsetCard,
  Kv,
  MetricStrip,
  PillButton,
  RefreshButton,
  SectionCard,
  StepTimeline,
  TipButton,
  UiEmpty,
  UiTestPage,
  stepTypeTag,
  formatDuration,
  uiPalette,
  uiStatusTag,
} from './shared';

const { Text } = Typography;
const activeRunStatuses = ['queued', 'claimed', 'running', 'uploading'];

const buildArtifactMeta = (artifact = {}) => {
  const previewType = artifact.preview_type || '';
  const typeMap = {
    html: { label: 'HTML 报告', icon: <FileTextOutlined />, color: '#7c3aed' },
    video: { label: '视频', icon: <VideoCameraOutlined />, color: '#059669' },
    image: { label: '图片', icon: <FileImageOutlined />, color: '#2563eb' },
    text: { label: '文本', icon: <FileTextOutlined />, color: '#475569' },
    pdf: { label: 'PDF', icon: <FileTextOutlined />, color: '#dc2626' },
    archive: { label: '压缩包', icon: <CloudDownloadOutlined />, color: '#d97706' },
  };
  return typeMap[previewType] || { label: '文件', icon: <FileTextOutlined />, color: '#64748b' };
};

const canInlinePreview = (artifact = {}) => ['html', 'video', 'image', 'pdf'].includes(artifact.preview_type);

const getArtifactDisplayName = (artifact = {}, fallback = '') =>
  artifact?.name || artifact?.object_key?.split('/').pop() || fallback || '-';

const stringifyPreview = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  try {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const collectRunErrors = (payload) => {
  if (!payload) return [];
  const errors = [];
  const append = (label, value) => {
    const text = String(value || '').trim();
    if (text && !errors.some((item) => item.text === text)) {
      errors.push({ label, text });
    }
  };
  append('执行错误', payload.error_message);
  append('Runner错误', payload.result_payload?.error_message);
  append('失败原因', payload.result_payload?.message);
  (payload.result_payload?.case_results || []).forEach((item, index) => {
    append(item.case_title || `用例${index + 1}`, item.error_message);
  });
  (payload.steps || []).forEach((item) => {
    append(`步骤 #${item.step_index}`, item.error_message);
  });
  return errors;
};

const normalizeStepCaseMeta = (step = {}) => {
  const requestPayload = step?.request_payload && typeof step.request_payload === 'object' ? step.request_payload : {};
  const resultPayload = step?.result_payload && typeof step.result_payload === 'object' ? step.result_payload : {};
  return {
    ...step,
    case_index: step.case_index || requestPayload.case_index || resultPayload.case_index || 0,
    case_ref_id: step.case_ref_id || requestPayload.case_ref_id || resultPayload.case_ref_id || 0,
    case_title: step.case_title || requestPayload.case_title || resultPayload.case_title || '',
    case_path: step.case_path || requestPayload.case_path || resultPayload.case_path || '',
    case_step_index: step.case_step_index || requestPayload.case_step_index || resultPayload.case_step_index || 0,
  };
};

const ArtifactPreview = ({ artifact }) => {
  if (!artifact?.view_url) {
    return <UiEmpty description="当前产物暂无可用预览地址" />;
  }
  if (artifact.preview_type === 'image') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <Image
          src={artifact.view_url}
          alt={artifact.name || artifact.label}
          style={{ maxWidth: '100%', maxHeight: 520, borderRadius: 12, border: `1px solid ${uiPalette.border}` }}
          preview={{ mask: <EyeOutlined /> }}
        />
      </div>
    );
  }
  if (artifact.preview_type === 'video') {
    return (
      <div style={{ padding: '16px 0' }}>
        <video
          src={artifact.view_url}
          controls
          style={{
            width: '100%',
            maxHeight: 480,
            borderRadius: 12,
            background: '#000',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        />
      </div>
    );
  }
  if (artifact.preview_type === 'html' || artifact.preview_type === 'pdf') {
    return (
      <div style={{ padding: '16px 0' }}>
        <iframe
          src={artifact.view_url}
          title={artifact.name || artifact.label}
          style={{
            width: '100%',
            height: 560,
            border: `1px solid ${uiPalette.border}`,
            borderRadius: 12,
            background: '#fff',
          }}
        />
      </div>
    );
  }
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <Space direction="vertical" size={16}>
        <CloudDownloadOutlined style={{ fontSize: 40, color: '#cbd5e1' }} />
        <Text type="secondary">该类型暂不支持内嵌预览</Text>
        <PillButton type="primary" href={artifact.view_url} target="_blank" rel="noreferrer">
          下载产物
        </PillButton>
      </Space>
    </div>
  );
};

const RunDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [payloadPreview, setPayloadPreview] = useState({ open: false, title: '', content: '' });
  const [artifactPreview, setArtifactPreview] = useState({ open: false, artifact: null });
  const [stepStatusFilter, setStepStatusFilter] = useState('all');
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepDetailLoading, setStepDetailLoading] = useState(false);
  const [expandedCaseKeys, setExpandedCaseKeys] = useState([]);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    const res = await getUiTestRunDetail({
      id,
      include_step_artifacts: false,
    });
    setLoading(false);
    if (auth.response(res)) {
      const next = res.data || res;
      setPayload(next);
      setSelectedStep((prev) => {
        if (!prev?.id) return prev;
        const latestStep = (next.steps || []).find((item) => String(item.id) === String(prev.id));
        return latestStep ? { ...prev, ...latestStep } : prev;
      });
    }
  };

  const openStepDetail = async (step) => {
    if (!step?.id) {
      setSelectedStep(step);
      return;
    }
    setSelectedStep(step);
    setStepDetailLoading(true);
    const res = await getUiTestRunStepDetail({ id: step.id });
    setStepDetailLoading(false);
    if (auth.response(res)) {
      setSelectedStep({ ...step, ...(res.data || res) });
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStop = async () => {
    if (!payload?.id) return;
    setStopLoading(true);
    const res = await stopUiTestRun({ id: payload.id });
    setStopLoading(false);
    if (auth.response(res, true)) {
      fetchDetail();
    }
  };

  const artifacts = useMemo(() => (
    Array.isArray(payload?.artifacts)
      ? payload.artifacts.filter((item) => {
        const label = String(item?.label || '');
        const name = String(item?.name || '');
        const objectKey = String(item?.object_key || '');
        if (label === '结果JSON' || name === 'result.json') return false;
        if (label === '执行报告' || name === 'report.html') return false;
        return !objectKey.endsWith('/reports/report.html');
      })
      : []
  ), [payload]);

  const artifactWarnings = useMemo(
    () => (Array.isArray(payload?.result_payload?.artifact_warnings) ? payload.result_payload.artifact_warnings : []),
    [payload],
  );

  const steps = useMemo(
    () => (Array.isArray(payload?.steps) ? payload.steps.map((item) => normalizeStepCaseMeta(item)) : []),
    [payload],
  );
  const successCount = steps.filter((item) => item.status === 'success').length;
  const failedCount = steps.filter((item) => item.status === 'failed').length;
  const runningCount = steps.filter((item) => ['queued', 'claimed', 'running'].includes(item.status)).length;
  const totalDuration = payload?.duration_ms || payload?.total_duration_ms
    || steps.reduce((sum, item) => sum + Number(item.duration_ms || 0), 0);
  const successRate = steps.length ? Math.round((successCount / steps.length) * 100) : 0;
  const plannedCases = useMemo(() => {
    const cases = payload?.runner_payload?.cases;
    if (Array.isArray(cases)) {
      return cases.map((item, index) => ({
        case_index: item.case_index || index + 1,
        case_ref_id: item.case_ref_id || 0,
        file_title: item.file_title || '',
        case_title: item.node_title || item.dsl?.ui_case_title || `用例${index + 1}`,
        node_path: item.node_path || item.dsl?.ui_case_path || '',
        step_count: Array.isArray(item.dsl?.steps) ? item.dsl.steps.length : 0,
      }));
    }
    const dsl = payload?.runner_payload?.dsl;
    if (dsl) {
      return [{
        case_index: 1,
        case_ref_id: payload?.case_ref_id || 0,
        file_title: payload?.runner_payload?.file_title || '',
        case_title: payload?.runner_payload?.node_title || dsl.ui_case_title || payload?.run_name || '试运行用例',
        node_path: payload?.runner_payload?.node_path || dsl.ui_case_path || '',
        step_count: Array.isArray(dsl.steps) ? dsl.steps.length : 0,
      }];
    }
    return [];
  }, [payload]);

  const caseResults = useMemo(
    () => (Array.isArray(payload?.result_payload?.case_results) ? payload.result_payload.case_results : []),
    [payload],
  );

  const caseOverview = useMemo(() => {
    const resultByRef = new Map();
    const resultByIndex = new Map();
    caseResults.forEach((item) => {
      if (item.case_ref_id) resultByRef.set(String(item.case_ref_id), item);
      if (item.case_index) resultByIndex.set(String(item.case_index), item);
    });
    const sourceCases = plannedCases.length ? plannedCases : caseResults;
    return sourceCases.map((item, index) => {
      const result = resultByRef.get(String(item.case_ref_id || ''))
        || resultByIndex.get(String(item.case_index || index + 1))
        || {};
      return {
        ...item,
        ...result,
        key: `${item.case_ref_id || 0}-${item.case_index || result.case_index || index + 1}`,
        case_index: item.case_index || result.case_index || index + 1,
        case_title: item.case_title || result.case_title || `用例${index + 1}`,
        node_path: item.node_path || result.node_path || '',
        step_count: result.step_count ?? item.step_count ?? 0,
        status: result.status || 'queued',
      };
    });
  }, [plannedCases, caseResults]);

  const filteredSteps = useMemo(() => {
    if (stepStatusFilter === 'all') return steps;
    if (stepStatusFilter === 'running') {
      return steps.filter((item) => ['queued', 'claimed', 'running'].includes(item.status));
    }
    return steps.filter((item) => item.status === stepStatusFilter);
  }, [steps, stepStatusFilter]);

  const groupedCases = useMemo(() => {
    const groups = caseOverview.map((item) => ({
      ...item,
      steps: [],
      success_step_count: 0,
      failed_step_count: 0,
      skipped_step_count: 0,
      duration_ms: 0,
      latest_error: item.error_message || '',
    }));
    const byRef = new Map();
    const byIndex = new Map();
    groups.forEach((item) => {
      if (item.case_ref_id) byRef.set(String(item.case_ref_id), item);
      if (item.case_index) byIndex.set(String(item.case_index), item);
    });

    const attachFallback = (step, index) => {
      const caseIndex = step.case_index || groups.length + 1;
      const caseRefId = step.case_ref_id || 0;
      const fallbackKey = caseRefId ? `fallback-ref-${caseRefId}` : `fallback-index-${caseIndex}`;
      const existing = groups.find((item) => item.key === fallbackKey);
      if (existing) {
        return existing;
      }
      const fallbackGroup = {
        key: fallbackKey,
        case_index: caseIndex,
        case_ref_id: caseRefId,
        case_title: step.case_title || `用例${caseIndex || index + 1}`,
        node_path: step.case_path || '',
        step_count: 0,
        status: 'queued',
        steps: [],
        success_step_count: 0,
        failed_step_count: 0,
        skipped_step_count: 0,
        duration_ms: 0,
        latest_error: '',
      };
      groups.push(fallbackGroup);
      if (caseRefId) byRef.set(String(caseRefId), fallbackGroup);
      if (caseIndex) byIndex.set(String(caseIndex), fallbackGroup);
      return fallbackGroup;
    };

    filteredSteps.forEach((step, index) => {
      const group = byRef.get(String(step.case_ref_id || ''))
        || byIndex.get(String(step.case_index || ''))
        || attachFallback(step, index);
      group.steps.push(step);
      group.duration_ms += Number(step.duration_ms || 0);
      if (step.status === 'success') group.success_step_count += 1;
      if (step.status === 'failed') {
        group.failed_step_count += 1;
        if (!group.latest_error && step.error_message) {
          group.latest_error = step.error_message;
        }
      }
      if (step.status === 'skipped') group.skipped_step_count += 1;
      if (!group.case_title) group.case_title = step.case_title || `用例${index + 1}`;
      if (!group.node_path) group.node_path = step.case_path || '';
      if (!group.status || group.status === 'queued') group.status = step.status || 'queued';
    });

    return groups;
  }, [caseOverview, filteredSteps]);

  useEffect(() => {
    setExpandedCaseKeys((prev) => {
      if (!groupedCases.length) return [];
      const validKeys = new Set(groupedCases.map((item) => item.key));
      const kept = prev.filter((key) => validKeys.has(key));
      if (kept.length) return kept;
      return groupedCases[0]?.steps?.length ? [groupedCases[0].key] : [];
    });
  }, [groupedCases]);

  const detailMetrics = [
    { label: '用例', value: plannedCases.length || caseResults.length || 0, hint: `${caseResults.length} 个已回传结果`, accent: uiPalette.accent },
    { label: '步骤', value: steps.length, hint: `${filteredSteps.length} 个当前可见`, accent: uiPalette.primary },
    { label: '成功', value: successCount, hint: `${successRate}%`, accent: uiPalette.success },
    { label: '失败', value: failedCount, hint: payload?.analysis_summary?.reason_type || '等待归因', accent: uiPalette.error },
    { label: '耗时', value: formatDuration(totalDuration), hint: `${runningCount} 个运行态步骤`, accent: uiPalette.warning },
  ];

  const stepColumns = [
    {
      title: '#',
      dataIndex: 'step_index',
      key: 'step_index',
      width: 64,
      render: (value) => <span style={{ fontWeight: 600, color: uiPalette.text }}>#{value}</span>,
    },
    {
      title: '步骤',
      dataIndex: 'step_name',
      key: 'step_name',
      width: 320,
      render: (value, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{value}</div>
          {stepTypeTag(record.step_type)}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 110,
      render: (value) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: uiPalette.subtle }} />
          <span>{value !== null && value !== undefined ? formatDuration(value) : '-'}</span>
        </Space>
      ),
    },
    {
      title: '载荷',
      key: 'request_payload',
      width: 88,
      render: (_, record) => (
        record.request_payload ? (
          <TipButton
            tip="查看请求载荷"
            icon={<CodeOutlined />}
            onClick={() => setPayloadPreview({
              open: true,
              title: `步骤 #${record.step_index} 请求载荷`,
              content: stringifyPreview(record.request_payload),
            })}
          />
        ) : <span style={{ color: '#cbd5e1' }}>-</span>
      ),
    },
    {
      title: '详情',
      key: 'detail',
      width: 88,
      render: (_, record) => (
        <TipButton
          tip="查看步骤详情"
          icon={<EyeOutlined />}
          onClick={() => openStepDetail(record)}
        />
      ),
    },
  ];

  const caseColumns = [
    {
      title: '#',
      dataIndex: 'case_index',
      key: 'case_index',
      width: 70,
      render: (value) => <span style={{ fontWeight: 600 }}>#{value}</span>,
    },
    {
      title: '用例步骤',
      key: 'case',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: uiPalette.text, marginBottom: 4 }}>{record.case_title}</div>
          <div style={{ color: uiPalette.subtle, fontSize: 12 }}>
            {[record.file_title, record.node_path].filter(Boolean).join(' / ') || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '步骤统计',
      key: 'steps',
      width: 300,
      render: (_, record) => (
        <Space size={[6, 6]} wrap>
          <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>共 {record.step_count || 0}</Tag>
          <Tag color="success" style={{ borderRadius: 6, border: 'none' }}>成功 {record.success_step_count || 0}</Tag>
          <Tag color={record.failed_step_count ? 'error' : 'default'} style={{ borderRadius: 6, border: 'none' }}>失败 {record.failed_step_count || 0}</Tag>
          <Tag color={record.skipped_step_count ? 'warning' : 'default'} style={{ borderRadius: 6, border: 'none' }}>跳过 {record.skipped_step_count || 0}</Tag>
        </Space>
      ),
    },
    {
      title: '耗时',
      key: 'duration_ms',
      width: 120,
      render: (_, record) => formatDuration(record.duration_ms),
    },
    {
      title: '错误',
      key: 'error',
      width: 260,
      render: (_, record) => (
        record.latest_error ? (
          <div style={{ color: uiPalette.error, fontSize: 12, lineHeight: 1.6 }}>
            {String(record.latest_error).slice(0, 180)}
          </div>
        ) : <span style={{ color: '#cbd5e1' }}>-</span>
      ),
    },
  ];

  return (
    <UiTestPage
      extra={(
        <Space>
          <PillButton icon={<ArrowLeftOutlined />} onClick={() => history.push('/ui-test/runs')}>
            返回列表
          </PillButton>
          <RefreshButton onClick={fetchDetail} loading={loading} text="刷新" />
          {activeRunStatuses.includes(payload?.status) && (
            <Popconfirm
              title="确认停止该执行？"
              description="停止后 Runner 会在当前步骤或上传检查点结束后退出。"
              onConfirm={handleStop}
              okText="停止"
              cancelText="取消"
            >
              <PillButton danger icon={<StopOutlined />} loading={stopLoading}>
                停止
              </PillButton>
            </Popconfirm>
          )}
        </Space>
      )}
    >
      {artifactWarnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<CloudDownloadOutlined />}
          style={{ marginBottom: 20, borderRadius: 14 }}
          message={`产物上传存在 ${artifactWarnings.length} 个告警`}
          description={(
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {artifactWarnings.slice(0, 6).map((item, index) => (
                <div
                  key={`${item.object_key || item.local_path || index}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(217,119,6,0.08)',
                    color: '#92400e',
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <strong>{item.label || '产物'}：</strong>{item.message || '上传失败'}
                  <div style={{ color: uiPalette.subtle, marginTop: 4 }}>
                    本地路径：{item.local_path || '-'}
                  </div>
                </div>
              ))}
            </Space>
          )}
        />
      )}

      <MetricStrip items={detailMetrics} />

      <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 20 }}>
        <Col xs={24} xl={16}>
          <InsetCard
            title="执行概况"
            icon={<RocketFilled />}
            actions={(
              payload?.result_payload && Object.keys(payload.result_payload || {}).length ? (
                <TipButton
                  tip="查看Runner结果"
                  icon={<CodeOutlined />}
                  onClick={() => setPayloadPreview({
                    open: true,
                    title: 'Runner 结果',
                    content: stringifyPreview(payload.result_payload),
                  })}
                />
              ) : null
            )}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <Kv label="状态" value={uiStatusTag(payload?.status)} />
              <Kv label="计划" value={payload?.plan_name || `#${payload?.plan_id}`} />
              <Kv label="执行环境" value={payload?.env_name || '-'} />
              <Kv label="触发方式" value={payload?.trigger_mode} />
              <Kv label="浏览器" value={`${payload?.browser || 'chromium'} / ${payload?.headless ? '无头' : '有头'}`} />
              <Kv label="开始时间" value={payload?.started_at} />
              <Kv label="结束时间" value={payload?.finished_at} />
              <Kv label="总耗时" value={formatDuration(totalDuration)} />
              {payload?.analysis_summary?.reason_type && (
                <Kv label="归因类型" value={payload.analysis_summary.reason_type} />
              )}
            </div>
          </InsetCard>
        </Col>
        <Col xs={24} xl={8}>
          <InsetCard title="执行产物" icon={<PlayCircleOutlined />}>
            {artifacts.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 12,
                }}
              >
                {artifacts.map((item) => {
                  const meta = buildArtifactMeta(item);
                  return (
                    <div
                      key={item.object_key}
                      style={{
                        padding: '14px 12px',
                        borderRadius: 12,
                        border: `1px solid ${uiPalette.border}`,
                        background: '#fff',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ color: meta.color, fontSize: 24, marginBottom: 8 }}>{meta.icon}</div>
                      <div style={{ fontWeight: 600, color: uiPalette.text, fontSize: 13, marginBottom: 4 }}>
                        {item.label || meta.label}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 10 }}>
                        {item.file_size || meta.label}
                      </div>
                      <Space size={6} wrap style={{ justifyContent: 'center' }}>
                        <TipButton
                          tip={canInlinePreview(item) ? '查看详情' : '打开产物'}
                          icon={<EyeOutlined />}
                          onClick={() => {
                            if (canInlinePreview(item)) {
                              setArtifactPreview({ open: true, artifact: item });
                            } else if (item.view_url) {
                              window.open(item.view_url, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        />
                        {item.view_url && (
                          <TipButton
                            tip="新开查看"
                            icon={<CloudDownloadOutlined />}
                            onClick={() => window.open(item.view_url, '_blank', 'noopener,noreferrer')}
                          />
                        )}
                      </Space>
                    </div>
                  );
                })}
              </div>
            ) : (
              <UiEmpty description="当前还没有可展示的执行产物" />
            )}
          </InsetCard>
        </Col>
      </Row>

      <SectionCard
        title="用例步骤"
        description="外层按用例聚合，展开后查看具体步骤"
        extra={(
          <Space wrap>
            <Segmented
              size="small"
              value={stepStatusFilter}
              onChange={setStepStatusFilter}
              options={[
                { label: '全部', value: 'all' },
                { label: '失败', value: 'failed' },
                { label: '成功', value: 'success' },
                { label: '运行中', value: 'running' },
              ]}
            />
          </Space>
        )}
      >
        <Table
          rowKey="key"
          loading={loading}
          dataSource={groupedCases}
          columns={caseColumns}
          pagination={false}
          locale={{ emptyText: <UiEmpty description="当前报告没有用例和步骤数据" /> }}
          style={{ background: 'transparent' }}
          expandable={{
            expandedRowKeys: expandedCaseKeys,
            onExpandedRowsChange: (keys) => setExpandedCaseKeys(keys),
            rowExpandable: (record) => Array.isArray(record.steps) && record.steps.length > 0,
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 0 4px 0' }}>
                <StepTimeline steps={record.steps} onStepClick={openStepDetail} />
              </div>
            ),
          }}
        />
      </SectionCard>

      <Modal
        open={!!selectedStep}
        title={(
          <Space>
            <CodeOutlined style={{ color: uiPalette.primary }} />
            <span>步骤 #{selectedStep?.step_index || '-'}</span>
          </Space>
        )}
        footer={null}
        width={980}
        onCancel={() => setSelectedStep(null)}
        styles={{
          content: { borderRadius: 16, overflow: 'hidden' },
          body: { padding: '16px 20px', background: '#fafbfd' },
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <InsetCard title="步骤信息" compact icon={<ClockCircleOutlined />}>
              <Kv label="名称" value={selectedStep?.step_name} />
              <Kv label="类型" value={stepTypeTag(selectedStep?.step_type)} />
              <Kv label="状态" value={uiStatusTag(selectedStep?.status)} />
              <Kv label="耗时" value={formatDuration(selectedStep?.duration_ms)} />
            </InsetCard>
          </Col>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {selectedStep?.error_message && (
                <Alert
                  type="error"
                  showIcon
                  message="错误摘要"
                  description={String(selectedStep.error_message)}
                  style={{ borderRadius: 8 }}
                />
              )}
              {stepDetailLoading ? (
                <UiEmpty description="正在加载步骤截图和载荷" />
              ) : selectedStep?.screenshot_artifact?.view_url ? (
                <Image
                  src={selectedStep.screenshot_artifact.view_url}
                  alt={getArtifactDisplayName(selectedStep.screenshot_artifact, selectedStep.screenshot_path)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 360,
                    borderRadius: 8,
                    border: `1px solid ${uiPalette.border}`,
                  }}
                  preview={{ mask: <EyeOutlined /> }}
                />
              ) : (
                <UiEmpty description="该步骤暂无截图" />
              )}
              {selectedStep?.request_payload && (
                <InsetCard title="请求载荷" compact icon={<CodeOutlined />}>
                  <DslCodeBlock data={selectedStep.request_payload} style={{ maxHeight: 260 }} />
                </InsetCard>
              )}
            </Space>
          </Col>
        </Row>
      </Modal>

      <Modal
        open={payloadPreview.open}
        title={(
          <Space>
            <CodeOutlined style={{ color: uiPalette.primary }} />
            <span>{payloadPreview.title || '请求载荷'}</span>
          </Space>
        )}
        footer={null}
        width={880}
        onCancel={() => setPayloadPreview({ open: false, title: '', content: '' })}
        styles={{
          content: { borderRadius: 16, overflow: 'hidden' },
          body: { padding: '16px 20px', background: '#fafbfd' },
        }}
      >
        <DslCodeBlock data={payloadPreview.content} />
      </Modal>

      <Modal
        open={artifactPreview.open}
        title={(
          <Space>
            <FileImageOutlined style={{ color: uiPalette.primary }} />
            <span>{artifactPreview.artifact?.label || '执行产物'}</span>
          </Space>
        )}
        footer={null}
        width={980}
        onCancel={() => setArtifactPreview({ open: false, artifact: null })}
        styles={{
          content: { borderRadius: 16, overflow: 'hidden' },
          body: { padding: '16px 20px', background: '#fafbfd' },
        }}
      >
        {artifactPreview.artifact ? <ArtifactPreview artifact={artifactPreview.artifact} /> : null}
      </Modal>
    </UiTestPage>
  );
};

export default RunDetail;
