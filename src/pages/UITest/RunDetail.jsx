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
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CodeOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileTextOutlined,
  RedoOutlined,
  RocketFilled,
  StopOutlined,
  TableOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import auth from '@/utils/auth';
import { getUiTestRunDetail, getUiTestRunStepDetail, retryUiTestRun, stopUiTestRun } from '@/services/uiTest';
import {
  DslCodeBlock,
  InsetCard,
  Kv,
  MetricStrip,
  PillButton,
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
  const [retryLoading, setRetryLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [activeArtifactKey, setActiveArtifactKey] = useState('');
  const [payloadPreview, setPayloadPreview] = useState({ open: false, title: '', content: '' });
  const [activeViewTab, setActiveViewTab] = useState('timeline');
  const [stepStatusFilter, setStepStatusFilter] = useState('all');
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepDetailLoading, setStepDetailLoading] = useState(false);

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
      const visibleArtifacts = (next.artifacts || []).filter(
        (item) => item?.label !== '结果JSON' && item?.name !== 'result.json',
      );
      const firstPreviewable = visibleArtifacts.find((item) => item?.view_url && canInlinePreview(item));
      const firstAny = visibleArtifacts.find((item) => item?.view_url);
      setActiveArtifactKey((firstPreviewable || firstAny || {}).object_key || '');
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

  const handleRetry = async () => {
    if (!payload?.id) return;
    setRetryLoading(true);
    const res = await retryUiTestRun({ id: payload.id });
    setRetryLoading(false);
    if (auth.response(res, true)) {
      message.success(`已创建重试任务 Run #${res?.data?.run_id || ''}`);
      history.push('/ui-test/runs');
    }
  };

  const handleStop = async () => {
    if (!payload?.id) return;
    setStopLoading(true);
    const res = await stopUiTestRun({ id: payload.id });
    setStopLoading(false);
    if (auth.response(res, true)) {
      message.success('已发送停止指令');
      fetchDetail();
    }
  };

  const artifacts = useMemo(
    () =>
      Array.isArray(payload?.artifacts)
        ? payload.artifacts.filter((item) => item?.label !== '结果JSON' && item?.name !== 'result.json')
        : [],
    [payload],
  );

  const activeArtifact = artifacts.find((item) => item.object_key === activeArtifactKey) || artifacts[0] || null;
  const runErrors = useMemo(() => collectRunErrors(payload), [payload]);
  const artifactWarnings = useMemo(
    () => (Array.isArray(payload?.result_payload?.artifact_warnings) ? payload.result_payload.artifact_warnings : []),
    [payload],
  );

  const steps = payload?.steps || [];
  const successCount = steps.filter((item) => item.status === 'success').length;
  const failedCount = steps.filter((item) => item.status === 'failed').length;
  const runningCount = steps.filter((item) => ['queued', 'claimed', 'running'].includes(item.status)).length;
  const totalDuration = payload?.duration_ms || payload?.total_duration_ms
    || steps.reduce((sum, item) => sum + Number(item.duration_ms || 0), 0);

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

  const detailMetrics = [
    { label: '用例', value: plannedCases.length || caseResults.length || 0, hint: `${caseResults.length} 个已回传结果`, accent: uiPalette.accent },
    { label: '步骤', value: steps.length, hint: `${filteredSteps.length} 个当前可见`, accent: uiPalette.primary },
    { label: '成功', value: successCount, hint: `${steps.length ? Math.round((successCount / steps.length) * 100) : 0}%`, accent: uiPalette.success },
    { label: '失败', value: failedCount, hint: payload?.analysis_summary?.reason_type || '等待归因', accent: uiPalette.error },
    { label: '耗时', value: formatDuration(totalDuration), hint: `${runningCount} 个运行态步骤`, accent: uiPalette.warning },
  ];

  const stepColumns = [
    {
      title: '#',
      dataIndex: 'step_index',
      key: 'step_index',
      width: 64,
      fixed: 'left',
      render: (value) => (
        <span style={{ fontWeight: 600, color: uiPalette.text }}>#{value}</span>
      ),
    },
    {
      title: '步骤',
      dataIndex: 'step_name',
      key: 'step_name',
      width: 320,
      fixed: 'left',
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
      width: 120,
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
      width: 100,
      render: (_, record) =>
        record.request_payload ? (
          <TipButton
            tip="查看请求载荷"
            icon={<CodeOutlined />}
            onClick={() =>
              setPayloadPreview({
                open: true,
                title: `步骤 #${record.step_index} 请求载荷`,
                content: stringifyPreview(record.request_payload),
              })
            }
          />
        ) : (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ),
    },
    {
      title: '截图',
      key: 'screenshot',
      width: 180,
      render: (_, record) => {
        const filename = getArtifactDisplayName(record.screenshot_artifact, record.screenshot_path);
        return <Text type="secondary">{filename || '-'}</Text>;
      },
    },
    {
      title: '错误摘要',
      key: 'error',
      width: 240,
      render: (_, record) =>
        record.error_message ? (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.06)',
              color: '#b91c1c',
              fontSize: 12,
              lineHeight: 1.6,
              maxWidth: 240,
            }}
          >
            {String(record.error_message).slice(0, 150)}
          </div>
        ) : (
          <span style={{ color: '#cbd5e1' }}>-</span>
        ),
    },
    {
      title: '详情',
      key: 'detail',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <TipButton
          tip="查看步骤详情"
          icon={<EyeOutlined />}
          onClick={() => openStepDetail(record)}
        />
      ),
    },
  ];

  return (
    <UiTestPage
      extra={
        <Space>
          <PillButton icon={<ArrowLeftOutlined />} onClick={() => history.push('/ui-test/runs')}>
            返回列表
          </PillButton>
          <PillButton icon={<RedoOutlined />} loading={retryLoading} onClick={handleRetry}>
            重试
          </PillButton>
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
      }
    >
      {/* Analysis Summary */}
      {payload && payload?.analysis_summary?.status !== 'success' && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20, borderRadius: 14 }}
          message={payload?.analysis_summary?.summary || '执行存在失败步骤'}
          description={
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {payload?.analysis_summary?.suggestion && (
                <div>{payload.analysis_summary.suggestion}</div>
              )}
              {payload?.analysis_summary?.reason_type && (
                <Tag color="orange" style={{ borderRadius: 999, border: 'none' }}>
                  归因: {payload.analysis_summary.reason_type}
                </Tag>
              )}
              {runErrors.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {runErrors.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.06)',
                        color: '#991b1b',
                        fontSize: 12,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      <strong>{item.label}：</strong>{item.text}
                    </div>
                  ))}
                </div>
              )}
            </Space>
          }
        />
      )}

      {artifactWarnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<CloudDownloadOutlined />}
          style={{ marginBottom: 20, borderRadius: 14 }}
          message={`产物上传存在 ${artifactWarnings.length} 个告警`}
          description={
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
          }
        />
      )}

      <MetricStrip items={detailMetrics} />

      {/* Metadata + Artifacts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={6}>
          <InsetCard
            title="执行信息"
            icon={<RocketFilled />}
            compact
            actions={
              payload?.result_payload && Object.keys(payload.result_payload || {}).length ? (
                <TipButton
                  tip="查看Runner结果"
                  icon={<CodeOutlined />}
                  onClick={() =>
                    setPayloadPreview({
                      open: true,
                      title: 'Runner 结果',
                      content: stringifyPreview(payload.result_payload),
                    })
                  }
                />
              ) : null
            }
          >
            <Kv label="状态" value={uiStatusTag(payload?.status)} />
            <Kv label="计划" value={payload?.plan_name || `#${payload?.plan_id}`} />
            <Kv label="触发方式" value={payload?.trigger_mode} />
            <Kv label="浏览器" value={`${payload?.browser || 'chromium'} / ${payload?.headless ? '无头' : '有头'}`} />
            <Kv label="开始时间" value={payload?.started_at} />
            <Kv label="结束时间" value={payload?.finished_at} />
            {payload?.analysis_summary?.reason_type && (
              <Kv label="归因类型" value={payload.analysis_summary.reason_type} />
            )}
          </InsetCard>
        </Col>
        <Col xs={24} xl={18}>
          <InsetCard
            title="执行产物"
            icon={<FileImageOutlined />}
            actions={
              activeArtifact?.view_url ? (
                <Space>
                  <PillButton
                    size="small"
                    icon={<EyeOutlined />}
                    href={activeArtifact.view_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    新开查看
                  </PillButton>
                </Space>
              ) : null
            }
          >
            {artifacts.length ? (
              <Tabs
                activeKey={activeArtifactKey || artifacts[0]?.object_key}
                onChange={setActiveArtifactKey}
                items={artifacts.map((item) => {
                  const meta = buildArtifactMeta(item);
                  return {
                    key: item.object_key,
                    label: (
                      <Space size={4}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span>{item.label}</span>
                      </Space>
                    ),
                    children: (
                      <div>
                        <Space wrap style={{ marginBottom: 12 }}>
                          <Tag
                            icon={meta.icon}
                            style={{ borderRadius: 999, border: 'none', background: `${meta.color}14`, color: meta.color }}
                          >
                            {meta.label}
                          </Tag>
                          {item.file_size && (
                            <Tag style={{ borderRadius: 999, border: 'none', background: '#f1f5f9' }}>
                              {item.file_size}
                            </Tag>
                          )}
                          <Tag
                            icon={item.available ? <EyeOutlined /> : <ClockCircleOutlined />}
                            color={item.available ? 'success' : 'default'}
                            style={{ borderRadius: 999, border: 'none' }}
                          >
                            {item.available ? '可预览' : '未就绪'}
                          </Tag>
                        </Space>
                        <ArtifactPreview artifact={item} />
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <UiEmpty description="当前还没有执行产物" />
            )}
          </InsetCard>
        </Col>
      </Row>

      <SectionCard
        title="计划用例"
        description="Runner 接收到的用例与回传结果"
        style={{ marginTop: 20 }}
        extra={<span style={{ color: uiPalette.subtle, fontSize: 13 }}>下发 {plannedCases.length} 条 / 回传 {caseResults.length} 条</span>}
      >
        <Table
          rowKey={(record) => `${record.case_ref_id || 0}-${record.case_index || 0}`}
          dataSource={caseOverview}
          pagination={false}
          size="middle"
          locale={{ emptyText: <UiEmpty description="当前报告没有用例下发信息" /> }}
          columns={[
            {
              title: '#',
              dataIndex: 'case_index',
              key: 'case_index',
              width: 70,
              render: (value) => <span style={{ fontWeight: 600 }}>#{value}</span>,
            },
            {
              title: '用例',
              key: 'case',
              render: (_, record) => (
                <div>
                  <div style={{ fontWeight: 600, color: uiPalette.text }}>{record.case_title}</div>
                  <div style={{ color: uiPalette.subtle, fontSize: 12, marginTop: 4 }}>
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
              title: '步骤',
              key: 'steps',
              width: 220,
              render: (_, record) => (
                <Space size={8}>
                  <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                    共 {record.step_count || 0}
                  </Tag>
                  <Tag color="success" style={{ borderRadius: 6, border: 'none' }}>
                    成功 {record.success_step_count || 0}
                  </Tag>
                  <Tag color={record.failed_step_count ? 'error' : 'default'} style={{ borderRadius: 6, border: 'none' }}>
                    失败 {record.failed_step_count || 0}
                  </Tag>
                  <Tag color={record.skipped_step_count ? 'warning' : 'default'} style={{ borderRadius: 6, border: 'none' }}>
                    跳过 {record.skipped_step_count || 0}
                  </Tag>
                </Space>
              ),
            },
            {
              title: '错误',
              dataIndex: 'error_message',
              key: 'error_message',
              width: 260,
              render: (value) => value ? (
                <div style={{ color: uiPalette.error, fontSize: 12, lineHeight: 1.6 }}>
                  {String(value).slice(0, 180)}
                </div>
              ) : (
                <span style={{ color: '#cbd5e1' }}>-</span>
              ),
            },
          ]}
        />
      </SectionCard>

      {/* Steps */}
      <SectionCard
        title="步骤时间线"
        description="步骤状态、耗时、截图和错误摘要"
        style={{ marginTop: 20 }}
        extra={
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
            <Segmented
              size="small"
              value={activeViewTab}
              onChange={setActiveViewTab}
              options={[
                {
                  value: 'timeline',
                  label: (
                    <Space size={4}>
                      <UnorderedListOutlined />
                      <span>时间线</span>
                    </Space>
                  ),
                },
                {
                  value: 'table',
                  label: (
                    <Space size={4}>
                      <TableOutlined />
                      <span>表格</span>
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        }
      >
        {activeViewTab === 'timeline' ? (
          <div style={{ padding: '20px 16px' }}>
            <StepTimeline steps={filteredSteps} onStepClick={openStepDetail} />
          </div>
        ) : (
          <Table
            rowKey="step_index"
            loading={loading}
            dataSource={filteredSteps}
            pagination={false}
            size="middle"
            scroll={{ x: 1280 }}
            locale={{ emptyText: <UiEmpty description="还没有步骤结果" /> }}
            columns={stepColumns}
          />
        )}
      </SectionCard>

      {/* Step Detail Modal */}
      <Modal
        open={!!selectedStep}
        title={
          <Space>
            <CodeOutlined style={{ color: uiPalette.primary }} />
            <span>步骤 #{selectedStep?.step_index || '-'}</span>
          </Space>
        }
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

      {/* Payload Preview Modal */}
      <Modal
        open={payloadPreview.open}
        title={
          <Space>
            <CodeOutlined style={{ color: uiPalette.primary }} />
            <span>{payloadPreview.title || '请求载荷'}</span>
          </Space>
        }
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
    </UiTestPage>
  );
};

export default RunDetail;
