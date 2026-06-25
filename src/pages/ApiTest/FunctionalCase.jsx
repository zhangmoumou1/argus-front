import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Col,
  Drawer,
  Dropdown,
  Empty,
  Image,
  Input,
  InputNumber,
  List,
  Menu,
  Modal,
  Popconfirm,
  Row,
  Steps,
  Select,
  Slider,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Tree,
  TreeSelect,
  Upload,
  message,
  notification,
} from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { connect, history, useLocation } from '@umijs/max';
import JSZip from 'jszip';
import {
  ApartmentOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  BorderOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  ExportOutlined,
  FileImageOutlined,
  FolderAddOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FormatPainterOutlined,
  FontColorsOutlined,
  HighlightOutlined,
  LinkOutlined,
  MoreOutlined,
  PaperClipOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  LeftOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  SmileOutlined,
  StarOutlined,
  StopOutlined,
  SyncOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  HistoryOutlined,
  UploadOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { FolderCode } from '@icon-park/react';
import MindMap from 'simple-mind-map';
import MindMapAssociativeLine from 'simple-mind-map/src/plugins/AssociativeLine';
import MindMapDrag from 'simple-mind-map/src/plugins/Drag';
import MindMapExport from 'simple-mind-map/src/plugins/Export';
import MindMapExportXMind from 'simple-mind-map/src/plugins/ExportXMind';
import MindMapFormula from 'simple-mind-map/src/plugins/Formula';
import MindMapSelect from 'simple-mind-map/src/plugins/Select';
import 'simple-mind-map/dist/simpleMindMap.esm.min.css';
import {
  deleteFunctionalCaseDirectory,
  deleteFunctionalCaseFile,
  insertFunctionalCaseDirectory,
  insertFunctionalCaseFile,
  listFunctionalCaseDirectory,
  listFunctionalCaseFiles,
  listFunctionalCaseSkillDocs,
  moveFunctionalCaseDirectory,
  moveFunctionalCaseFile,
  queryFunctionalCaseFile,
  cancelFunctionalCaseGenerateTask,
  generateFunctionalCaseByModel,
  queryFunctionalCaseGenerateTask,
  uploadFunctionalCaseNodeAttachment,
  uploadFunctionalCaseNodeImage,
  updateFunctionalCaseDirectory,
  updateFunctionalCaseFile,
} from '@/services/functionalCase';
import { listEnvironment, listGateway } from '@/services/configure';
import {
  getUiTestRunDetail,
  listUiTestCaseNodes,
  listUiTestCases,
  listUiTestRuns,
  previewUiTestDsl,
  subscribeUiTestDebugStream,
  stopUiTestRun,
  trialRunUiTestCase,
  trialRunUiTestCases,
  validateUiTestCase,
} from '@/services/uiTest';
import CONFIG from '@/consts/config';
import {
  DslCodeBlock,
  InsetCard,
  Kv,
  PillButton,
  RefreshButton,
  UiEmpty,
  uiPalette,
  uiStatusTag,
} from '@/pages/UITest/shared';
import './FunctionalCase.less';

const { Option } = Select;

const registerMindMapPlugin = (flag, plugin) => {
  if (!MindMap[flag]) {
    MindMap['usePlugin']?.(plugin);
    MindMap[flag] = true;
  }
};

registerMindMapPlugin('functionalCaseSelectPluginRegistered', MindMapSelect);
registerMindMapPlugin('functionalCaseDragPluginRegistered', MindMapDrag);
registerMindMapPlugin('functionalCaseExportPluginRegistered', MindMapExport);
registerMindMapPlugin('functionalCaseExportXMindPluginRegistered', MindMapExportXMind);
registerMindMapPlugin('functionalCaseFormulaPluginRegistered', MindMapFormula);
registerMindMapPlugin('functionalCaseAssociativeLinePluginRegistered', MindMapAssociativeLine);

const buildThemeConfig = (backgroundColor, lineColor, rootFill, secondFill, secondColor) => ({
  backgroundColor,
  lineColor,
  root: { fillColor: rootFill, color: '#fff', borderColor: rootFill },
  second: { fillColor: secondFill, color: secondColor, borderColor: lineColor },
  node: { fillColor: '#fff', color: secondColor, borderColor: '#d8e3f4' },
});

const THEME_CATEGORY_TABS = [
  { key: 'classic', label: '经典' },
  { key: 'dark', label: '深色' },
  { key: 'plain', label: '朴素' },
];

const THEME_PRESETS = [
  { category: 'classic', label: '默认主题', value: 'classic-default', config: buildThemeConfig('#fbfefc', '#5aa37a', '#16834a', '#ecfdf3', '#173c2a') },
  { category: 'classic', label: '脑图经典15', value: 'classic-15', config: buildThemeConfig('#e9f6fb', '#6f7dc5', '#32407f', '#f6cf6f', '#3f4f8f') },
  { category: 'classic', label: '脑图经典14', value: 'classic-14', config: buildThemeConfig('#efe3c9', '#b88756', '#0f8f84', '#edd0a6', '#7f5837') },
  { category: 'classic', label: '脑图经典13', value: 'classic-13', config: buildThemeConfig('#f7f7f7', '#5f6f85', '#f5cc21', '#d5e7f0', '#3b4f63') },
  { category: 'classic', label: '脑图经典12', value: 'classic-12', config: buildThemeConfig('#ecfcf4', '#58b89d', '#2acb93', '#ecfff4', '#1d6c5a') },
  { category: 'dark', label: '深海夜色', value: 'dark-ocean', config: buildThemeConfig('#1b2533', '#5e9cff', '#0b4a9e', '#253347', '#d8e7ff') },
  { category: 'dark', label: '深空紫', value: 'dark-purple', config: buildThemeConfig('#221d2f', '#9b8cff', '#5a3cbe', '#2f2842', '#e5dcff') },
  { category: 'dark', label: '石墨黑金', value: 'dark-gold', config: buildThemeConfig('#242422', '#bca66b', '#6d5a29', '#322f28', '#f4ebd2') },
  { category: 'dark', label: '夜幕青绿', value: 'dark-green', config: buildThemeConfig('#152621', '#58b89d', '#166f62', '#20362f', '#d9f5eb') },
  { category: 'plain', label: '简约灰', value: 'plain-gray', config: buildThemeConfig('#f7f9fc', '#94a3b8', '#64748b', '#ecf1f7', '#334155') },
  { category: 'plain', label: '雾霾蓝', value: 'plain-blue', config: buildThemeConfig('#f3f7ff', '#7da3de', '#4f79bb', '#e9f0fd', '#2f4f85') },
  { category: 'plain', label: '浅草绿', value: 'plain-green', config: buildThemeConfig('#f3fdf7', '#7dbb8e', '#4f9972', '#e8faef', '#2d6347') },
  { category: 'plain', label: '暖米杏', value: 'plain-beige', config: buildThemeConfig('#fff8ef', '#caa674', '#b28554', '#f9eddc', '#6f4f2f') },
];

const FORMAT_BRUSH_STYLE_KEYS = [
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textDecoration',
  'textAlign',
  'borderColor',
  'borderWidth',
  'borderRadius',
  'fillColor',
  'shape',
  'lineColor',
  'lineWidth',
  'lineStyle',
  'paddingX',
  'paddingY',
];

const PRIORITY_COLORS = ['#f04438', '#f79009', '#2563eb', '#667085', '#667085', '#667085', '#667085', '#667085', '#667085', '#667085'];
const MAX_NODE_ICONS = 6;
const LARGE_CASE_NODE_THRESHOLD = 250;
const HUGE_CASE_NODE_THRESHOLD = 500;
const XMIND_TASK_MARKERS = ['task-start', 'task-oct', 'task-quarter', 'task-3oct', 'task-half', 'task-5oct', 'task-3quar', 'task-7oct', 'task-done'];
const UNSAVED_CASE_CLOSE_TEXT = '你有未保存用例，是否关闭窗口';

const escapeSvgText = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const circleIconSvg = (text, fill, color = '#fff') => (
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="${fill}"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" font-weight="700" fill="${color}">${escapeSvgText(text)}</text></svg>`
);

const progressIconSvg = (step) => {
  const safeStep = Math.max(1, Math.min(8, step));
  if (safeStep >= 8) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b943" stroke="#10b943" stroke-width="2"/><path d="M7.7 12.3l2.5 2.5 6-6.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const angle = (safeStep / 8) * 359.9;
  const radians = (angle - 90) * (Math.PI / 180);
  const x = 12 + 10 * Math.cos(radians);
  const y = 12 + 10 * Math.sin(radians);
  const largeArc = angle > 180 ? 1 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fff" stroke="#10b943" stroke-width="2"/><path d="M12 12 L12 2 A10 10 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z" fill="#10b943"/><circle cx="12" cy="12" r="10" fill="none" stroke="#10b943" stroke-width="2"/></svg>`;
};

const squareIconSvg = (text, fill, color = '#1f2937') => (
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="${fill}"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Arial, sans-serif" font-weight="700" fill="${color}">${escapeSvgText(text)}</text></svg>`
);

const buildIconItem = (type, name, label, icon) => ({
  name,
  label,
  value: `${type}_${name}`,
  icon,
});

const ICON_GROUPS = [
  {
    label: '优先级图标',
    type: 'priority',
    items: Array.from({ length: 10 }, (_, index) => {
      const level = index + 1;
      return buildIconItem('priority', String(level), `优先级${level}`, circleIconSvg(level, PRIORITY_COLORS[index]));
    }),
  },
  {
    label: '进度图标',
    type: 'progress',
    items: Array.from({ length: 8 }, (_, index) => {
      const step = index + 1;
      return buildIconItem('progress', String(step), `进度${step}/8`, progressIconSvg(step));
    }),
  },
  {
    label: '标记图标',
    type: 'mark',
    items: [
      buildIconItem('mark', 'done', '完成', circleIconSvg('✓', '#16a34a')),
      buildIconItem('mark', 'error', '错误', circleIconSvg('×', '#ef4444')),
      buildIconItem('mark', 'star', '星标', circleIconSvg('★', '#f59e0b')),
      buildIconItem('mark', 'info', '提示', circleIconSvg('!', '#3b82f6')),
      buildIconItem('mark', 'question', '疑问', circleIconSvg('?', '#64748b')),
      buildIconItem('mark', 'warn', '风险', circleIconSvg('!', '#f97316')),
      buildIconItem('mark', 'flag', '旗标', squareIconSvg('⚑', '#fee2e2', '#dc2626')),
      buildIconItem('mark', 'lock', '锁定', squareIconSvg('🔒', '#e2e8f0', '#334155')),
      buildIconItem('mark', 'thumb', '点赞', squareIconSvg('👍', '#dcfce7', '#15803d')),
      buildIconItem('mark', 'phone', '电话', squareIconSvg('☎', '#dbeafe', '#2563eb')),
    ],
  },
  {
    label: '彩色贴纸',
    type: 'sticker',
    items: [
      buildIconItem('sticker', 'heart', '爱心', circleIconSvg('♥', '#fb7185')),
      buildIconItem('sticker', 'fire', '火焰', circleIconSvg('🔥', '#f97316')),
      buildIconItem('sticker', 'bell', '提醒', circleIconSvg('🔔', '#facc15', '#7c2d12')),
      buildIconItem('sticker', 'chat', '沟通', circleIconSvg('…', '#38bdf8')),
      buildIconItem('sticker', 'gift', '礼物', circleIconSvg('🎁', '#a855f7')),
      buildIconItem('sticker', 'trophy', '奖杯', circleIconSvg('🏆', '#f59e0b')),
      buildIconItem('sticker', 'user', '人员', circleIconSvg('人', '#94a3b8')),
      buildIconItem('sticker', 'group', '团队', circleIconSvg('群', '#64748b')),
      buildIconItem('sticker', 'bug', '缺陷', circleIconSvg('虫', '#22c55e')),
      buildIconItem('sticker', 'test', '验证', circleIconSvg('测', '#06b6d4')),
    ],
  },
];

const MIND_ICON_LIST = ICON_GROUPS.map((group) => ({
  name: group.label,
  type: group.type,
  list: group.items.map((item) => ({
    name: item.name,
    icon: item.icon,
  })),
}));

const ICON_ITEM_MAP = ICON_GROUPS.reduce((map, group) => {
  group.items.forEach((item) => {
    map[item.value] = item;
  });
  return map;
}, {});

const ICON_LABEL_VALUE_MAP = ICON_GROUPS.reduce((map, group) => {
  group.items.forEach((item) => {
    if (!map[item.label]) {
      map[item.label] = [];
    }
    map[item.label].push(item.value);
  });
  return map;
}, {});

const getTagLabelText = (item) => {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'number') return String(item);
  if (typeof item === 'object') {
    const candidate = item.text || item.title || item.label || item.name || item.value || '';
    return String(candidate).trim();
  }
  return '';
};

const SHAPE_OPTIONS = [
  { label: '矩形', value: 'rectangle' },
  { label: '圆角矩形', value: 'roundedRectangle' },
  { label: '菱形', value: 'diamond' },
  { label: '圆', value: 'circle' },
  { label: '平行四边形', value: 'parallelogram' },
  { label: '八角矩形', value: 'octagonalRectangle' },
];

const COLOR_SWATCHES = [
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#94a3b8',
  '#1f2937',
  '#0f172a',
  '#020617',
  '#dbeafe',
  '#bfdbfe',
  '#60a5fa',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#d1fae5',
  '#a7f3d0',
  '#34d399',
  '#059669',
  '#047857',
  '#064e3b',
  '#ecfeff',
  '#a5f3fc',
  '#06b6d4',
  '#0e7490',
  '#f0fdf4',
  '#86efac',
  '#22c55e',
  '#15803d',
  '#fef3c7',
  '#fef9c3',
  '#fde047',
  '#ca8a04',
  '#f59e0b',
  '#b45309',
  '#7c2d12',
  '#fee2e2',
  '#f87171',
  '#dc2626',
  '#b91c1c',
  '#7f1d1d',
  '#fff1f2',
  '#fda4af',
  '#e11d48',
  '#9f1239',
  '#fae8ff',
  '#f3e8ff',
  '#c4b5fd',
  '#8b5cf6',
  '#6d28d9',
  '#ede9fe',
  '#a5b4fc',
  '#6366f1',
  '#4338ca',
  '#d946ef',
  '#a21caf',
];

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32];

const LINE_STYLE_OPTIONS = [
  { label: '直线', value: 'straight' },
  { label: '曲线', value: 'curve' },
  { label: '直连', value: 'direct' },
];

const FONT_FAMILY_OPTIONS = [
  { label: '微软雅黑', value: '微软雅黑, Microsoft YaHei' },
  { label: '宋体', value: 'SimSun, 宋体' },
  { label: '黑体', value: 'SimHei, 黑体' },
  { label: 'Arial', value: 'Arial' },
];

const LAYOUT_GROUPS = [
  {
    title: '逻辑结构图',
    items: [
      { label: '向右逻辑', value: 'logicalStructure', preview: 'logic-right' },
      { label: '向左逻辑', value: 'logicalStructureLeft', preview: 'logic-left' },
    ],
  },
  {
    title: '思维导图',
    items: [{ label: '左右展开', value: 'mindMap', preview: 'mind-map' }],
  },
  {
    title: '组织结构图',
    items: [{ label: '组织结构', value: 'organizationStructure', preview: 'organization' }],
  },
  {
    title: '目录组织图',
    items: [{ label: '目录组织', value: 'catalogOrganization', preview: 'catalog' }],
  },
  {
    title: '时间轴',
    items: [
      { label: '时间轴1', value: 'timeline', preview: 'timeline-a' },
      { label: '时间轴2', value: 'timeline2', preview: 'timeline-b' },
      { label: '垂直时间轴', value: 'verticalTimeline', preview: 'timeline-c' },
    ],
  },
  {
    title: '鱼骨图',
    items: [{ label: '鱼骨图', value: 'fishbone', preview: 'fishbone' }],
  },
];

const SIDE_PANELS = [
  { key: 'node', label: '节点样式', icon: <StarOutlined /> },
  { key: 'base', label: '基础样式', icon: <HighlightOutlined /> },
  { key: 'theme', label: '主题', icon: <BgColorsOutlined /> },
  { key: 'structure', label: '结构', icon: <ApartmentOutlined /> },
  { key: 'outline', label: '大纲', icon: <AppstoreOutlined /> },
  { key: 'setting', label: '设置', icon: <SettingOutlined /> },
];

const EXPORT_OPTIONS = [
  {
    key: 'png',
    label: '图片',
    format: '.png',
    description: 'PNG图片格式',
    option: '高清图片',
    icon: <PictureOutlined />,
  },
  {
    key: 'xmind',
    label: 'XMind',
    format: '.xmind',
    description: 'XMind软件格式（自定义样式兼容有限）',
    option: '保留结构，通用图标转为 XMind 可读标记',
    icon: <ExportOutlined />,
  },
  {
    key: 'markdown',
    label: 'Markdown',
    format: '.md',
    description: 'Markdown文本格式',
    option: '保留层级结构',
    icon: <FileTextOutlined />,
  },
];

const AI_UPLOAD_ACCEPT = '.png,.jpg,.jpeg,.webp,.bmp';
const DESIGN_LINK_PLACEHOLDER = '支持 Figma / 蓝湖 / 墨刀 / 原型地址';
const DEFAULT_SKILL_AI_GENERATE_INSTRUCTION = '按前置条件/操作步骤/预期结果组织，补齐正常、异常、边界场景，并尽量贴近已选模板和规范。';
const DEFAULT_SKILL_AI_REVIEW_INSTRUCTION = '生成前先自检命名规范、优先级标记、层级结构和覆盖完整性，不符合时按审查标准修正后再输出。';
const FUNCTIONAL_CASE_ROUTE_PATH = '/scene-design/functionalCase';
const FUNCTIONAL_CASE_RESULT_STORAGE_PREFIX = 'functional_case_skill_result_';
const FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY = 'functional_case_skill_active_tasks';

const createSkillRequirementItem = () => ({
  key: `requirement_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  text: '',
  fileList: [],
  designLinks: [''],
});

const parseSkillTaskTimeToMs = (value) => {
  if (!value && value !== 0) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  const raw = String(value).trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) {
    const numericValue = Number(raw);
    return numericValue > 1e12 ? numericValue : numericValue * 1000;
  }
  const parsed = new Date(raw.replace('T', ' ').replace(/-/g, '/')).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSkillTaskElapsedText = (durationMs) => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return '';
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}秒`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分钟${seconds}秒`;
};

const resolveSkillTaskElapsedText = ({
  taskLogs,
  startedAt,
  finishedAt,
  fallbackStartedAt,
  fallbackFinishedAt,
}) => {
  const logList = Array.isArray(taskLogs) ? taskLogs : [];
  const firstLogTime = parseSkillTaskTimeToMs(logList[0]?.time);
  const lastLogTime = parseSkillTaskTimeToMs(logList[logList.length - 1]?.time);
  const startMs = parseSkillTaskTimeToMs(startedAt) || firstLogTime || parseSkillTaskTimeToMs(fallbackStartedAt);
  const endMs = parseSkillTaskTimeToMs(finishedAt) || lastLogTime || parseSkillTaskTimeToMs(fallbackFinishedAt);
  if (!startMs || !endMs || endMs < startMs) return '';
  return formatSkillTaskElapsedText(endMs - startMs);
};

const appendElapsedToSkillText = (text, elapsedText) => {
  if (!elapsedText) return text;
  if (!text) return `耗时 ${elapsedText}`;
  if (String(text).includes('耗时')) return text;
  const normalizedText = String(text).replace(/[。，、；;：:]+$/u, '');
  return `${normalizedText}，耗时 ${elapsedText}`;
};

const isFunctionalCaseRoutePath = (pathname = '') => {
  const lowerPath = String(pathname || '').trim().toLowerCase();
  return lowerPath === '/scene-design/functionalcase'
    || lowerPath === '/scenario/functionalcase'
    || lowerPath === '/apitest/functionalcase';
};

const buildFunctionalCaseResultToken = (taskId, caseId) => {
  const rawTaskId = String(taskId || '').trim();
  if (rawTaskId) return rawTaskId;
  return `case_${caseId || 'unknown'}_${Date.now()}`;
};

const buildFunctionalCaseResultUrl = ({ projectId, caseId, resultToken }) => {
  const query = new URLSearchParams();
  if (projectId) query.set('projectId', String(projectId));
  if (caseId) query.set('caseId', String(caseId));
  if (resultToken) query.set('resultToken', String(resultToken));
  const search = query.toString();
  return search ? `${FUNCTIONAL_CASE_ROUTE_PATH}?${search}` : FUNCTIONAL_CASE_ROUTE_PATH;
};

const getFunctionalCaseResultStorageKey = (resultToken) => `${FUNCTIONAL_CASE_RESULT_STORAGE_PREFIX}${resultToken}`;

const persistFunctionalCaseResult = (resultToken, payload) => {
  if (!resultToken || !payload) return;
  window.__FUNCTIONAL_CASE_RESULT_CACHE__ = window.__FUNCTIONAL_CASE_RESULT_CACHE__ || {};
  window.__FUNCTIONAL_CASE_RESULT_CACHE__[resultToken] = payload;
  try {
    sessionStorage.setItem(getFunctionalCaseResultStorageKey(resultToken), JSON.stringify(payload));
  } catch (error) {
    // ignore storage quota errors and keep in-memory fallback
  }
};

const readFunctionalCaseResult = (resultToken) => {
  if (!resultToken) return null;
  const memoryPayload = window.__FUNCTIONAL_CASE_RESULT_CACHE__?.[resultToken];
  if (memoryPayload && typeof memoryPayload === 'object') {
    return memoryPayload;
  }
  try {
    const raw = sessionStorage.getItem(getFunctionalCaseResultStorageKey(resultToken));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
};

const clearFunctionalCaseResult = (resultToken) => {
  if (!resultToken) return;
  if (window.__FUNCTIONAL_CASE_RESULT_CACHE__) {
    delete window.__FUNCTIONAL_CASE_RESULT_CACHE__[resultToken];
  }
  try {
    sessionStorage.removeItem(getFunctionalCaseResultStorageKey(resultToken));
  } catch (error) {
    // ignore storage errors
  }
};

const readFunctionalCaseActiveTasks = () => {
  try {
    const raw = sessionStorage.getItem(FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.taskId) : [];
  } catch (error) {
    return [];
  }
};

const writeFunctionalCaseActiveTasks = (tasks) => {
  try {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      sessionStorage.removeItem(FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // ignore storage errors
  }
};

const registerFunctionalCaseActiveTask = (taskPayload) => {
  if (!taskPayload?.taskId && taskPayload?.taskId !== 0) return;
  const taskIdText = String(taskPayload.taskId);
  const nextTasks = readFunctionalCaseActiveTasks().filter((item) => String(item?.taskId) !== taskIdText);
  nextTasks.push(taskPayload);
  writeFunctionalCaseActiveTasks(nextTasks);
};

const unregisterFunctionalCaseActiveTask = (taskId) => {
  if (!taskId && taskId !== 0) return;
  const taskIdText = String(taskId);
  const remainTasks = readFunctionalCaseActiveTasks().filter((item) => String(item?.taskId) !== taskIdText);
  writeFunctionalCaseActiveTasks(remainTasks);
  try {
    if (Array.isArray(window.__FUNCTIONAL_CASE_ACTIVE_TASKS__)) {
      window.__FUNCTIONAL_CASE_ACTIVE_TASKS__ = window.__FUNCTIONAL_CASE_ACTIVE_TASKS__.filter(
        (item) => String(item?.taskId) !== taskIdText,
      );
    }
  } catch (error) {
    // ignore global cache errors
  }
};

const defaultCaseData = (title) => ({
  data: {
    text: title || '功能用例',
    case_uid: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `case_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  },
  children: [],
});

const isFullMindData = (data) => Boolean(data && typeof data === 'object' && data.root && data.root.data);

const getMindRootData = (data) => (isFullMindData(data) ? data.root : data);

const cloneMindData = (data) => {
  if (!data || typeof data !== 'object') return data;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    return data;
  }
};

const tryParseJsonString = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

const parseOutlineTextToMindData = (value) => {
  if (typeof value !== 'string') return null;
  const lines = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\t/g, '  '))
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;
  const nodeList = lines.map((line) => {
    const indent = line.match(/^\s*/)?.[0] || '';
    const level = Math.floor(indent.length / 2);
    const text = line.trim().replace(/^[-*+]\s+/, '') || '新节点';
    return { level, text };
  });
  const root = { data: { text: nodeList[0].text }, children: [] };
  const stack = [{ level: -1, node: root }];
  nodeList.slice(1).forEach((item) => {
    const node = { data: { text: item.text }, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1]?.node || root;
    parent.children = parent.children || [];
    parent.children.push(node);
    stack.push({ level: item.level, node });
  });
  return root;
};

const extractTopicMarkers = (topic) => {
  const directMarkers = Array.isArray(topic?.markers) ? topic.markers : [];
  const markerRefs = Array.isArray(topic?.markerRefs) ? topic.markerRefs : [];
  const extensionMarkers = Array.isArray(topic?.extensions)
    ? topic.extensions.flatMap((ext) => {
      if (Array.isArray(ext?.content?.markers)) return ext.content.markers;
      if (Array.isArray(ext?.markers)) return ext.markers;
      return [];
    })
    : [];
  const all = [...directMarkers, ...markerRefs, ...extensionMarkers];
  return all
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      return item.markerId || item.id || item.ref || item.marker || '';
    })
    .map((value) => String(value || '').trim())
    .filter(Boolean);
};

const collectMarkerHintsFromObject = (source, depth = 0) => {
  if (!source || depth > 4) return [];
  const results = [];
  if (Array.isArray(source)) {
    source.forEach((item) => {
      results.push(...collectMarkerHintsFromObject(item, depth + 1));
    });
    return results;
  }
  if (typeof source !== 'object') return results;
  Object.entries(source).forEach(([key, value]) => {
    const keyText = String(key || '').toLowerCase();
    const keyHit = /(marker|priority|progress|task|flag|status|icon)/.test(keyText);
    if (typeof value === 'string' || typeof value === 'number') {
      if (keyHit) {
        results.push(`${key}:${value}`);
        results.push(String(value));
      }
    } else if (Array.isArray(value) || (value && typeof value === 'object')) {
      if (keyHit && value && typeof value === 'object' && !Array.isArray(value)) {
        ['markerId', 'id', 'name', 'value', 'key', 'ref'].forEach((field) => {
          if (value[field] !== undefined && value[field] !== null) {
            results.push(String(value[field]));
          }
        });
      }
      results.push(...collectMarkerHintsFromObject(value, depth + 1));
    }
  });
  return results;
};

const mapMarkerToIcon = (markerRaw) => {
  const markerId = String(markerRaw || '').toLowerCase().trim();
  const plainMarker = markerId.replace(/^.*[:/]/, '');
  const priorityMatch = /priority[-_]?(\d+)/.exec(plainMarker) || /pri[-_]?(\d+)/.exec(plainMarker);
  if (priorityMatch) {
    const level = Math.max(1, Math.min(9, Number(priorityMatch[1] || 1)));
    return `priority_${level}`;
  }
  const pMatch = /(?:^|\b)p([1-9])(?:\b|$)/.exec(plainMarker);
  if (pMatch) {
    return `priority_${Math.max(1, Math.min(9, Number(pMatch[1])))}`
  }
  const zhPriority = /优先级\s*([1-9])/.exec(plainMarker);
  if (zhPriority) {
    return `priority_${Math.max(1, Math.min(9, Number(zhPriority[1])))}`
  }
  const taskIndex = XMIND_TASK_MARKERS.findIndex((item) => plainMarker.endsWith(item));
  if (taskIndex >= 0) {
    return `progress_${Math.max(1, Math.min(8, taskIndex))}`;
  }
  const progressMatch = /task[-_]?(\d+)/.exec(plainMarker) || /progress[-_]?(\d+)/.exec(plainMarker);
  if (progressMatch) {
    const step = Math.max(1, Math.min(8, Number(progressMatch[1] || 1)));
    return `progress_${step}`;
  }
  const percent = /([1-9]\d?|100)\s*%/.exec(plainMarker);
  if (percent) {
    const value = Number(percent[1]);
    const step = Math.max(1, Math.min(8, Math.round((value / 100) * 8)));
    return `progress_${step}`;
  }
  if (/(已完成|完成|done|completed)/.test(plainMarker)) return 'progress_8';
  if (/(未开始|start|todo|待处理)/.test(plainMarker)) return 'progress_1';
  if (/(进行中|in[\s_-]?progress|doing)/.test(plainMarker)) return 'progress_4';
  return null;
};

const collectHtmlMarkerValues = (element) => {
  if (!(element instanceof HTMLElement)) return [];
  const values = [];
  const classNames = String(element.className || '').split(/\s+/).filter(Boolean);
  values.push(...classNames);
  ['data-marker-id', 'data-marker', 'data-icon', 'title', 'alt', 'aria-label'].forEach((attr) => {
    const value = element.getAttribute(attr);
    if (value) values.push(value);
  });
  const descendants = element.querySelectorAll('*');
  descendants.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const childClasses = String(node.className || '').split(/\s+/).filter(Boolean);
    values.push(...childClasses);
    ['data-marker-id', 'data-marker', 'data-icon', 'title', 'alt', 'aria-label'].forEach((attr) => {
      const value = node.getAttribute(attr);
      if (value) values.push(value);
    });
  });
  return values;
};

const parseHtmlToMindData = (html) => {
  if (typeof html !== 'string' || !html.trim()) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rootList = doc.body.querySelector('ul,ol');
    if (!rootList) return null;
    const buildFromLi = (li) => {
      const cloned = li.cloneNode(true);
      const nestedList = cloned.querySelector(':scope > ul, :scope > ol');
      if (nestedList) nestedList.remove();
      const text = stripHtmlText(cloned.textContent || '').trim() || '新节点';
      const rawMarkers = collectHtmlMarkerValues(li);
      const iconList = rawMarkers.map((marker) => mapMarkerToIcon(marker)).filter(Boolean);
      const node = {
        data: {
          text,
        },
        children: [],
      };
      if (iconList.length > 0) {
        node.data.icon = normalizeNodeIcons(iconList);
      }
      const childList = li.querySelector(':scope > ul, :scope > ol');
      if (childList) {
        node.children = Array.from(childList.children || [])
          .filter((child) => child.tagName?.toLowerCase?.() === 'li')
          .map((child) => buildFromLi(child))
          .filter(Boolean);
      }
      return node;
    };
    const topNodes = Array.from(rootList.children || [])
      .filter((child) => child.tagName?.toLowerCase?.() === 'li')
      .map((li) => buildFromLi(li))
      .filter(Boolean);
    if (topNodes.length === 0) return null;
    if (topNodes.length === 1) return topNodes[0];
    return {
      data: { text: '粘贴内容' },
      children: topNodes,
    };
  } catch (error) {
    return null;
  }
};

const extractEmbeddedJsonBlocks = (text) => {
  if (typeof text !== 'string' || !text.trim()) return [];
  const blocks = [];
  const regexList = [
    /\{[\s\S]*"rootTopic"[\s\S]*\}/g,
    /\[[\s\S]*"rootTopic"[\s\S]*\]/g,
    /\{[\s\S]*"marker[sR]?"[\s\S]*\}/g,
  ];
  regexList.forEach((regex) => {
    let match = regex.exec(text);
    while (match) {
      blocks.push(match[0]);
      match = regex.exec(text);
    }
  });
  return Array.from(new Set(blocks)).slice(0, 10);
};

const parseRtfToMindData = (rtfText) => {
  if (typeof rtfText !== 'string' || !rtfText.trim()) return null;
  const embedded = extractEmbeddedJsonBlocks(rtfText);
  for (const block of embedded) {
    const parsed = tryParseJsonString(block);
    const normalized = normalizeClipboardMindData(parsed);
    if (normalized) return normalized;
  }
  return null;
};

const convertXMindTopicToMindNode = (topic) => {
  if (!topic || typeof topic !== 'object') return null;
  const markerHints = [
    ...extractTopicMarkers(topic),
    ...collectMarkerHintsFromObject(topic),
    topic?.title,
    topic?.name,
  ];
  const markerIcons = markerHints
    .map((marker) => mapMarkerToIcon(marker))
    .filter(Boolean);
  const topicStyle = topic.style || {};
  const textColor = topicStyle.color || topicStyle.fontColor || topicStyle.textColor;
  const fillColor = topicStyle.fill || topicStyle.fillColor || topicStyle.backgroundColor;
  const borderColor = topicStyle.borderColor || topicStyle.stroke || topicStyle.lineColor;
  const node = {
    data: {
      text: stripHtmlText(topic.title || topic.name || '新节点'),
    },
    children: [],
  };
  if (topic.href) node.data.hyperlink = topic.href;
  const plainNote = topic.notes?.plain?.content;
  if (plainNote) node.data.note = stripHtmlText(plainNote);
  if (markerIcons.length > 0) {
    node.data.icon = normalizeNodeIcons(markerIcons);
  }
  if (Array.isArray(topic.labels) && topic.labels.length > 0) {
    node.data.tag = topic.labels.filter(Boolean);
  }
  if (textColor) node.data.color = textColor;
  if (fillColor) node.data.fillColor = fillColor;
  if (borderColor) node.data.borderColor = borderColor;
  if (topicStyle.fontSize !== undefined && topicStyle.fontSize !== null) {
    node.data.fontSize = Number(topicStyle.fontSize) || topicStyle.fontSize;
  }
  if (topicStyle.fontWeight) node.data.fontWeight = topicStyle.fontWeight;
  if (topicStyle.fontStyle) node.data.fontStyle = topicStyle.fontStyle;
  const children = [
    ...(topic.children?.attached || []),
    ...(topic.children?.detached || []),
  ];
  node.children = children
    .map((child) => convertXMindTopicToMindNode(child))
    .filter(Boolean);
  return node;
};

const normalizeClipboardMindData = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.simpleMindMap) {
    const payload = raw.data;
    if (Array.isArray(payload)) {
      const wrapped = sanitizeMindData({
        data: { text: '粘贴内容' },
        children: payload,
      });
      return markClipboardSource(wrapped, 'simpleMindMap');
    }
    const nested = normalizeClipboardMindData(payload);
    return markClipboardSource(nested, 'simpleMindMap');
  }
  if (raw.root?.data || raw.data) {
    return sanitizeMindData(raw);
  }
  if (raw.rootTopic) {
    const root = convertXMindTopicToMindNode(raw.rootTopic);
    return markClipboardSource(root ? sanitizeMindData(root) : null, 'xmind');
  }
  if (Array.isArray(raw) && raw[0]?.rootTopic) {
    const root = convertXMindTopicToMindNode(raw[0].rootTopic);
    return markClipboardSource(root ? sanitizeMindData(root) : null, 'xmind');
  }
  return null;
};

const normalizeNodeIcons = (icons) => {
  const rawIcons = Array.isArray(icons) ? icons : [icons].filter(Boolean);
  const priorityIcon = rawIcons.find((icon) => /^priority_\d+$/.test(icon));
  const progressIcon = rawIcons.find((icon) => /^progress_\d+$/.test(icon));
  const otherIcons = rawIcons.filter((icon) => icon !== priorityIcon && icon !== progressIcon);
  return [priorityIcon, progressIcon, ...otherIcons].filter(Boolean).slice(0, MAX_NODE_ICONS);
};

const normalizeNodeImageUrl = (imageValue) => {
  if (!imageValue) return '';
  if (typeof imageValue === 'string') return imageValue;
  if (typeof imageValue === 'object') {
    if (typeof imageValue.url === 'string') return imageValue.url;
    if (typeof imageValue.src === 'string') return imageValue.src;
  }
  return '';
};

const loadImageNaturalSize = (url) => new Promise((resolve) => {
  if (!url) {
    resolve(null);
    return;
  }
  const img = new window.Image();
  img.onload = () => {
    const width = Number(img.naturalWidth || img.width || 0);
    const height = Number(img.naturalHeight || img.height || 0);
    if (width > 0 && height > 0) {
      resolve({ width, height });
      return;
    }
    resolve(null);
  };
  img.onerror = () => resolve(null);
  img.src = url;
});

const restoreIconsFromTags = (nodeData = {}) => {
  const rawTags = Array.isArray(nodeData.tag) ? nodeData.tag : [nodeData.tag].filter(Boolean);
  if (rawTags.length === 0) return;
  const remainTags = [];
  const tagIcons = [];
  rawTags.forEach((item) => {
    const label = getTagLabelText(item);
    const mapped = ICON_LABEL_VALUE_MAP[label];
    if (mapped?.length) {
      tagIcons.push(...mapped);
      return;
    }
    remainTags.push(item);
  });
  if (tagIcons.length > 0) {
    const rawIcons = Array.isArray(nodeData.icon) ? nodeData.icon : [nodeData.icon].filter(Boolean);
    nodeData.icon = normalizeNodeIcons([...rawIcons, ...tagIcons]);
  }
  if (remainTags.length === 0) {
    delete nodeData.tag;
  } else {
    nodeData.tag = remainTags;
  }
};

const normalizeMindNodeIcons = (node) => {
  if (!node?.data) return;
  if (node.data.richText || /<[^>]+>/.test(String(node.data.text || ''))) {
    node.data.text = stripHtmlText(node.data.text);
  }
  delete node.data.richText;
  delete node.data.resetRichText;
  delete node.data.customTextWidth;
  restoreIconsFromTags(node.data);
  if (node.data.icon) {
    node.data.icon = normalizeNodeIcons(node.data.icon);
  }
  (node.children || []).forEach(normalizeMindNodeIcons);
};

const generateCaseUid = () => (
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `case_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
);

const ensureNodeCaseUid = (node, used = new Set()) => {
  if (!node || typeof node !== 'object') return;
  if (!node.data || typeof node.data !== 'object') {
    node.data = { case_uid: generateCaseUid() };
  } else if (!node.data.case_uid) {
    node.data.case_uid = generateCaseUid();
  }
  let uid = String(node.data.case_uid || '').trim();
  if (!uid) {
    uid = generateCaseUid();
    node.data.case_uid = uid;
  }
  if (used.has(uid)) {
    uid = generateCaseUid();
    node.data.case_uid = uid;
  }
  used.add(uid);
  (node.children || []).forEach((child) => ensureNodeCaseUid(child, used));
};

const sanitizeMindData = (data, fallbackTitle = '') => {
  if (!data || typeof data !== 'object') return data;
  const cloned = cloneMindData(data);
  const root = getMindRootData(cloned);
  if (root?.data) {
    root.data.text = String(root.data.text || fallbackTitle || '功能用例').trim() || fallbackTitle || '功能用例';
  }
  ensureNodeCaseUid(root);
  normalizeMindNodeIcons(root);
  if (isFullMindData(cloned)) {
    delete cloned.view;
  }
  return cloned;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`读取文件「${file?.name || '未命名图片'}」失败`));
    reader.readAsDataURL(file);
  });

const stripHtmlText = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const getXMindMarkers = (icons = []) => normalizeNodeIcons(icons)
  .map((icon) => {
    const priorityMatch = /^priority_(\d+)$/.exec(icon);
    if (priorityMatch) {
      return { markerId: `priority-${Math.min(9, Number(priorityMatch[1]))}` };
    }
    const progressMatch = /^progress_(\d+)$/.exec(icon);
    if (progressMatch) {
      return { markerId: XMIND_TASK_MARKERS[Math.max(0, Math.min(8, Number(progressMatch[1])))] };
    }
    return null;
  })
  .filter(Boolean);

const buildXMindTopic = (node, indexPath = '0') => {
  const data = node?.data || {};
  const topic = {
    id: data.uid || `functional_case_${indexPath}`,
    title: stripHtmlText(data.text) || '未命名节点',
    structureClass: 'org.xmind.ui.logic.right',
    children: {
      attached: [],
    },
  };
  const markers = getXMindMarkers(data.icon);
  if (markers.length > 0) {
    topic.markers = markers;
  }
  if (data.hyperlink) {
    topic.href = data.hyperlink;
  }
  if (data.note) {
    topic.notes = {
      plain: {
        content: stripHtmlText(data.note),
      },
    };
  }
  if (data.tag !== undefined) {
    topic.labels = (Array.isArray(data.tag) ? data.tag : [data.tag])
      .map((item) => (typeof item === 'object' && item !== null ? item.text : item))
      .filter(Boolean);
  }
  topic.children.attached = (node.children || []).map((child, index) => buildXMindTopic(child, `${indexPath}_${index}`));
  return topic;
};

const markClipboardSource = (data, source) => {
  if (!data || typeof data !== 'object' || !source) return data;
  Object.defineProperty(data, '__clipboardSource', {
    value: source,
    enumerable: false,
    configurable: true,
  });
  return data;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const exportXMindFile = async (data, name) => {
  const id = `functional_case_${Date.now()}`;
  const root = getMindRootData(data);
  const rootTopic = buildXMindTopic(root);
  rootTopic.class = 'topic';
  const contentData = [{
    id,
    class: 'sheet',
    title: name,
    extensions: [],
    topicPositioning: 'fixed',
    topicOverlapping: 'overlap',
    coreVersion: '2.100.0',
    rootTopic,
  }];
  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(contentData));
  zip.file('metadata.json', JSON.stringify({
    modifier: '',
    dataStructureVersion: '2',
    creator: { name: 'Argux' },
    layoutEngineVersion: '3',
    activeSheetId: id,
  }));
  zip.file('manifest.json', JSON.stringify({
    'file-entries': {
      'content.json': {},
      'metadata.json': {},
      'Thumbnails/thumbnail.png': {},
    },
  }));
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${name}.xmind`);
};

const normalizeXMindExportData = (data) => {
  const cloned = cloneMindData(data);
  const root = getMindRootData(cloned);
  const walk = (node) => {
    if (!node?.data) return;
    const rawIcons = Array.isArray(node.data.icon) ? node.data.icon : [node.data.icon].filter(Boolean);
    if (rawIcons.length > 0) {
      const compatibleIcons = rawIcons.filter((icon) => /^priority_\d+$/.test(icon) || /^progress_\d+$/.test(icon));
      const labels = rawIcons
        .filter((icon) => !compatibleIcons.includes(icon))
        .map((icon) => ICON_ITEM_MAP[icon]?.label)
        .filter(Boolean);
      node.data.icon = compatibleIcons;
      if (labels.length > 0) {
        const currentTags = Array.isArray(node.data.tag) ? node.data.tag : [node.data.tag].filter(Boolean);
        node.data.tag = Array.from(new Set([...currentTags, ...labels]));
      }
    }
    (node.children || []).forEach(walk);
  };
  walk(root);
  return cloned;
};

const getNodeText = (title) => {
  if (typeof title === 'string') return title;
  return title?.props?.children || '';
};

const toCountNumber = (value) => Number(value || 0);
const QUICK_ICON_TYPE_MAP = ICON_GROUPS.reduce((map, group) => {
  map[group.type] = group;
  return map;
}, {});

const formatTreeTime = (value) => {
  if (!value) return '';
  const text = String(value).trim();
  if (!text) return '';
  return text.length > 16 ? text.slice(0, 16) : text;
};

const normalizeKeyword = (value) => (value || '').trim().toLowerCase();

const buildCaseTree = (directoryTree, files, keyword = '') => {
  const search = normalizeKeyword(keyword);
  const fileMap = {};
  (files || []).forEach((item) => {
    fileMap[item.directory_id] = fileMap[item.directory_id] || [];
    fileMap[item.directory_id].push(item);
  });

  const loop = (nodes) => (nodes || []).reduce((acc, item) => {
    const dirTitle = item.title || item.name || '';
    const children = loop(item.children);
    const caseNodes = (fileMap[item.id] || [])
      .filter((caseItem) => !search || (caseItem.title || '').toLowerCase().includes(search))
      .map((caseItem) => ({
        ...caseItem,
        key: `case-${caseItem.id}`,
        title: caseItem.title,
        nodeType: 'case',
        isLeaf: true,
        raw: caseItem,
      }));
    const matchedDirectory = !search || dirTitle.toLowerCase().includes(search);
    if (!matchedDirectory && children.length === 0 && caseNodes.length === 0) return acc;

    acc.push({
      ...item,
      key: `dir-${item.id}`,
      title: dirTitle,
      nodeType: 'directory',
      children: [...children, ...caseNodes],
    });
    return acc;
  }, []);

  return loop(directoryTree);
};

const treeToSelectOptions = (nodes, disabledKeys = new Set()) => (nodes || []).map((item) => ({
  title: item.title || item.name,
  label: item.title || item.name,
  value: item.id,
  key: item.id,
  disabled: disabledKeys.has(item.id),
  children: treeToSelectOptions(item.children || [], disabledKeys),
}));

const getDescendantDirectoryIds = (nodes, targetId) => {
  const find = (items) => {
    for (const item of items || []) {
      if (item.id === targetId) return item;
      const child = find(item.children);
      if (child) return child;
    }
    return null;
  };
  const target = find(nodes);
  const ids = [];
  const collect = (items) => {
    (items || []).forEach((item) => {
      ids.push(item.id);
      collect(item.children);
    });
  };
  collect(target?.children || []);
  return ids;
};

const collectOutline = (data, level = 0, list = []) => {
  if (!data) return list;
  list.push({
    key: data.data?.uid || `${level}-${list.length}`,
    level,
    text: data.data?.text || '未命名节点',
  });
  (data.children || []).forEach((child) => collectOutline(child, level + 1, list));
  return list;
};

const countMindData = (data) => {
  const outline = collectOutline(data);
  const text = outline.map((item) => item.text).join('');
  return {
    nodeCount: outline.length,
    wordCount: text.length,
  };
};

const countGeneratedCaseNodes = (data) => {
  const outline = collectOutline(getMindRootData(data));
  return outline.filter((item) => /(^|[\s_（(-])P[0-2]([\s_）)-]|$)/i.test(String(item.text || '').trim())).length;
};

const normalizeNamedNodeText = (value) => String(value || '').replace(/[\s:：]+/g, '').trim().toLowerCase();

const isNamedMindNode = (value, expected) => normalizeNamedNodeText(value) === normalizeNamedNodeText(expected);

const cloneNodeChildren = (node) => (Array.isArray(node?.children) ? node.children : []);

const findNamedMindNode = (node, expectedName) => {
  if (!node || typeof node !== 'object') return null;
  const currentText = node?.data?.text || '';
  if (isNamedMindNode(currentText, expectedName)) {
    return node;
  }
  for (const child of cloneNodeChildren(node)) {
    const matched = findNamedMindNode(child, expectedName);
    if (matched) {
      return matched;
    }
  }
  return null;
};

const extractNamedSubtreeData = (data, expectedName, fallbackTitle = '') => {
  const safeData = sanitizeMindData(data || defaultCaseData(fallbackTitle), fallbackTitle);
  const root = getMindRootData(safeData);
  const target = findNamedMindNode(root, expectedName);
  return target ? sanitizeMindData(cloneMindData(target), fallbackTitle) : safeData;
};

const replaceNamedSubtreeData = (fullData, expectedName, subtreeData, fallbackTitle = '') => {
  const safeFullData = sanitizeMindData(fullData || defaultCaseData(fallbackTitle), fallbackTitle);
  const safeSubtree = sanitizeMindData(subtreeData || defaultCaseData(expectedName), expectedName);
  const root = getMindRootData(safeFullData);
  if (!root) {
    return safeFullData;
  }
  if (isNamedMindNode(root?.data?.text, expectedName)) {
    return safeSubtree;
  }
  const walk = (node) => {
    const children = cloneNodeChildren(node);
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      if (isNamedMindNode(child?.data?.text, expectedName)) {
        children[index] = cloneMindData(safeSubtree);
        node.children = children;
        return true;
      }
      if (walk(child)) {
        return true;
      }
    }
    return false;
  };
  walk(root);
  return sanitizeMindData(safeFullData, fallbackTitle);
};

const collectVisibleDirectoryIds = (nodes, fileDirectoryIds = new Set()) => {
  const visibleIds = new Set();
  const walk = (items = []) => {
    items.forEach((item) => {
      const childVisible = walk(item.children || []);
      const selfVisible = fileDirectoryIds.has(Number(item.id)) || childVisible;
      if (selfVisible) {
        visibleIds.add(Number(item.id));
      }
    });
    return items.some((item) => visibleIds.has(Number(item.id)));
  };
  walk(nodes);
  return visibleIds;
};

const filterDirectoryTreeByIds = (nodes, visibleIds) => (nodes || []).reduce((acc, item) => {
  const filteredChildren = filterDirectoryTreeByIds(item.children || [], visibleIds);
  if (!visibleIds.has(Number(item.id)) && filteredChildren.length === 0) {
    return acc;
  }
  acc.push({
    ...item,
    children: filteredChildren,
  });
  return acc;
}, []);

const applyUiCaseCountsToTree = (directories, files, uiCases = []) => {
  const fileCountMap = new Map();
  (uiCases || []).forEach((item) => {
    const fileId = Number(item?.file_id ?? item?.case_file_id ?? 0);
    if (fileId <= 0) return;
    const uiCaseCount = Number(item?.ui_case_count ?? item?.case_count ?? item?.case_num ?? 0) || 0;
    fileCountMap.set(fileId, (fileCountMap.get(fileId) || 0) + Math.max(uiCaseCount, 0));
  });

  const nextFiles = (files || []).map((item) => ({
    ...item,
    case_count: fileCountMap.get(Number(item?.id || 0)) || 0,
    pass_count: 0,
  }));

  const fileCountByDirectory = new Map();
  nextFiles.forEach((item) => {
    const directoryId = Number(item?.directory_id || 0);
    if (directoryId <= 0) return;
    fileCountByDirectory.set(
      directoryId,
      (fileCountByDirectory.get(directoryId) || 0) + Number(item?.case_count || 0),
    );
  });

  const decorateDirectories = (nodes) => (nodes || []).map((item) => {
    const children = decorateDirectories(item.children || []);
    const ownCount = fileCountByDirectory.get(Number(item?.id || 0)) || 0;
    const childCount = children.reduce((sum, child) => sum + Number(child?.case_count || 0), 0);
    return {
      ...item,
      children,
      case_count: ownCount + childCount,
      pass_count: 0,
    };
  });

  return {
    directories: decorateDirectories(directories || []),
    files: nextFiles,
  };
};

const resolveUiNodeAssertCount = (node) => {
  const explicitCount = Number(
    node?.assert_count
    ?? node?.assertion_count
    ?? node?.assertions_count
    ?? node?.check_count
    ?? -1,
  );
  if (explicitCount >= 0) return explicitCount;
  const dsl = node?.dsl_json || node?.dsl || {};
  const steps = Array.isArray(dsl?.steps) ? dsl.steps : [];
  return steps.filter((step) => String(step?.type || '').startsWith('assert_')).length;
};

const resolveGeneratedCaseCount = (payload, fallbackData) => {
  const explicitCount = Number(payload?.case_count || payload?.case_num || 0);
  if (explicitCount > 0) return explicitCount;
  return countGeneratedCaseNodes(fallbackData);
};

const buildHugeCasePreview = (data, collapseLevel = 2) => {
  const cloneNode = (node, level) => {
    if (!node || typeof node !== 'object') return node;
    const dataPart = node.data && typeof node.data === 'object' ? { ...node.data } : node.data;
    const children = Array.isArray(node.children) ? node.children.map((child) => cloneNode(child, level + 1)) : [];
    if (dataPart && level === collapseLevel) {
      dataPart.expand = false;
    } else if (dataPart && level > collapseLevel) {
      dataPart.expand = true;
    }
    return {
      ...node,
      data: dataPart,
      children,
    };
  };
  if (data && typeof data === 'object' && data.root && typeof data.root === 'object') {
    return {
      ...data,
      root: cloneNode(data.root, 0),
    };
  }
  return cloneNode(data, 0);
};

const FunctionalCase = ({ project, gconfig, dispatch, uiOnly = false, uiRootName = 'UI自动化用例' }) => {
  const location = useLocation();
  const projects = project?.projects || [];
  const projectId = project?.project_id;
  const aiModelConfig = gconfig?.aiModelConfig || { providers: [] };
  const mindRef = useRef(null);
  const mindContainerRef = useRef(null);
  const caseRenderTimerRef = useRef(null);
  const editorPanelRef = useRef(null);
  const renderFrameRef = useRef(null);
  const renderRetryRef = useRef(0);
  const currentCaseRenderVersionRef = useRef(0);
  const renderedCaseDescriptorRef = useRef('');
  const suppressDirtyCheckRef = useRef(false);
  const savedCaseSnapshotRef = useRef('');
  const pendingModelGenerateResultRef = useRef(null);
  const pendingRouteGeneratedResultRef = useRef(null);
  const routeConfirmingRef = useRef(false);
  const tabActionBypassRef = useRef(false);
  const currentDirectoryRef = useRef(null);
  const importFileRef = useRef(null);
  const formatPainterRef = useRef({ active: false, styles: null, sourceUid: null });
  const nodeContextMenuRef = useRef(false);
  const nodeDoubleClickRef = useRef(false);
  const lastActiveNodeRef = useRef(null);
  const waitingCaseRenderRef = useRef(false);
  const handledGeneratedViewRef = useRef('');
  const internalClipboardRef = useRef({ data: null, at: 0, source: '' });
  const uiDebugFocusedRunIdRef = useRef(0);
  const uiDebugStreamRef = useRef(null);
  const [directoryTree, setDirectoryTree] = useState([]);
  const [caseFiles, setCaseFiles] = useState([]);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentCase, setCurrentCase] = useState(null);
  const [caseDirty, setCaseDirty] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingCase, setLoadingCase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [directoryModal, setDirectoryModal] = useState({ open: false, record: null, parent: null });
  const [caseModal, setCaseModal] = useState({ open: false, record: null, directoryId: null });
  const [moveModal, setMoveModal] = useState({ open: false, type: '', record: null });
  const [linkModal, setLinkModal] = useState({ open: false });
  const [noteModal, setNoteModal] = useState({ open: false });
  const [imageModal, setImageModal] = useState({ open: false });
  const [attachmentModal, setAttachmentModal] = useState({ open: false });
  const [formulaModal, setFormulaModal] = useState({ open: false });
  const [exportModal, setExportModal] = useState({ open: false, type: 'png', name: '' });
  const [skillAiModal, setSkillAiModal] = useState({
    open: false,
    loading: false,
    polling: false,
    taskId: null,
    targetProjectId: null,
    targetCaseId: null,
    targetCaseTitle: '',
    progress: 0,
    stage: 'idle',
    stageText: '',
    errorMessage: '',
    reviewProvider: '',
    reviewRounds: 0,
    resultCaseCount: 0,
    aiModelId: '',
    elapsedText: '',
    requestStartedAt: 0,
    hasPendingResult: false,
    requirementItems: [createSkillRequirementItem()],
    ruleDocIds: [],
    generateDocIds: [],
    generateInstructionText: DEFAULT_SKILL_AI_GENERATE_INSTRUCTION,
    reviewDocIds: [],
    reviewInstructionText: DEFAULT_SKILL_AI_REVIEW_INSTRUCTION,
  });
  const [skillDocOptions, setSkillDocOptions] = useState([]);
  const [loadingSkillDocs, setLoadingSkillDocs] = useState(false);
  const [activePanel, setActivePanel] = useState('node');
  const [panelOpen, setPanelOpen] = useState(false);
  const [themeCategory, setThemeCategory] = useState('classic');
  const [activeThemeValue, setActiveThemeValue] = useState(THEME_PRESETS[0]?.value || '');
  const [activeLayoutValue, setActiveLayoutValue] = useState('logicalStructure');
  const [canvasFullscreen, setCanvasFullscreen] = useState(false);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [scale, setScale] = useState(100);
  const [noteText, setNoteText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [nodeImagePreview, setNodeImagePreview] = useState({ open: false, url: '' });
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [formulaText, setFormulaText] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [moveParent, setMoveParent] = useState(null);
  const [moveDirectoryId, setMoveDirectoryId] = useState(null);
  const [moveSortIndex, setMoveSortIndex] = useState(0);
  const [nodeKey, setNodeKey] = useState(null);
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const [formatPainterSourceUid, setFormatPainterSourceUid] = useState(null);
  const [hugeCaseModeOverride, setHugeCaseModeOverride] = useState(null);
  const [mindContextMenu, setMindContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    type: 'canvas',
    node: null,
  });
  const [iconQuickMenu, setIconQuickMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    node: null,
    type: '',
    value: '',
  });
  const [uiCaseRecords, setUiCaseRecords] = useState([]);
  const [uiNodeDrawerOpen, setUiNodeDrawerOpen] = useState(false);
  const [uiNodeDrawerLoading, setUiNodeDrawerLoading] = useState(false);
  const [uiDrawerActiveTab, setUiDrawerActiveTab] = useState('dsl');
  const [uiDrawerNodes, setUiDrawerNodes] = useState([]);
  const [uiSelectedNode, setUiSelectedNode] = useState(null);
  const [uiNodeKeyword, setUiNodeKeyword] = useState('');
  const [uiDslPreview, setUiDslPreview] = useState(null);
  const [uiValidateLoading, setUiValidateLoading] = useState(false);
  const [uiTrialLoading, setUiTrialLoading] = useState({});
  const [uiStopLoading, setUiStopLoading] = useState({});
  const [uiEnvOptions, setUiEnvOptions] = useState([]);
  const [uiAddressOptions, setUiAddressOptions] = useState([]);
  const [uiTrialModal, setUiTrialModal] = useState({ open: false, node: null, envId: undefined, addressId: undefined });
  const [uiDebugRuns, setUiDebugRuns] = useState([]);
  const [uiDebugSelectedNodeIds, setUiDebugSelectedNodeIds] = useState([]);
  const [uiDebugLoading, setUiDebugLoading] = useState(false);
  const [uiDebugDetail, setUiDebugDetail] = useState(null);
  const [uiDebugDetailLoading, setUiDebugDetailLoading] = useState(false);
  const [uiDebugFocusedRunId, setUiDebugFocusedRunId] = useState(0);
  const [uiImagePreview, setUiImagePreview] = useState({ open: false, title: '', src: '' });
  const caseLabel = uiOnly ? 'UI用例' : '功能用例';
  const caseTreeLabel = uiOnly ? 'UI用例树' : '功能用例树';
  const caseCanvasLabel = uiOnly ? 'UI用例脑图' : '功能用例脑图';
  const emptyCanvasHint = uiOnly ? `选择一个${caseLabel}后开始查看` : `选择或新增一个${caseLabel}后开始编辑`;
  useEffect(() => {
    uiDebugFocusedRunIdRef.current = Number(uiDebugFocusedRunId || 0);
  }, [uiDebugFocusedRunId]);

  const openFunctionalCaseEditor = useCallback((caseId = currentCase?.id) => {
    const query = new URLSearchParams();
    if (projectId) {
      query.set('projectId', String(projectId));
    }
    if (caseId) {
      query.set('caseId', String(caseId));
    }
    const search = query.toString();
    history.push(search ? `${FUNCTIONAL_CASE_ROUTE_PATH}?${search}` : FUNCTIONAL_CASE_ROUTE_PATH);
  }, [projectId, currentCase?.id]);
  const [styleDraft, setStyleDraft] = useState({
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 5,
    paddingX: 15,
    paddingY: 5,
    lineWidth: 2,
    themeLineWidth: 2,
    generalizationLineWidth: 2,
    associativeLineWidth: 2,
  });

  const caseTree = useMemo(
    () => buildCaseTree(directoryTree, caseFiles, appliedKeyword),
    [directoryTree, caseFiles, appliedKeyword],
  );
  const currentUiCaseMeta = useMemo(
    () =>
      uiCaseRecords.find(
        (item) => Number(item?.file_id || item?.id || 0) === Number(currentCase?.id || 0),
      ) || null,
    [currentCase?.id, uiCaseRecords],
  );
  const uiCurrentRunningDebugRun = useMemo(
    () =>
      uiDebugRuns.find((item) => ['queued', 'claimed', 'running', 'uploading'].includes(String(item?.status || '')))
      || null,
    [uiDebugRuns],
  );
  const uiDebugSelectedNodes = useMemo(() => {
    const selectedIds = new Set(uiDebugSelectedNodeIds.map((id) => Number(id)));
    return uiDrawerNodes.filter((node) => selectedIds.has(Number(node?.id)));
  }, [uiDebugSelectedNodeIds, uiDrawerNodes]);
  const uiDrawerNodeMap = useMemo(() => {
    const map = new Map();
    uiDrawerNodes.forEach((node) => {
      if (node?.id) {
        map.set(`case-${node.id}`, node);
      }
    });
    return map;
  }, [uiDrawerNodes]);
  const uiDrawerTreeData = useMemo(() => {
    const keyword = String(uiNodeKeyword || '').trim().toLowerCase();
    const filteredNodes = uiDrawerNodes.filter((node) => {
      if (!keyword) return true;
      return [node?.node_title, node?.node_path, node?.file_title]
        .some((value) => String(value || '').toLowerCase().includes(keyword));
    });
    const roots = [];
    const groupMap = new Map();
    const ensureGroup = (pathKey, title, parentChildren) => {
      if (groupMap.has(pathKey)) return groupMap.get(pathKey);
      const group = {
        key: `group-${pathKey}`,
        title,
        children: [],
      };
      parentChildren.push(group);
      groupMap.set(pathKey, group);
      return group;
    };
    filteredNodes.forEach((node) => {
      const nodeTitle = String(node?.node_title || '').trim();
      const pathSegments = String(node?.node_path || nodeTitle || `用例 #${node?.id}`)
        .split('/')
        .map((item) => item.trim())
        .filter(Boolean);
      const leafTitle = nodeTitle || pathSegments[pathSegments.length - 1] || `用例 #${node?.id}`;
      const segments = pathSegments.length > 0 ? [...pathSegments] : [leafTitle];
      if (segments[segments.length - 1] !== leafTitle) {
        segments.push(leafTitle);
      }
      let children = roots;
      let pathKey = '';
      segments.slice(0, -1).forEach((segment) => {
        pathKey = pathKey ? `${pathKey}/${segment}` : segment;
        children = ensureGroup(pathKey, segment, children).children;
      });
      children.push({
        key: `case-${node.id}`,
        title: (
          <div className="functional-ui-case-tree-title">
            <span>{leafTitle}</span>
            <em>{Number(node.step_count || 0)} 步骤 / {resolveUiNodeAssertCount(node)} 断言</em>
          </div>
        ),
        isLeaf: true,
      });
    });
    return roots;
  }, [uiDrawerNodes, uiNodeKeyword]);
  const uiDebugArtifacts = useMemo(
    () =>
      Array.isArray(uiDebugDetail?.artifacts)
        ? uiDebugDetail.artifacts.filter((item) => item?.label !== '结果JSON' && item?.name !== 'result.json')
        : [],
    [uiDebugDetail],
  );
  const uiDebugArtifactWarnings = useMemo(
    () => (Array.isArray(uiDebugDetail?.result_payload?.artifact_warnings) ? uiDebugDetail.result_payload.artifact_warnings : []),
    [uiDebugDetail],
  );

  const isFunctionalCaseRouteActive = useMemo(
    () => isFunctionalCaseRoutePath(location?.pathname || history?.location?.pathname || ''),
    [location?.pathname],
  );

  const skillAiModelOptions = useMemo(() => {
    const providers = Array.isArray(aiModelConfig?.providers) ? aiModelConfig.providers : [];
    return providers
      .filter((item) => item?.enabled)
      .map((item) => {
        const providerName = String(item?.provider_name || item?.name || item?.provider_type || 'AI模型').trim();
        const modelName = String(item?.model || '').trim();
        const value = String(item?.id || '').trim();
        return {
          label: modelName ? `${providerName} / ${modelName}` : providerName,
          value,
        };
      })
      .filter((item) => item.value);
  }, [aiModelConfig]);

  const pendingGeneratedCaseView = useMemo(() => {
    const searchParams = new URLSearchParams(location?.search || '');
    const routeProjectId = Number(searchParams.get('projectId') || 0);
    const routeCaseId = Number(searchParams.get('caseId') || 0);
    const resultToken = String(searchParams.get('resultToken') || '').trim();
    return {
      routeProjectId: Number.isFinite(routeProjectId) ? routeProjectId : 0,
      routeCaseId: Number.isFinite(routeCaseId) ? routeCaseId : 0,
      resultToken,
    };
  }, [location?.search]);

  useEffect(() => {
    if (!skillAiModal.open) return;
    dispatch({ type: 'gconfig/fetchAiModelConfig' });
    let active = true;
    const loadSkillDocs = async () => {
      setLoadingSkillDocs(true);
      try {
        const res = await listFunctionalCaseSkillDocs({});
        if (!active) return;
        if (res?.code !== 0) {
          throw new Error(res?.msg || '获取用例技能失败');
        }
        setSkillDocOptions((res?.data || []).map((item) => ({
          label: `${item.title}${item.doc_type === 'skill_md' ? ' · 技能文档' : ' · 普通文档'}`,
          value: item.id,
        })));
      } catch (error) {
        if (active) {
          message.error(error?.message || '获取用例技能失败');
        }
      } finally {
        if (active) {
          setLoadingSkillDocs(false);
        }
      }
    };
    loadSkillDocs();
    return () => {
      active = false;
    };
  }, [dispatch, skillAiModal.open]);

  useEffect(() => {
    if (!skillAiModal.open || skillAiModal.aiModelId || !skillAiModelOptions[0]?.value) return;
    setSkillAiModal((prev) => ({ ...prev, aiModelId: skillAiModelOptions[0].value }));
  }, [skillAiModelOptions, skillAiModal.aiModelId, skillAiModal.open]);

  const resolveUiAddressPreview = useCallback((item) => {
    if (!item) return '';
    const pageUrl = String(item.page_url || '').trim();
    const gateway = String(item.gateway || '').trim().replace(/\/$/, '');
    if (!pageUrl) return gateway;
    if (/^https?:\/\//i.test(pageUrl)) return pageUrl.replace(/\/$/, '');
    if (!gateway) return pageUrl;
    return `${gateway}${pageUrl.startsWith('/') ? pageUrl : `/${pageUrl}`}`;
  }, []);

  const fetchUiEnvironments = useCallback(async () => {
    const res = await listEnvironment({ page: 1, size: 1000, exactly: true });
    if (res?.code === 0) {
      setUiEnvOptions(Array.isArray(res.data) ? res.data : []);
      return;
    }
    setUiEnvOptions([]);
  }, []);

  const fetchUiAddresses = useCallback(async (envId) => {
    const targetEnvId = Number(envId || 0);
    if (!targetEnvId) {
      setUiAddressOptions([]);
      return [];
    }
    const res = await listGateway({ env: targetEnvId });
    if (res?.code === 0) {
      const list = Array.isArray(res.data) ? res.data : [];
      setUiAddressOptions(list);
      return list;
    }
    setUiAddressOptions([]);
    return [];
  }, []);

  const applyPendingModelGenerateResult = useCallback(() => {
    const pending = pendingModelGenerateResultRef.current;
    if (!pending) {
      message.warning('当前没有可应用的生成结果');
      return false;
    }
    if (!currentCase || Number(currentCase.id) !== Number(pending.targetCaseId)) {
      message.warning('请先切回发起生成的原用例，再应用结果');
      return false;
    }
    applyImportedData(pending.data, pending.title);
    pendingModelGenerateResultRef.current = null;
    setSkillAiModal((prev) => ({
      ...prev,
      hasPendingResult: false,
      stage: 'done',
      stageText: appendElapsedToSkillText(`模型已生成 ${pending.caseCount} 条候选用例，当前画布已同步最新结果`, pending.elapsedText),
      errorMessage: '',
      reviewProvider: pending.reviewProvider || prev.reviewProvider || '',
      reviewRounds: Number(pending.reviewRounds || prev.reviewRounds || 0),
      resultCaseCount: Number(pending.caseCount || prev.resultCaseCount || 0),
      elapsedText: pending.elapsedText || prev.elapsedText || '',
    }));
    message.success(appendElapsedToSkillText(`模型生成完成，识别到 ${pending.caseCount} 条候选用例，当前画布已更新`, pending.elapsedText));
    return true;
  }, [currentCase]);

  useEffect(() => {
    window.__FUNCTIONAL_CASE_TASK_POLLING__ = Boolean(skillAiModal.polling && skillAiModal.taskId && isFunctionalCaseRouteActive);
    return () => {
      window.__FUNCTIONAL_CASE_TASK_POLLING__ = false;
    };
  }, [isFunctionalCaseRouteActive, skillAiModal.polling, skillAiModal.taskId]);

  useEffect(() => {
    if (!skillAiModal.polling || !skillAiModal.taskId) return undefined;
    let cancelled = false;
    let timer = null;
    const stopPollingTask = () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      window.__FUNCTIONAL_CASE_TASK_POLLING__ = false;
      unregisterFunctionalCaseActiveTask(skillAiModal.taskId);
    };

    const pollTask = async () => {
      try {
        const statusRes = await queryFunctionalCaseGenerateTask({ id: skillAiModal.taskId });
        if (cancelled) return;
        if (statusRes?.code !== 0) {
          throw new Error(statusRes?.msg || '查询生成结果失败');
        }
        const data = statusRes?.data || {};
        setSkillAiModal((prev) => ({
          ...prev,
          progress: Number(data.progress || 0),
          stage: data.stage || prev.stage,
          stageText: data.stage_text || prev.stageText,
          reviewProvider: data.review_provider || '',
          reviewRounds: Number(data.review_rounds || 0),
          errorMessage: data.error_message || '',
          resultCaseCount: resolveGeneratedCaseCount(data, data?.data),
        }));
        const generatedPayload = data?.result && typeof data.result === 'object' ? data.result : data;
        if (generatedPayload?.data && typeof generatedPayload.data === 'object') {
          const targetCaseId = Number(
            skillAiModal.targetCaseId || data.case_file_id || generatedPayload.case_file_id || 0,
          );
          const targetCaseTitle = skillAiModal.targetCaseTitle || currentCase?.title || '功能用例';
          const generatedTitle = generatedPayload.title || targetCaseTitle || '功能用例';
          const generatedData = sanitizeMindData(generatedPayload.data || defaultCaseData(generatedTitle), generatedTitle);
          const caseCount = resolveGeneratedCaseCount(generatedPayload, generatedData);
          const reviewProvider = generatedPayload.review_provider || data.review_provider || '';
          const reviewRounds = Number(generatedPayload.review_rounds || data.review_rounds || 0);
          const elapsedText = resolveSkillTaskElapsedText({
            taskLogs: data.task_logs,
            startedAt: generatedPayload.started_at || data.started_at,
            finishedAt: generatedPayload.finished_at || data.finished_at,
            fallbackStartedAt: skillAiModal.requestStartedAt,
            fallbackFinishedAt: Date.now(),
          });
          pendingModelGenerateResultRef.current = {
            data: generatedData,
            title: generatedTitle,
            targetCaseId,
            caseCount,
            reviewProvider,
            reviewRounds,
            elapsedText,
          };
          if (!isFunctionalCaseRouteActive) {
            queueGeneratedCaseResult({
              taskId: skillAiModal.taskId,
              projectId: skillAiModal.targetProjectId || projectId,
              targetCaseId,
              targetCaseTitle,
              title: generatedTitle,
              data: generatedData,
              caseCount,
              reviewProvider,
              reviewRounds,
              elapsedText,
            });
            setSkillAiModal((prev) => ({
              ...prev,
              open: false,
              loading: false,
              polling: false,
              taskId: null,
              progress: 100,
              stage: 'done',
              stageText: appendElapsedToSkillText(`模型已生成 ${caseCount} 条候选用例，可点击通知中的“查看”前往结果页面`, elapsedText),
              errorMessage: '',
              reviewProvider: reviewProvider || prev.reviewProvider || '',
              reviewRounds: Number(reviewRounds || prev.reviewRounds || 0),
              resultCaseCount: Number(caseCount || prev.resultCaseCount || 0),
              elapsedText: elapsedText || prev.elapsedText || '',
              hasPendingResult: true,
            }));
            stopPollingTask();
            return;
          }
          const matchesCurrentCase = currentCase && Number(currentCase.id) === Number(targetCaseId);
          if (matchesCurrentCase) {
            applyImportedData(generatedData, generatedTitle);
            pendingModelGenerateResultRef.current = null;
            setSkillAiModal((prev) => ({
              ...prev,
              open: true,
              loading: false,
              polling: false,
              taskId: null,
              progress: 100,
              stage: 'done',
              elapsedText: elapsedText || prev.elapsedText || '',
            }));
            stopPollingTask();
            message.success(appendElapsedToSkillText(`模型生成完成，识别到 ${caseCount} 条候选用例，当前画布已更新`, elapsedText));
            return;
          }
          setSkillAiModal((prev) => ({
            ...prev,
            open: true,
            loading: false,
            polling: false,
            taskId: null,
            progress: 100,
            stage: 'done',
            stageText: appendElapsedToSkillText(`模型已生成 ${caseCount} 条候选用例，你已切换到其他用例，请切回“${targetCaseTitle}”后应用结果`, elapsedText),
            errorMessage: '',
            reviewProvider: reviewProvider || prev.reviewProvider || '',
            reviewRounds: Number(reviewRounds || prev.reviewRounds || 0),
            resultCaseCount: Number(caseCount || prev.resultCaseCount || 0),
            elapsedText: elapsedText || prev.elapsedText || '',
            hasPendingResult: true,
          }));
          stopPollingTask();
          message.warning(appendElapsedToSkillText(`模型生成已完成，但当前不在原始用例“${targetCaseTitle}”上，结果尚未自动覆盖`, elapsedText));
          return;
        }
        const status = String(data.status || data.stage || '').toLowerCase();
        if (status === 'cancelled' || status.includes('cancel')) {
          setSkillAiModal((prev) => ({
            ...prev,
            loading: false,
            polling: false,
            progress: 100,
            stage: 'done',
            stageText: data.stage_text || '任务已停止',
            errorMessage: '',
          }));
          stopPollingTask();
          message.info(data.stage_text || '模型生成任务已停止');
          return;
        }
        if (status === 'failed' || status.includes('fail')) {
          setSkillAiModal((prev) => ({
            ...prev,
            loading: false,
            polling: false,
            errorMessage: data.error_message || '模型生成失败',
          }));
          stopPollingTask();
          message.error(data.error_message || '模型生成失败');
          return;
        }
        timer = setTimeout(pollTask, 2000);
      } catch (error) {
        if (cancelled) return;
        setSkillAiModal((prev) => ({
          ...prev,
          loading: false,
          polling: false,
          errorMessage: error?.message || '查询生成结果失败',
        }));
        stopPollingTask();
        message.error(error?.message || '查询生成结果失败');
      }
    };

    pollTask();
    return () => {
      stopPollingTask();
    };
  }, [
    currentCase,
    isFunctionalCaseRouteActive,
    projectId,
    skillAiModal.polling,
    skillAiModal.requestStartedAt,
    skillAiModal.taskId,
    skillAiModal.targetCaseId,
    skillAiModal.targetCaseTitle,
    skillAiModal.targetProjectId,
  ]);

  const directoryOptions = useMemo(() => treeToSelectOptions(directoryTree), [directoryTree]);

  const selectedKeys = useMemo(() => {
    if (currentCase) return [`case-${currentCase.id}`];
    if (currentDirectory) return [`dir-${currentDirectory}`];
    return [];
  }, [currentDirectory, currentCase]);

  const outline = useMemo(() => {
    const source = getMindRootData(currentCase?.data) || defaultCaseData(currentCase?.title);
    const nodeCount = Number(currentCase?.__nodeCount || 0);
    if (nodeCount >= HUGE_CASE_NODE_THRESHOLD) {
      return collectOutline(source).slice(0, 400);
    }
    return collectOutline(source);
  }, [currentCase]);

  const mindStats = useMemo(() => {
    const nodeCount = Number(currentCase?.__nodeCount || 0);
    if (nodeCount > 0) {
      return {
        nodeCount,
        wordCount: Number(currentCase?.__wordCount || 0),
      };
    }
    const source = getMindRootData(currentCase?.data) || defaultCaseData(currentCase?.title);
    return countMindData(source);
  }, [currentCase]);

  const filteredThemePresets = useMemo(
    () => THEME_PRESETS.filter((item) => item.category === themeCategory),
    [themeCategory],
  );

  const getProject = useCallback(() => {
    if (projects.length === 0) {
      return null;
    }
    const target = projects.find((item) => item.id === projectId);
    return target || projects[0];
  }, [projects, projectId]);

  const saveProject = useCallback((nextProjectId) => {
    if (!nextProjectId) return;
    dispatch?.({
      type: 'project/save',
      payload: { project_id: nextProjectId },
    });
    localStorage.setItem('project_id', String(nextProjectId));
  }, [dispatch]);

  const clearGeneratedCaseRouteQuery = useCallback(() => {
    const searchParams = new URLSearchParams(location?.search || '');
    const hasGeneratedQuery = searchParams.has('projectId') || searchParams.has('caseId') || searchParams.has('resultToken');
    if (!hasGeneratedQuery) return;
    searchParams.delete('projectId');
    searchParams.delete('caseId');
    searchParams.delete('resultToken');
    const nextSearch = searchParams.toString();
    history.replace(nextSearch ? `${location.pathname}?${nextSearch}` : location.pathname);
  }, [location?.pathname, location?.search]);

  useEffect(() => {
    const pending = pendingRouteGeneratedResultRef.current;
    if (!pending || !currentCase || Number(currentCase.id) !== Number(pending.targetCaseId)) {
      return;
    }
    applyImportedData(pending.data, pending.title || currentCase.title);
    setSkillAiModal((prev) => ({
      ...prev,
      open: false,
      loading: false,
      polling: false,
      taskId: null,
      targetProjectId: Number(pending.projectId || prev.targetProjectId || 0),
      targetCaseId: Number(pending.targetCaseId || currentCase.id),
      targetCaseTitle: pending.targetCaseTitle || pending.title || currentCase.title || '功能用例',
      progress: 100,
      stage: 'done',
      stageText: appendElapsedToSkillText(
        `模型已生成 ${Number(pending.caseCount || 0)} 条候选用例，当前画布已同步最新结果`,
        pending.elapsedText || '',
      ),
      errorMessage: '',
      reviewProvider: pending.reviewProvider || '',
      reviewRounds: Number(pending.reviewRounds || 0),
      resultCaseCount: Number(pending.caseCount || 0),
      elapsedText: pending.elapsedText || '',
      hasPendingResult: false,
    }));
    if (pending.resultToken) {
      clearFunctionalCaseResult(pending.resultToken);
    }
    clearGeneratedCaseRouteQuery();
    pendingRouteGeneratedResultRef.current = null;
  }, [applyImportedData, clearGeneratedCaseRouteQuery, currentCase]);

  const openGeneratedCaseNotification = useCallback((payload) => {
    const resultToken = String(payload?.resultToken || '').trim();
    if (!resultToken) return;
    const notificationKey = `functional_case_generate_${resultToken}`;
    const targetTitle = payload?.targetCaseTitle || payload?.title || '功能用例';
    const caseCount = Number(payload?.caseCount || 0);
    const description = appendElapsedToSkillText(
      `功能用例“${targetTitle}”已生成完成${caseCount ? `，识别到 ${caseCount} 条候选用例` : ''}`,
      payload?.elapsedText || '',
    );
    notification.success({
      key: notificationKey,
      message: '用例生成完成',
      description,
      duration: 0,
      btn: (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            notification.destroy(notificationKey);
            history.push(buildFunctionalCaseResultUrl({
              projectId: payload?.projectId,
              caseId: payload?.targetCaseId,
              resultToken,
            }));
          }}
        >
          查看
        </Button>
      ),
    });
  }, []);

  const queueGeneratedCaseResult = useCallback((payload) => {
    const resultToken = buildFunctionalCaseResultToken(payload?.taskId, payload?.targetCaseId);
    const queuedPayload = {
      ...payload,
      resultToken,
      queuedAt: Date.now(),
    };
    persistFunctionalCaseResult(resultToken, queuedPayload);
    pendingModelGenerateResultRef.current = {
      data: queuedPayload.data,
      title: queuedPayload.title,
      targetCaseId: queuedPayload.targetCaseId,
      caseCount: queuedPayload.caseCount,
      reviewProvider: queuedPayload.reviewProvider,
      reviewRounds: queuedPayload.reviewRounds,
      elapsedText: queuedPayload.elapsedText,
    };
    openGeneratedCaseNotification(queuedPayload);
    return queuedPayload;
  }, [openGeneratedCaseNotification]);

  useEffect(() => {
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: formatPainterActive,
      sourceUid: formatPainterSourceUid,
    };
  }, [formatPainterActive, formatPainterSourceUid]);

  const closeMindContextMenu = useCallback(() => {
    setMindContextMenu((prev) => (prev.open ? { ...prev, open: false, node: null } : prev));
  }, []);

  const closeIconQuickMenu = useCallback(() => {
    setIconQuickMenu((prev) => (prev.open ? {
      open: false,
      x: 0,
      y: 0,
      node: null,
      type: '',
      value: '',
    } : prev));
  }, []);

  useEffect(() => {
    const hide = () => closeMindContextMenu();
    window.addEventListener('click', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('click', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, [closeMindContextMenu]);

  useEffect(() => {
    const hide = () => closeIconQuickMenu();
    window.addEventListener('click', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('click', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, [closeIconQuickMenu]);

  const fetchTree = useCallback(async (keyword = appliedKeyword, targetProjectId = projectId) => {
    if (!targetProjectId) {
      setDirectoryTree([]);
      setCaseFiles([]);
      setUiCaseRecords([]);
      setCurrentDirectory(null);
      setCurrentCase(null);
      return;
    }
    setLoadingTree(true);
    try {
      const requestList = [
        listFunctionalCaseDirectory({ project_id: targetProjectId }),
        listFunctionalCaseFiles({ title: keyword || '', project_id: targetProjectId }),
      ];
      if (uiOnly) {
        requestList.push(listUiTestCases({
          project_id: targetProjectId,
          page: 1,
          size: 10000,
          paged: false,
        }));
      }
      const [directoryRes, fileRes, uiCaseRes] = await Promise.all(requestList);

      if (directoryRes?.code === 0 && fileRes?.code === 0 && (!uiOnly || uiCaseRes?.code === 0)) {
        const directories = Array.isArray(directoryRes.data) ? directoryRes.data : [];
        let files = (Array.isArray(fileRes.data) ? fileRes.data : []).map((item) => ({
          ...item,
          case_count: Number(item?.case_count ?? item?.case_num ?? 0),
          pass_count: Number(item?.pass_count ?? 0),
          create_user_name: item?.create_user_name || item?.creator_name || '',
        }));
        let visibleDirectories = directories;
        if (uiOnly) {
          const uiCases = Array.isArray(uiCaseRes?.data?.list)
            ? uiCaseRes.data.list
            : (Array.isArray(uiCaseRes?.data) ? uiCaseRes.data : []);
          setUiCaseRecords(uiCases);
          const visibleFileIds = new Set(
            uiCases
              .map((item) => Number(item?.file_id ?? item?.case_file_id ?? item?.id ?? 0))
              .filter((item) => item > 0),
          );
          files = files.filter((item) => visibleFileIds.has(Number(item.id)));
          const fileDirectoryIds = new Set(files.map((item) => Number(item.directory_id)).filter((item) => item > 0));
          const visibleDirectoryIds = collectVisibleDirectoryIds(directories, fileDirectoryIds);
          visibleDirectories = filterDirectoryTreeByIds(directories, visibleDirectoryIds);
          const countedResult = applyUiCaseCountsToTree(visibleDirectories, files, uiCases);
          visibleDirectories = countedResult.directories;
          files = countedResult.files;
        } else {
          setUiCaseRecords([]);
        }
        setDirectoryTree(visibleDirectories);
        setCaseFiles(files);
        if (!currentDirectoryRef.current && visibleDirectories.length > 0) {
          setCurrentDirectory(visibleDirectories[0].id);
        }
      } else {
        message.error(directoryRes?.msg || fileRes?.msg || uiCaseRes?.msg || `获取${caseTreeLabel}失败`);
      }
    } finally {
      setLoadingTree(false);
    }
  }, [appliedKeyword, projectId, uiOnly, caseTreeLabel]);

  const applyUiDebugStreamSnapshot = useCallback((snapshot) => {
    const list = Array.isArray(snapshot?.runs) ? snapshot.runs : [];
    const nextDetail = snapshot?.detail || null;
    const nextFocusedRunId = Number(snapshot?.active_run_id || nextDetail?.id || uiDebugFocusedRunIdRef.current || list[0]?.id || 0);
    setUiDebugRuns(list);
    setUiDebugFocusedRunId(nextFocusedRunId);
    if (nextDetail || list.length === 0) {
      setUiDebugDetail(nextDetail);
    }
    setUiDebugLoading(false);
    setUiDebugDetailLoading(false);
  }, []);

  const fetchUiDebugDetail = useCallback(async (runId) => {
    if (!runId) return;
    setUiDebugFocusedRunId(runId);
    setUiDebugDetailLoading(true);
    try {
      const res = await getUiTestRunDetail({
        id: runId,
        include_payload: true,
        include_artifacts: true,
        include_step_payload: false,
        include_step_artifacts: true,
      });
      if (res?.code === 0) {
        setUiDebugDetail(res.data || null);
      } else {
        message.error(res?.msg || '获取调试详情失败');
      }
    } finally {
      setUiDebugDetailLoading(false);
    }
  }, []);

  const fetchUiDebugRuns = useCallback(async (node, focusRunId) => {
    if (!projectId || !node?.id) return;
    setUiDebugLoading(true);
    try {
      const res = await listUiTestRuns({
        project_id: projectId,
        case_ref_id: node.id,
        scope: 'debug',
        page: 1,
        size: 100,
        paged: true,
      });
      if (res?.code === 0) {
        const list = Array.isArray(res?.data?.list) ? res.data.list : (Array.isArray(res?.data) ? res.data : []);
        setUiDebugRuns(list);
        const targetRunId = focusRunId || uiDebugFocusedRunIdRef.current || uiDebugDetail?.id || list[0]?.id;
        setUiDebugFocusedRunId(Number(targetRunId || 0));
        if (targetRunId) {
          fetchUiDebugDetail(targetRunId);
        } else {
          setUiDebugDetail(null);
        }
      } else {
        message.error(res?.msg || '获取调试记录失败');
      }
    } finally {
      setUiDebugLoading(false);
    }
  }, [fetchUiDebugDetail, projectId, uiDebugDetail?.id]);

  const openUiNodeDrawer = useCallback(async (targetCase = currentUiCaseMeta) => {
    if (!targetCase?.file_id) {
      message.warning('当前 UI 用例还没有扫描节点');
      return [];
    }
    setUiNodeDrawerOpen(true);
    setUiNodeDrawerLoading(true);
    setUiDrawerActiveTab('dsl');
    setUiSelectedNode(null);
    setUiDslPreview(null);
    setUiNodeKeyword('');
    try {
      const res = await listUiTestCaseNodes({ file_id: targetCase.file_id, include_dsl: true });
      if (res?.code === 0) {
        const list = Array.isArray(res.data) ? res.data : [];
        setUiDrawerNodes(list);
        if (!uiSelectedNode && list[0]) {
          setUiSelectedNode(list[0]);
        }
        return list;
      } else {
        message.error(res?.msg || '获取 UI 节点失败');
      }
    } finally {
      setUiNodeDrawerLoading(false);
    }
    return [];
  }, [currentUiCaseMeta, uiSelectedNode]);

  const handleValidateCurrentUiCase = useCallback(async () => {
    if (!currentUiCaseMeta?.id) {
      message.warning('请先选择一个 UI 用例');
      return;
    }
    setUiValidateLoading(true);
    try {
      const res = await validateUiTestCase({ id: currentUiCaseMeta.id });
      if (res?.code === 0) {
        message.success(res?.msg || '校验完成');
        await fetchTree();
        if (uiNodeDrawerOpen) {
          await openUiNodeDrawer(currentUiCaseMeta);
        }
      } else {
        message.error(res?.msg || '校验失败');
      }
    } finally {
      setUiValidateLoading(false);
    }
  }, [currentUiCaseMeta, fetchTree, openUiNodeDrawer, uiNodeDrawerOpen]);

  const handlePreviewUiDsl = useCallback(async (node) => {
    if (!node?.id) return;
    const res = await previewUiTestDsl({ id: node.id });
    if (res?.code === 0) {
      setUiSelectedNode(node);
      setUiDslPreview(res.data || null);
      setUiDrawerActiveTab('dsl');
      setUiNodeDrawerOpen(true);
    } else {
      message.error(res?.msg || '预览 DSL 失败');
    }
  }, []);

  const submitUiTrialRun = useCallback(async ({ node, nodes, envId, addressId }) => {
    const targetNodes = Array.isArray(nodes) && nodes.length > 0 ? nodes : (node?.id ? [node] : []);
    if (targetNodes.length === 0 || !envId) return;
    const targetIds = targetNodes.map((item) => Number(item.id)).filter(Boolean);
    setUiTrialLoading((prev) => targetIds.reduce((next, id) => ({ ...next, [id]: true }), prev));
    try {
      const res = targetIds.length > 1
        ? await trialRunUiTestCases({ ids: targetIds, env_id: envId, address_id: addressId })
        : await trialRunUiTestCase({ id: targetIds[0], env_id: envId, address_id: addressId });
      if (res?.code === 0) {
        message.success('调试任务已启动');
        const firstNode = targetNodes[0];
        setUiSelectedNode(firstNode);
        setUiDebugSelectedNodeIds(targetIds);
        setUiDrawerActiveTab('debug');
        setUiNodeDrawerOpen(true);
        await fetchUiDebugRuns(firstNode, res?.data?.id || res?.data?.run_id || res?.data?.run_ids?.[0]);
      } else {
        message.error(res?.msg || '启动调试失败');
      }
    } finally {
      setUiTrialLoading((prev) => targetIds.reduce((next, id) => ({ ...next, [id]: false }), prev));
    }
  }, [fetchUiDebugRuns]);

  const handleOpenUiTrialModal = useCallback(async (nodeOrNodes) => {
    const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes.filter((item) => item?.id) : (nodeOrNodes?.id ? [nodeOrNodes] : []);
    if (nodes.length === 0) {
      message.warning('请先选择要调试的用例');
      return;
    }
    await fetchUiEnvironments();
    setUiAddressOptions([]);
    setUiTrialModal({ open: true, node: nodes[0], nodes, envId: undefined, addressId: undefined });
  }, [fetchUiEnvironments]);

  const handleStopUiDebugRun = useCallback(async (runId) => {
    if (!runId) return;
    setUiStopLoading((prev) => ({ ...prev, [runId]: true }));
    try {
      const res = await stopUiTestRun({ id: runId });
      if (res?.code === 0) {
        message.success(res?.msg || '调试任务已停止');
        if (uiSelectedNode) {
          await fetchUiDebugRuns(uiSelectedNode);
        }
      } else {
        message.error(res?.msg || '停止调试失败');
      }
    } finally {
      setUiStopLoading((prev) => ({ ...prev, [runId]: false }));
    }
  }, [fetchUiDebugRuns, uiSelectedNode]);

  useEffect(() => {
    if (!uiOnly || !uiNodeDrawerOpen || uiDrawerActiveTab !== 'debug' || !uiSelectedNode?.id) return;
    fetchUiDebugRuns(uiSelectedNode);
  }, [fetchUiDebugRuns, uiDrawerActiveTab, uiNodeDrawerOpen, uiOnly, uiSelectedNode]);

  useEffect(() => {
    if (!uiOnly || !uiNodeDrawerOpen || uiDrawerActiveTab !== 'debug' || !uiSelectedNode?.id || !projectId) {
      uiDebugStreamRef.current?.close?.();
      uiDebugStreamRef.current = null;
      return undefined;
    }
    setUiDebugLoading(true);
    if (uiDebugFocusedRunIdRef.current > 0) {
      setUiDebugDetailLoading(true);
    }
    const stream = subscribeUiTestDebugStream(
      {
        project_id: projectId,
        case_ref_id: uiSelectedNode.id,
        focus_run_id: uiDebugFocusedRunId || undefined,
        include_payload: true,
        include_artifacts: true,
        include_step_payload: false,
        include_step_artifacts: true,
      },
      {
        onMessage: (event, data) => {
          if (event === 'snapshot') {
            applyUiDebugStreamSnapshot(data);
          }
        },
      },
    );
    uiDebugStreamRef.current = stream;
    return () => {
      stream.close();
      if (uiDebugStreamRef.current === stream) {
        uiDebugStreamRef.current = null;
      }
    };
  }, [applyUiDebugStreamSnapshot, projectId, uiDebugFocusedRunId, uiDrawerActiveTab, uiNodeDrawerOpen, uiOnly, uiSelectedNode]);

  const clearRenderFrame = useCallback(() => {
    if (renderFrameRef.current) {
      cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = null;
    }
    if (caseRenderTimerRef.current) {
      window.clearTimeout(caseRenderTimerRef.current);
      caseRenderTimerRef.current = null;
    }
  }, []);


  const destroyMindMap = useCallback(() => {
    clearRenderFrame();
      if (mindRef.current) {
      if (typeof mindRef.current.off === 'function') {
        if (mindRef.current.__formatPainterHandler) {
          mindRef.current.off('node_active', mindRef.current.__formatPainterHandler);
        }
        if (mindRef.current.__nodeDoubleClickHandler) {
          mindRef.current.off('node_dblclick', mindRef.current.__nodeDoubleClickHandler);
        }
        if (mindRef.current.__nodeContextMenuHandler) {
          mindRef.current.off('node_contextmenu', mindRef.current.__nodeContextMenuHandler);
        }
        if (mindRef.current.__nodeImageClickHandler) {
          mindRef.current.off('node_img_click', mindRef.current.__nodeImageClickHandler);
        }
        if (mindRef.current.__nodeIconClickHandler) {
          mindRef.current.off('node_icon_click', mindRef.current.__nodeIconClickHandler);
        }
        if (mindRef.current.__canvasContextMenuHandler) {
          mindRef.current.off('contextmenu', mindRef.current.__canvasContextMenuHandler);
        }
        if (mindRef.current.__scaleSyncHandler) {
          ['view_data_change', 'view_change', 'scale', 'translate', 'data_change'].forEach((eventName) => {
            mindRef.current.off(eventName, mindRef.current.__scaleSyncHandler);
          });
        }
        if (mindRef.current.__dirtyChangeHandler) {
          mindRef.current.off('data_change', mindRef.current.__dirtyChangeHandler);
        }
        if (mindRef.current.__nodeTreeRenderEndHandler) {
          mindRef.current.off('node_tree_render_end', mindRef.current.__nodeTreeRenderEndHandler);
        }
      }
      mindRef.current.svg?.off?.('dblclick', mindRef.current.__canvasDoubleClickHandler);
      mindRef.current.destroy();
      mindRef.current = null;
    }
    renderedCaseDescriptorRef.current = '';
    closeMindContextMenu();
    closeIconQuickMenu();
    setFormatPainterActive(false);
    setFormatPainterSourceUid(null);
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: false,
      styles: null,
      sourceUid: null,
    };
  }, [clearRenderFrame, closeMindContextMenu, closeIconQuickMenu]);

  const getMindData = useCallback(() => {
    if (!mindRef.current) return currentCase?.data;
    return mindRef.current.getData(true);
  }, [currentCase]);

  const buildCaseSnapshot = useCallback((data, fallbackTitle = '功能用例') => (
    JSON.stringify(sanitizeMindData(data || defaultCaseData(fallbackTitle), fallbackTitle))
  ), []);

  const openUnsavedConfirm = useCallback((onOk, onCancel) => {
    Modal.confirm({
      title: '未保存提醒',
      content: UNSAVED_CASE_CLOSE_TEXT,
      okText: '关闭',
      cancelText: '取消',
      onOk,
      onCancel,
    });
  }, []);

  const syncScaleFromMind = useCallback(() => {
    const transform = mindRef.current?.draw?.transform?.();
    const view = mindRef.current?.view;
    const fullData = mindRef.current?.getData?.(true);
    const rawScale = view?.scale
      || view?.state?.scale
      || view?.transform?.scaleX
      || fullData?.view?.state?.scale
      || fullData?.view?.transform?.scaleX
      || transform?.scaleX
      || transform?.a;
    if (!rawScale || Number.isNaN(Number(rawScale))) return;
    setScale(Math.round(Number(rawScale) * 100));
  }, []);

  const refreshMindGeometry = useCallback((preserveView = true) => {
    const instance = mindRef.current;
    const el = mindContainerRef.current;
    if (!instance || !el || !el.isConnected) return;
    const rect = el.getBoundingClientRect?.();
    const width = Number(rect?.width || 0);
    const height = Number(rect?.height || 0);
    if (width <= 0 || height <= 0) return;
    const viewData = preserveView ? instance.view?.getTransformData?.() : null;
    const drawTransform = preserveView ? instance.draw?.transform?.() : null;
    try {
      instance.resize?.();
    } catch (error) {
      if (String(error?.message || '').includes('容器元素el的宽高不能为0')) {
        return;
      }
      throw error;
    }
    if (preserveView && viewData && instance.view?.setTransformData) {
      instance.view.setTransformData(viewData);
    } else if (preserveView && drawTransform) {
      instance.draw?.transform?.(drawTransform);
    }
    syncScaleFromMind();
  }, [syncScaleFromMind]);

  const handleTreeCollapse = useCallback((collapsed) => {
    setTreeCollapsed(collapsed);
  }, []);

  const getActiveNode = () => {
    const nodes = mindRef.current?.renderer?.activeNodeList || [];
    return nodes[0];
  };

  const getActiveNodes = () => {
    const nodes = mindRef.current?.renderer?.activeNodeList || [];
    if (Array.isArray(nodes) && nodes.length > 0) {
      return nodes.filter(Boolean);
    }
    const node = getActiveNode();
    return node ? [node] : [];
  };

  const markCaseDirty = useCallback(() => {
    if (!currentCase) return;
    setCaseDirty(true);
    window.__FUNCTIONAL_CASE_UNSAVED__ = {
      dirty: true,
      path: (history?.location?.pathname || '/apiTest/functionalCase').toLowerCase(),
    };
  }, [currentCase]);

  const cacheInternalClipboard = useCallback((source = 'copy') => {
    const renderer = mindRef.current?.renderer;
    if (!renderer) return;
    const copied = cloneMindData(renderer.beingCopyData || renderer.copyNode?.() || null);
    if (!Array.isArray(copied) || copied.length === 0) return;
    internalClipboardRef.current = {
      data: copied,
      at: Date.now(),
      source,
    };
  }, []);

  const getInternalClipboardMindData = useCallback(() => {
    const cached = internalClipboardRef.current;
    if (!cached?.at || Date.now() - cached.at > 30 * 1000) return null;
    if (!Array.isArray(cached.data) || cached.data.length === 0) return null;
    return markClipboardSource(sanitizeMindData({
      data: { text: '粘贴内容' },
      children: cloneMindData(cached.data),
    }), 'simpleMindMap');
  }, []);

  const execCommand = (command, ...args) => {
    if (!mindRef.current) {
      message.warning(`请先选择${caseLabel}`);
      return false;
    }
    mindRef.current.execCommand(command, ...args);
    markCaseDirty();
    return true;
  };

  const execNodeCommand = (command, ...args) => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return false;
    }
    mindRef.current.execCommand(command, node, ...args);
    markCaseDirty();
    return true;
  };

  const insertSiblingNode = (position = 'after') => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return false;
    }
    if (!mindRef.current) {
      message.warning(`请先选择${caseLabel}`);
      return false;
    }
    if (node.isRoot) {
      message.warning('根节点不支持前插或后插，请使用子节点');
      return false;
    }
    if (node.isGeneralization) {
      message.warning('概要节点不支持前插或后插');
      return false;
    }

    mindRef.current.execCommand('INSERT_NODE');
    if (position === 'before') {
      requestAnimationFrame(() => {
        if (!mindRef.current) return;
        mindRef.current.execCommand('UP_NODE');
      });
    }
    markCaseDirty();
    return true;
  };

  const getNodeData = (node) => {
    if (!node) return {};
    if (typeof node.getData === 'function') {
      const value = node.getData();
      if (value && typeof value === 'object') return value;
    }
    return node.nodeData?.data || {};
  };

  const getEventClientPosition = (event) => {
    const source = event?.clientX !== undefined
      ? event
      : event?.event || event?.detail?.event || event?.detail || event?.srcEvent;
    return {
      x: source?.clientX ?? source?.x ?? source?.pageX ?? 0,
      y: source?.clientY ?? source?.y ?? source?.pageY ?? 0,
    };
  };

  const renderIconPreview = (itemOrValue) => {
    const item = typeof itemOrValue === 'string' ? ICON_ITEM_MAP[itemOrValue] : itemOrValue;
    if (!item?.icon) return <span className="functional-icon-preview fallback">?</span>;
    return (
      <span
        className="functional-icon-preview svg"
        dangerouslySetInnerHTML={{ __html: item.icon }}
      />
    );
  };

  const applyNodeIcon = (value) => {
    const nodes = getActiveNodes();
    if (nodes.length === 0) {
      message.warning('请先选中脑图节点');
      return;
    }
    const type = value.split('_')[0];
    let hasOverflow = false;
    nodes.forEach((node) => {
      const currentIcons = node.getData?.('icon') || getNodeData(node).icon || [];
      const icons = Array.isArray(currentIcons) ? currentIcons : [currentIcons].filter(Boolean);
      const exists = icons.includes(value);
      const nextIconsRaw = exists
        ? icons.filter((item) => item !== value)
        : [...icons.filter((item) => !['priority', 'progress'].includes(type) || !item.startsWith(`${type}_`)), value];
      const nextIcons = normalizeNodeIcons(nextIconsRaw);
      if (nextIconsRaw.length > MAX_NODE_ICONS) {
        hasOverflow = true;
      }
      mindRef.current.execCommand('SET_NODE_ICON', node, nextIcons);
    });
    if (hasOverflow) {
      message.info(`单个节点最多展示 ${MAX_NODE_ICONS} 个图标，已自动保留前 ${MAX_NODE_ICONS} 个`);
    }
  };

  const applyNodeIconByType = (node, type, currentValue, value = null) => {
    if (!node || !mindRef.current || !QUICK_ICON_TYPE_MAP[type]) return;
    const currentIcons = node.getData?.('icon') || getNodeData(node).icon || [];
    const icons = Array.isArray(currentIcons) ? currentIcons : [currentIcons].filter(Boolean);
    const filtered = ['priority', 'progress'].includes(type)
      ? icons.filter((item) => !item.startsWith(`${type}_`))
      : icons.filter((item) => item !== currentValue);
    const merged = value ? [...filtered, value] : filtered;
    const nextIcons = normalizeNodeIcons(Array.from(new Set(merged)));
    mindRef.current.execCommand('SET_NODE_ICON', node, nextIcons);
    markCaseDirty();
  };

  const clearNodeIcons = (node = null) => {
    const target = node || getActiveNode();
    if (!target) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_ICON', target, []);
    closeMindContextMenu();
    message.success('已移除节点图标');
  };

  const toggleNodeExpand = (expand, node = null) => {
    const target = node || getActiveNode();
    if (!target) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_EXPAND', target, expand);
    closeMindContextMenu();
  };

  const clearAllNodeIcons = () => {
    if (!mindRef.current) return;
    const root = getMindRootData(getMindData());
    const uids = [];
    const walk = (item) => {
      if (!item) return;
      if (item.data?.uid) uids.push(item.data.uid);
      (item.children || []).forEach((child) => walk(child));
    };
    walk(root);
    const finder = mindRef.current?.renderer?.findNodeByUid?.bind(mindRef.current.renderer);
    uids.forEach((uid) => {
      const node = finder ? finder(uid) : null;
      if (node) {
        mindRef.current.execCommand('SET_NODE_ICON', node, []);
      }
    });
    closeMindContextMenu();
    message.success('已移除所有节点图标');
  };

  const expandAllNodes = () => {
    execCommand('EXPAND_ALL');
    closeMindContextMenu();
  };

  const collapseAllNodes = () => {
    execCommand('UNEXPAND_ALL');
    closeMindContextMenu();
  };

  const collectNodeStyle = (node) => {
    const nodeData = getNodeData(node);
    return FORMAT_BRUSH_STYLE_KEYS.reduce((acc, key) => {
      if (nodeData[key] !== undefined && nodeData[key] !== null && nodeData[key] !== '') {
        acc[key] = nodeData[key];
      }
      return acc;
    }, {});
  };

  const stopFormatPainter = () => {
    setFormatPainterActive(false);
    setFormatPainterSourceUid(null);
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: false,
      styles: null,
      sourceUid: null,
    };
  };

  const startFormatPainter = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中源节点');
      return;
    }
    const styles = collectNodeStyle(node);
    if (Object.keys(styles).length === 0) {
      message.warning('当前节点没有可复制的样式');
      return;
    }
    const sourceUid = getNodeData(node)?.uid || null;
    setFormatPainterActive(true);
    setFormatPainterSourceUid(sourceUid);
    formatPainterRef.current = {
      ...formatPainterRef.current,
      active: true,
      styles,
      sourceUid,
    };
    message.info('格式刷已开启，请点击目标节点应用样式');
  };

  const bindMindEvents = useCallback(() => {
    const instance = mindRef.current;
    if (!instance || typeof instance.on !== 'function' || instance.__formatPainterBound) {
      return;
    }
    const handleNodeActive = (node) => {
      if (node) {
        lastActiveNodeRef.current = node;
      }
      const painter = formatPainterRef.current;
      if (!painter.active || !painter.styles) return;
      const activeNode = node || getActiveNode();
      if (!activeNode) return;
      const activeUid = getNodeData(activeNode)?.uid || null;
      if (painter.sourceUid && activeUid && painter.sourceUid === activeUid) return;
      instance.execCommand('SET_NODE_STYLES', activeNode, painter.styles);
      message.success('已应用格式');
      stopFormatPainter();
    };
    const handleNodeContextMenu = (event, node) => {
      event?.preventDefault?.();
      nodeContextMenuRef.current = true;
      const pos = getEventClientPosition(event);
      setMindContextMenu({
        open: true,
        x: pos.x,
        y: pos.y,
        type: 'node',
        node,
      });
    };
    const handleCanvasContextMenu = (event) => {
      event?.preventDefault?.();
      if (nodeContextMenuRef.current) {
        nodeContextMenuRef.current = false;
        return;
      }
      const pos = getEventClientPosition(event);
      setMindContextMenu({
        open: true,
        x: pos.x,
        y: pos.y,
        type: 'canvas',
        node: null,
      });
    };
    const handleNodeDoubleClick = () => {
      nodeDoubleClickRef.current = true;
      window.setTimeout(() => {
        nodeDoubleClickRef.current = false;
      }, 0);
    };
    const handleCanvasDoubleClick = () => {
      if (nodeDoubleClickRef.current) return;
      const targetNode = getActiveNode() || lastActiveNodeRef.current || mindRef.current?.renderer?.root;
      if (!targetNode || !mindRef.current) return;
      mindRef.current.execCommand('INSERT_CHILD_NODE', true, [targetNode]);
      markCaseDirty();
    };
    const handleNodeIconClick = (...args) => {
      const node = args.find((item) => item && (item.nodeData || typeof item.getData === 'function'));
      const iconName = args.find((item) => typeof item === 'string');
      const event = args.find((item) => item && (item.clientX !== undefined || item.event || item.srcEvent || item.detail));
      if (!node || typeof iconName !== 'string') return;
      const [type] = iconName.split('_');
      if (!QUICK_ICON_TYPE_MAP[type]) return;
      const pos = getEventClientPosition(event);
      setIconQuickMenu({
        open: true,
        x: pos.x,
        y: pos.y,
        node,
        type,
        value: iconName,
      });
    };
    const handleNodeImageClick = (node, imageEl, event) => {
      const imageUrl = normalizeNodeImageUrl(node?.getData?.('image') || node?.nodeData?.data?.image);
      if (!imageUrl) return;
      event?.stopPropagation?.();
      event?.preventDefault?.();
      setNodeImagePreview({ open: true, url: imageUrl });
    };
    const handleScaleSync = () => {
      requestAnimationFrame(syncScaleFromMind);
    };
    const handleDirtyChange = () => {
      if (suppressDirtyCheckRef.current) return;
      if (caseDirty) return;
      setCaseDirty(true);
    };
    const handleNodeTreeRenderEnd = () => {
      if (!waitingCaseRenderRef.current) return;
      waitingCaseRenderRef.current = false;
      suppressDirtyCheckRef.current = false;
      setLoadingCase(false);
      if (caseRenderTimerRef.current) {
        window.clearTimeout(caseRenderTimerRef.current);
        caseRenderTimerRef.current = null;
      }
    };
    instance.on('node_active', handleNodeActive);
    instance.on('node_dblclick', handleNodeDoubleClick);
    instance.on('node_icon_click', handleNodeIconClick);
    instance.on('node_img_click', handleNodeImageClick);
    instance.on('node_contextmenu', handleNodeContextMenu);
    instance.on('contextmenu', handleCanvasContextMenu);
    instance.svg?.on?.('dblclick', handleCanvasDoubleClick);
    ['view_data_change', 'view_change', 'scale', 'translate'].forEach((eventName) => {
      instance.on(eventName, handleScaleSync);
    });
    instance.on('data_change', handleDirtyChange);
    instance.on('node_tree_render_end', handleNodeTreeRenderEnd);
    instance.__formatPainterBound = true;
    instance.__formatPainterHandler = handleNodeActive;
    instance.__nodeDoubleClickHandler = handleNodeDoubleClick;
    instance.__nodeIconClickHandler = handleNodeIconClick;
    instance.__nodeImageClickHandler = handleNodeImageClick;
    instance.__nodeContextMenuHandler = handleNodeContextMenu;
    instance.__canvasContextMenuHandler = handleCanvasContextMenu;
    instance.__canvasDoubleClickHandler = handleCanvasDoubleClick;
    instance.__scaleSyncHandler = handleScaleSync;
    instance.__dirtyChangeHandler = handleDirtyChange;
    instance.__nodeTreeRenderEndHandler = handleNodeTreeRenderEnd;
  }, [caseDirty, markCaseDirty, syncScaleFromMind]);

  const renderMindMap = useCallback((data, options = {}) => {
    if (!data) return;
    const {
      fitOnRender = false,
      fallbackTitle = '',
      skipSanitize = false,
      performanceMode = false,
      preserveView = false,
    } = options;
    const safeData = skipSanitize ? data : sanitizeMindData(data, fallbackTitle);
    const rootData = getMindRootData(safeData);
    const fullData = isFullMindData(safeData) ? safeData : null;
    clearRenderFrame();
    renderRetryRef.current = 0;

    const run = () => {
      const el = mindContainerRef.current;
      if (!el) return;

      const { width, height } = el.getBoundingClientRect();
      if ((width <= 0 || height <= 0) && renderRetryRef.current < 20) {
        renderRetryRef.current += 1;
        renderFrameRef.current = requestAnimationFrame(run);
        return;
      }

      if (width <= 0 || height <= 0) {
        message.error('脑图容器还未完成布局，请稍后重试');
        return;
      }

      renderRetryRef.current = 0;
      const viewData = preserveView ? mindRef.current?.view?.getTransformData?.() : null;
      const drawTransform = preserveView ? mindRef.current?.draw?.transform?.() : null;
      if (mindRef.current && Boolean(mindRef.current.__openPerformance) !== Boolean(performanceMode)) {
        try {
          mindRef.current.destroy();
        } catch (error) {
          // ignore destroy failures and recreate instance
        }
        mindRef.current = null;
      }
      if (!mindRef.current) {
        mindRef.current = new MindMap({
          el,
          data: rootData,
          layout: fullData?.layout || 'logicalStructure',
          theme: fullData?.theme?.template || 'default',
          themeConfig: fullData?.theme?.config || {},
          fit: true,
          readonly: uiOnly,
          enableFreeDrag: true,
          enableCtrlKeyNodeSelection: true,
          useLeftKeySelectionRightKeyDrag: false,
          customCheckEnableShortcut: (event) => {
            const target = event?.target;
            if (target === document.body) return true;
            if (!(target instanceof HTMLElement)) return false;
            const editClasses = mindRef.current?.editNodeClassList || [];
            if (editClasses.some((className) => target.classList.contains(className))) {
              return true;
            }
            const tag = (target.tagName || '').toLowerCase();
            if (['input', 'textarea', 'select'].includes(tag)) return false;
            if (target.isContentEditable) return false;
            if (target.closest('.ant-input, .ant-select, [contenteditable="true"]')) return false;
            const editorRoot = editorPanelRef.current;
            const canvasRoot = mindContainerRef.current;
            return Boolean(
              (editorRoot && editorRoot.contains(target))
              || (canvasRoot && canvasRoot.contains(target))
            );
          },
          beforeShortcutRun: (key) => key === 'Control+v',
          iconList: MIND_ICON_LIST,
          openPerformance: Boolean(performanceMode),
          performanceConfig: {
            time: 300,
            padding: 40,
            removeNodeWhenOutCanvas: true,
          },
        });
        mindRef.current.__openPerformance = Boolean(performanceMode);
        bindMindEvents();
        if (fullData) {
          mindRef.current.setFullData(fullData);
        }
        requestAnimationFrame(() => {
          if (preserveView && viewData && mindRef.current?.view?.setTransformData) {
            mindRef.current.view.setTransformData(viewData);
          } else if (preserveView && drawTransform) {
            mindRef.current?.draw?.transform?.(drawTransform);
          } else if (fitOnRender) {
            mindRef.current?.view?.fit?.();
          }
          syncScaleFromMind();
        });
        return;
      }
      if (fullData) {
        mindRef.current.setFullData(fullData);
      } else {
        mindRef.current.setData(rootData);
      }
      requestAnimationFrame(() => {
        if (preserveView && viewData && mindRef.current?.view?.setTransformData) {
          mindRef.current.view.setTransformData(viewData);
        } else if (preserveView && drawTransform) {
          mindRef.current?.draw?.transform?.(drawTransform);
        } else if (fitOnRender) {
          mindRef.current?.view?.fit?.();
        }
        syncScaleFromMind();
      });
    };

    renderFrameRef.current = requestAnimationFrame(run);
  }, [clearRenderFrame, syncScaleFromMind]);

  const loadCase = async (record, options = {}) => {
    const { force = false, draftResult = null } = options;
    if (!projectId) return;
    if (!force && caseDirty && currentCase?.id && record?.id && currentCase.id !== record.id) {
      openUnsavedConfirm(() => {
        void loadCase(record, { force: true });
      });
      return;
    }
    setLoadingCase(true);
    waitingCaseRenderRef.current = true;
    try {
      const res = await queryFunctionalCaseFile({ id: record.id, project_id: projectId });
      if (res?.code === 0) {
        const fallbackTitle = res?.data?.title || record?.title || '功能用例';
        const safeFullData = sanitizeMindData(res?.data?.data || defaultCaseData(fallbackTitle), fallbackTitle);
        const safeData = uiOnly
          ? extractNamedSubtreeData(safeFullData, uiRootName, fallbackTitle)
          : safeFullData;
        const draftData = draftResult?.data
          ? sanitizeMindData(draftResult.data, draftResult.title || fallbackTitle)
          : null;
        const displayTitle = draftResult?.title || fallbackTitle;
        const displayData = draftData || safeData;
        const baseStats = countMindData(getMindRootData(safeData));
        const displayStats = draftData ? countMindData(getMindRootData(displayData)) : baseStats;
        const nodeCount = Number(displayStats?.nodeCount || 0);
        const isHugeCase = nodeCount >= HUGE_CASE_NODE_THRESHOLD;
        const renderData = isHugeCase ? buildHugeCasePreview(displayData, 2) : displayData;
        currentCaseRenderVersionRef.current += 1;
        suppressDirtyCheckRef.current = true;
        savedCaseSnapshotRef.current = buildCaseSnapshot(displayData, fallbackTitle);
        setCaseDirty(Boolean(draftData));
        setCurrentCase({
          ...res.data,
          title: displayTitle,
          data: renderData,
          __fullData: safeFullData,
          __dataSanitized: true,
          __nodeCount: nodeCount,
          __wordCount: Number(displayStats?.wordCount || 0),
          __isHugeCase: isHugeCase,
          case_count: draftData
            ? Number(draftResult?.caseCount || 0)
            : Number(res?.data?.case_count ?? res?.data?.case_num ?? 0),
          create_user_name: res?.data?.create_user_name || res?.data?.creator_name || record?.create_user_name || '',
        });
        if (isHugeCase) {
          waitingCaseRenderRef.current = false;
          setLoadingCase(false);
        }
      } else {
        message.error(res?.msg || '获取功能用例详情失败');
        waitingCaseRenderRef.current = false;
        setLoadingCase(false);
      }
    } catch (error) {
      message.error(error?.message || '获取功能用例详情失败');
      waitingCaseRenderRef.current = false;
      setLoadingCase(false);
    }
  };

  useEffect(() => {
    const { routeProjectId, routeCaseId, resultToken } = pendingGeneratedCaseView;
    if (!isFunctionalCaseRouteActive || !routeProjectId || !routeCaseId) return;
    if (projectId !== routeProjectId) {
      saveProject(routeProjectId);
      return;
    }
    if (caseFiles.length === 0) return;
    const targetRecord = caseFiles.find((item) => Number(item?.id) === Number(routeCaseId));
    if (!targetRecord) {
      if (appliedKeyword || searchText) {
        if (searchText) setSearchText('');
        if (appliedKeyword) setAppliedKeyword('');
        void fetchTree('', routeProjectId);
        return;
      }
      clearGeneratedCaseRouteQuery();
      return;
    }
    const handledKey = `${routeProjectId}_${routeCaseId}_${resultToken || 'no_token'}`;
    if (handledGeneratedViewRef.current === handledKey) return;
    handledGeneratedViewRef.current = handledKey;

    const openGeneratedCase = async () => {
      setCurrentDirectory(targetRecord.directory_id || null);
      const storedResult = readFunctionalCaseResult(resultToken);
      let draftResult = null;
      if (storedResult?.data && Number(storedResult?.targetCaseId) === Number(targetRecord.id)) {
        draftResult = {
          projectId: routeProjectId,
          targetCaseId: Number(storedResult.targetCaseId || targetRecord.id),
          targetCaseTitle: storedResult.targetCaseTitle || storedResult.title || targetRecord.title || '功能用例',
          title: storedResult.title || targetRecord.title || '功能用例',
          data: storedResult.data,
          caseCount: Number(storedResult.caseCount || 0),
          reviewProvider: storedResult.reviewProvider || '',
          reviewRounds: Number(storedResult.reviewRounds || 0),
          elapsedText: storedResult.elapsedText || '',
          resultToken,
        };
        pendingRouteGeneratedResultRef.current = draftResult;
      }
      await loadCase(targetRecord, { force: true, draftResult });
      if (!storedResult?.data || Number(storedResult?.targetCaseId) !== Number(targetRecord.id)) {
        clearGeneratedCaseRouteQuery();
      }
    };

    void openGeneratedCase();
  }, [
    applyImportedData,
    appliedKeyword,
    caseFiles,
    fetchTree,
    clearGeneratedCaseRouteQuery,
    isFunctionalCaseRouteActive,
    loadCase,
    pendingGeneratedCaseView,
    projectId,
    saveProject,
    searchText,
  ]);

  useEffect(() => {
    if (!dispatch) return;
    dispatch({ type: 'project/listProject' });
  }, [dispatch]);

  useEffect(() => {
    if (!dispatch || projects.length === 0) return;
    const exists = projects.some((item) => item.id === projectId);
    if (exists) return;
    const firstProjectId = projects[0]?.id;
    if (!firstProjectId) return;
    saveProject(firstProjectId);
  }, [dispatch, projects, projectId, saveProject]);

  useEffect(() => {
    if (!projectId) {
      setDirectoryTree([]);
      setCaseFiles([]);
      setCurrentDirectory(null);
      setCurrentCase(null);
      setCaseDirty(false);
      savedCaseSnapshotRef.current = '';
      suppressDirtyCheckRef.current = false;
      destroyMindMap();
      return;
    }
    fetchTree('', projectId);
  }, [projectId, fetchTree, destroyMindMap]);

  useEffect(() => () => {
    destroyMindMap();
  }, [destroyMindMap]);

  useEffect(() => {
    currentDirectoryRef.current = currentDirectory;
  }, [currentDirectory]);

  useEffect(() => {
    if (!caseDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = UNSAVED_CASE_CLOSE_TEXT;
      return UNSAVED_CASE_CLOSE_TEXT;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [caseDirty]);

  useEffect(() => {
    window.__FUNCTIONAL_CASE_UNSAVED__ = {
      dirty: caseDirty,
      path: (history?.location?.pathname || '/apiTest/functionalCase').toLowerCase(),
    };
    return () => {
      if (window.__FUNCTIONAL_CASE_UNSAVED__) {
        window.__FUNCTIONAL_CASE_UNSAVED__ = { dirty: false, path: '' };
      }
    };
  }, [caseDirty]);

  useEffect(() => {
    if (typeof history?.block !== 'function') return undefined;
    const unblock = history.block((tx) => {
      if (!caseDirty) {
        unblock();
        tx.retry?.();
        return;
      }
      if (routeConfirmingRef.current) return;
      routeConfirmingRef.current = true;
      openUnsavedConfirm(
        () => {
          routeConfirmingRef.current = false;
          unblock();
          tx.retry?.();
        },
        () => {
          routeConfirmingRef.current = false;
        },
      );
    });
    return () => unblock?.();
  }, [caseDirty, openUnsavedConfirm]);

  useEffect(() => {
    const currentPath = (history?.location?.pathname || '/apiTest/functionalCase').toLowerCase();
    const getTopTabCloseButton = (target) => {
      if (!(target instanceof HTMLElement)) return null;
      const button = target.closest('.ant-tabs-tab-remove');
      if (!(button instanceof HTMLButtonElement)) return null;
      const tabItem = button.closest('[data-node-key]');
      const nodeKey = String(tabItem?.getAttribute?.('data-node-key') || '').toLowerCase();
      if (!nodeKey) return null;
      if (!nodeKey.startsWith(currentPath)) return null;
      return button;
    };

    const handleTopTabClose = (event) => {
      if (!caseDirty || tabActionBypassRef.current) return;
      const closeButton = getTopTabCloseButton(event.target);
      if (!closeButton) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      openUnsavedConfirm(
        () => {
          tabActionBypassRef.current = true;
          window.setTimeout(() => {
            closeButton.click();
            window.setTimeout(() => {
              tabActionBypassRef.current = false;
            }, 0);
          }, 0);
        },
        () => {
          tabActionBypassRef.current = false;
        },
      );
    };

    document.addEventListener('click', handleTopTabClose, true);
    return () => document.removeEventListener('click', handleTopTabClose, true);
  }, [caseDirty, openUnsavedConfirm]);

  useEffect(() => {
    if (currentCase) {
      const isLargeCase = Number(currentCase?.__nodeCount || 0) >= LARGE_CASE_NODE_THRESHOLD;
      const isHugeCase = Number(currentCase?.__nodeCount || 0) >= HUGE_CASE_NODE_THRESHOLD;
      const enableHugeMode = hugeCaseModeOverride === null ? isHugeCase : Boolean(hugeCaseModeOverride);
      const renderDescriptor = `${currentCase.id || 'unknown'}:${currentCaseRenderVersionRef.current}:${enableHugeMode ? 'huge' : 'normal'}`;
      const canReuseCurrentCanvas = mindRef.current && renderedCaseDescriptorRef.current === renderDescriptor;
      if (canReuseCurrentCanvas) {
        return;
      }
      const preserveView = Boolean(
        mindRef.current &&
        renderedCaseDescriptorRef.current &&
        String(renderedCaseDescriptorRef.current).split(':')[0] === String(currentCase.id || 'unknown')
      );
      if (!preserveView) {
        setScale(100);
      }
      suppressDirtyCheckRef.current = true;
      renderMindMap(currentCase.data || defaultCaseData(currentCase.title), {
        fitOnRender: !mindRef.current && !isLargeCase,
        fallbackTitle: currentCase.title,
        skipSanitize: Boolean(currentCase.__dataSanitized),
        performanceMode: enableHugeMode,
        preserveView,
      });
      renderedCaseDescriptorRef.current = renderDescriptor;
      if (caseRenderTimerRef.current) {
        window.clearTimeout(caseRenderTimerRef.current);
      }
      caseRenderTimerRef.current = window.setTimeout(() => {
        waitingCaseRenderRef.current = false;
        suppressDirtyCheckRef.current = false;
        setLoadingCase(false);
        caseRenderTimerRef.current = null;
      }, isLargeCase ? 6000 : 3000);
    } else {
      waitingCaseRenderRef.current = false;
      suppressDirtyCheckRef.current = false;
      setCaseDirty(false);
      savedCaseSnapshotRef.current = '';
      currentCaseRenderVersionRef.current = 0;
      renderedCaseDescriptorRef.current = '';
      destroyMindMap();
      setLoadingCase(false);
    }
  }, [currentCase, hugeCaseModeOverride, destroyMindMap, renderMindMap]);

  useEffect(() => {
    if (!currentCase || !mindRef.current) return undefined;
    const isLargeCase = Number(currentCase?.__nodeCount || 0) >= LARGE_CASE_NODE_THRESHOLD;
    let firstFrame = null;
    let secondFrame = null;
    const timer = isLargeCase ? null : window.setTimeout(() => refreshMindGeometry(true), 260);
    firstFrame = requestAnimationFrame(() => {
      refreshMindGeometry(true);
      if (!isLargeCase) {
        secondFrame = requestAnimationFrame(() => refreshMindGeometry(true));
      }
    });
    return () => {
      if (firstFrame) cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      if (timer) window.clearTimeout(timer);
    };
  }, [treeCollapsed, currentCase, refreshMindGeometry]);

  useEffect(() => {
    const el = mindContainerRef.current;
    if (!el || !currentCase || typeof ResizeObserver === 'undefined') return undefined;
    let frame = null;
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => refreshMindGeometry(true));
    });
    observer.observe(el);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [currentCase?.id, refreshMindGeometry]);

  useEffect(() => {
    if (!currentCase) return undefined;
    let frame = null;
    let fitFrame = null;
    const handleWindowResize = () => {
      if (frame) cancelAnimationFrame(frame);
      if (fitFrame) cancelAnimationFrame(fitFrame);
      frame = requestAnimationFrame(() => {
        refreshMindGeometry(false);
        fitFrame = requestAnimationFrame(() => {
          mindRef.current?.view?.fit?.();
          syncScaleFromMind();
        });
      });
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (frame) cancelAnimationFrame(frame);
      if (fitFrame) cancelAnimationFrame(fitFrame);
    };
  }, [currentCase?.id, refreshMindGeometry, syncScaleFromMind]);

  useEffect(() => {
    const el = mindContainerRef.current;
    if (!el || !currentCase) return undefined;
    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(syncScaleFromMind);
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: true });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [currentCase?.id, syncScaleFromMind]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setCanvasFullscreen(document.fullscreenElement === editorPanelRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = (target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return true;
      if (target.isContentEditable) return true;
      return Boolean(target.closest('.ant-input, .ant-select, [contenteditable="true"]'));
    };
    const isCanvasTarget = (target) => {
      const container = editorPanelRef.current || mindContainerRef.current;
      return !target
        || target === document.body
        || target === document.documentElement
        || (container && target instanceof Node && container.contains(target));
    };
    const handleClipboardCapture = (source) => (event) => {
      if (!currentCase || !mindRef.current) return;
      if (isEditableTarget(event.target)) return;
      if (!isCanvasTarget(event.target)) return;
      requestAnimationFrame(() => cacheInternalClipboard(source));
    };
    const handleCopy = handleClipboardCapture('copy');
    const handleCut = handleClipboardCapture('cut');
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCut, true);
    return () => {
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCut, true);
    };
  }, [currentCase?.id, cacheInternalClipboard]);

  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = (target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return true;
      if (target.isContentEditable) return true;
      return Boolean(target.closest('.ant-input, .ant-select, [contenteditable="true"]'));
    };
    const handlePaste = async (event) => {
      if (!currentCase || !mindRef.current) return;
      if (isEditableTarget(event.target)) return;
      const container = editorPanelRef.current || mindContainerRef.current;
      const isCanvasTarget = !event.target
        || event.target === document.body
        || event.target === document.documentElement
        || (container && event.target instanceof Node && container.contains(event.target));
      if (!isCanvasTarget) return;
      const clipboard = event?.clipboardData;
      if (!clipboard) return;
      const plainText = clipboard.getData('text/plain') || '';
      const jsonText = clipboard.getData('application/json') || '';
      const htmlText = clipboard.getData('text/html') || '';
      const rtfText = clipboard.getData('text/rtf') || '';
      const hasTextPayload = Boolean(jsonText || plainText || htmlText || rtfText);
      const imageItem = Array.from(clipboard.items || []).find((item) => item.type?.startsWith('image/'));
      const imageFile = imageItem?.getAsFile?.() || null;
      const pastedData = getClipboardMindData(event);
      if (pastedData) {
        event.preventDefault();
        const inserted = insertPastedDataAfterActiveNode(pastedData);
        if (!inserted) {
          applyImportedData(pastedData);
          message.success('已在画布展示粘贴内容');
        }
        return;
      }
      if (!imageFile || hasTextPayload) return;
      event.preventDefault();
      try {
        const imageUrl = await readFileAsDataUrl(imageFile);
        if (!imageUrl) return;
        const size = await loadImageNaturalSize(imageUrl);
        const payload = size
          ? { url: imageUrl, width: size.width, height: size.height }
          : { url: imageUrl };
        const nodes = getActiveNodes();
        if (nodes.length === 0) return;
        nodes.forEach((node) => {
          mindRef.current.execCommand('SET_NODE_IMAGE', node, payload);
        });
        markCaseDirty();
        message.success('图片已粘贴到当前节点');
      } catch (error) {
        message.error(error?.message || '粘贴图片失败');
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [currentCase?.id]);

  const refreshTree = async () => {
    if (!projectId) return;
    await fetchTree(appliedKeyword, projectId);
  };

  const openDirectoryModal = (record = null, parent = null) => {
    setDirectoryName(record?.title || record?.name || '');
    setDirectoryModal({ open: true, record, parent });
  };

  const submitDirectory = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    const name = directoryName.trim();
    if (!name) {
      message.warning('请输入目录名称');
      return;
    }
    const payload = {
      project_id: projectId,
      name,
      parent: directoryModal.record ? directoryModal.record.parent : directoryModal.parent,
      sort_index: directoryModal.record?.sort_index || 0,
    };
    const res = directoryModal.record
      ? await updateFunctionalCaseDirectory({ ...payload, id: directoryModal.record.id })
      : await insertFunctionalCaseDirectory(payload);
    if (res?.code === 0) {
      message.success('保存成功');
      setDirectoryModal({ open: false, record: null, parent: null });
      await refreshTree();
    } else {
      message.error(res?.msg || '保存目录失败');
    }
  };

  const handleDeleteDirectory = async (id) => {
    if (!projectId) return;
    const res = await deleteFunctionalCaseDirectory({ id, project_id: projectId });
    if (res?.code === 0) {
      message.success('删除成功');
      if (currentDirectory === id) {
        setCurrentDirectory(null);
        setCurrentCase(null);
        destroyMindMap();
      }
      await refreshTree();
    } else {
      message.error(res?.msg || '删除目录失败');
    }
  };

  const openCaseModal = (record = null, directoryId = currentDirectory) => {
    setCaseTitle(record?.title || '');
    setCaseModal({ open: true, record, directoryId });
  };

  const submitCase = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    const title = caseTitle.trim();
    if (!title) {
      message.warning('请输入用例名称');
      return;
    }
    const directoryId = caseModal.directoryId || currentDirectory;
    if (!directoryId) {
      message.warning('请先选择目录');
      return;
    }
    let data = caseModal.record?.data;
    if (caseModal.record?.id === currentCase?.id) {
      data = getMindData();
    } else if (caseModal.record?.id && !data) {
      const detailRes = await queryFunctionalCaseFile({ id: caseModal.record.id, project_id: projectId });
      if (detailRes?.code !== 0) {
        message.error(detailRes?.msg || '获取功能用例详情失败');
        return;
      }
      data = detailRes.data?.data;
    }
    data = sanitizeMindData(data || defaultCaseData(title), title);
    if (uiOnly) {
      if (!caseModal.record) {
        data = sanitizeMindData({
          data: { text: title || caseCanvasLabel },
          children: [defaultCaseData(uiRootName)],
        }, title);
      } else {
        const fullCaseData = caseModal.record?.id === currentCase?.id
          ? (currentCase?.__fullData || data)
          : data;
        data = replaceNamedSubtreeData(fullCaseData, uiRootName, data, title);
      }
    }
    const res = caseModal.record
      ? await updateFunctionalCaseFile({
        ...caseModal.record,
        project_id: projectId,
        title,
        directory_id: directoryId,
        data,
        sort_index: caseModal.record.sort_index || 0,
      })
      : await insertFunctionalCaseFile({ project_id: projectId, title, directory_id: directoryId, data, sort_index: 0 });
    if (res?.code === 0) {
      message.success('保存成功');
      setCaseModal({ open: false, record: null, directoryId: null });
      setCurrentDirectory(directoryId);
      await refreshTree();
      await loadCase(res.data);
    } else {
      message.error(res?.msg || '保存用例失败');
    }
  };

  const saveMind = async () => {
    if (!projectId) {
      message.warning('请先选择项目');
      return;
    }
    if (!currentCase) {
      message.warning(`请先选择${caseLabel}`);
      return;
    }
    setSaving(true);
    try {
      const latestData = sanitizeMindData(getMindData());
      const persistedData = uiOnly
        ? replaceNamedSubtreeData(currentCase.__fullData || defaultCaseData(currentCase.title), uiRootName, latestData, currentCase.title)
        : latestData;
      const res = await updateFunctionalCaseFile({
        id: currentCase.id,
        project_id: projectId,
        title: currentCase.title,
        directory_id: currentCase.directory_id,
        data: persistedData,
        sort_index: currentCase.sort_index || 0,
      });
      if (res?.code === 0) {
        message.success('保存成功');
        savedCaseSnapshotRef.current = buildCaseSnapshot(latestData, currentCase.title);
        setCaseDirty(false);
        setCurrentCase((prev) => (prev ? ({
          ...prev,
          data: latestData,
          __fullData: persistedData,
        }) : prev));
        await refreshTree();
      } else {
        message.error(res?.msg || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCase = async () => {
    if (!projectId) return;
    const res = await deleteFunctionalCaseFile({ id: currentCase.id, project_id: projectId });
    if (res?.code === 0) {
      message.success('删除成功');
      setCaseDirty(false);
      savedCaseSnapshotRef.current = '';
      setCurrentCase(null);
      destroyMindMap();
      await refreshTree();
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const deleteCaseById = async (id) => {
    if (!projectId) return;
    const res = await deleteFunctionalCaseFile({ id, project_id: projectId });
    if (res?.code === 0) {
      message.success('删除成功');
      if (currentCase?.id === id) {
        setCurrentCase(null);
        destroyMindMap();
      }
      await refreshTree();
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const openMoveModal = (type, record) => {
    setMoveModal({ open: true, type, record });
    if (type === 'directory') {
      setMoveParent(record.parent ?? null);
      setMoveDirectoryId(null);
      setMoveSortIndex(record.sort_index || 0);
      return;
    }
    setMoveDirectoryId(record.directory_id || currentDirectory);
    setMoveParent(null);
    setMoveSortIndex(record.sort_index || 0);
  };

  const submitMove = async () => {
    if (!projectId) return;
    if (!moveModal.record) return;
    if (moveModal.type === 'directory') {
      const res = await moveFunctionalCaseDirectory({
        id: moveModal.record.id,
        project_id: projectId,
        parent: moveParent ?? null,
        sort_index: moveSortIndex || 0,
      });
      if (res?.code === 0) {
        message.success('移动成功');
        setMoveModal({ open: false, type: '', record: null });
        await refreshTree();
      } else {
        message.error(res?.msg || '移动目录失败');
      }
      return;
    }

    if (!moveDirectoryId) {
      message.warning('请选择目标目录');
      return;
    }
    const res = await moveFunctionalCaseFile({
      id: moveModal.record.id,
      project_id: projectId,
      directory_id: moveDirectoryId,
      sort_index: moveSortIndex || 0,
    });
    if (res?.code === 0) {
      message.success('移动成功');
      if (currentCase?.id === moveModal.record.id) {
        setCurrentCase({ ...currentCase, directory_id: moveDirectoryId, sort_index: moveSortIndex || 0 });
        setCurrentDirectory(moveDirectoryId);
      }
      setMoveModal({ open: false, type: '', record: null });
      await refreshTree();
    } else {
      message.error(res?.msg || '移动用例失败');
    }
  };

  const handleDrop = async ({ dragNode, node }) => {
    if (!projectId) return;
    const targetDirectoryId = node.nodeType === 'case' ? node.directory_id : node.id;
    if (!targetDirectoryId) return;
    if (dragNode.nodeType === 'directory') {
      if (dragNode.id === targetDirectoryId) return;
      const res = await moveFunctionalCaseDirectory({
        id: dragNode.id,
        project_id: projectId,
        parent: targetDirectoryId,
        sort_index: dragNode.sort_index || 0,
      });
      if (res?.code === 0) {
        message.success('目录已移动');
        await refreshTree();
      } else {
        message.error(res?.msg || '移动目录失败');
      }
      return;
    }
    const res = await moveFunctionalCaseFile({
      id: dragNode.id,
      project_id: projectId,
      directory_id: targetDirectoryId,
      sort_index: dragNode.sort_index || 0,
    });
    if (res?.code === 0) {
      message.success('用例已移动');
      await refreshTree();
    } else {
      message.error(res?.msg || '移动用例失败');
    }
  };

  const applyTheme = (value) => {
    const preset = THEME_PRESETS.find((item) => item.value === value);
    if (!preset || !mindRef.current) return;
    setActiveThemeValue(value);
    mindRef.current.setThemeConfig(preset.config);
  };

  const applyLayout = (value) => {
    if (!mindRef.current) return;
    try {
      mindRef.current.setLayout(value);
      setActiveLayoutValue(value);
    } catch {
      message.warning('当前结构暂不可用，已保持原结构');
    }
  };

  const setNodeStyle = (prop, value) => {
    execNodeCommand('SET_NODE_STYLE', prop, value);
  };

  const getActiveNodeStyleValue = (prop) => {
    const node = getActiveNode();
    if (!node) return undefined;
    if (typeof node.getData === 'function') {
      const dataValue = node.getData(prop);
      if (typeof dataValue !== 'undefined') return dataValue;
    }
    if (typeof node.getStyle === 'function') {
      return node.getStyle(prop);
    }
    return undefined;
  };

  const toggleNodeStyle = (prop, activeValue, inactiveValue) => {
    const currentValue = getActiveNodeStyleValue(prop);
    const nextValue = currentValue === activeValue ? inactiveValue : activeValue;
    setNodeStyle(prop, nextValue);
  };

  const setNodeStyles = (styles) => {
    execNodeCommand('SET_NODE_STYLES', styles);
  };

  const setThemeValue = (prop, value) => {
    if (!mindRef.current) {
      message.warning(`请先选择${caseLabel}`);
      return;
    }
    const viewData = mindRef.current.view?.getTransformData?.();
    const drawTransform = mindRef.current.draw?.transform?.();
    const fullData = mindRef.current.getData?.(true) || {};
    const currentConfig = fullData.theme?.config || mindRef.current.opt?.themeConfig || {};
    mindRef.current.setThemeConfig({ ...currentConfig, [prop]: value });
    mindRef.current.associativeLine?.renderAllLines?.();
    mindRef.current.render?.();
    requestAnimationFrame(() => {
      if (viewData && mindRef.current?.view?.setTransformData) {
        mindRef.current.view.setTransformData(viewData);
      } else if (drawTransform) {
        mindRef.current?.draw?.transform?.(drawTransform);
      }
      syncScaleFromMind();
    });
  };

  const updateMindConfig = (config) => {
    if (!mindRef.current) {
      message.warning(`请先选择${caseLabel}`);
      return;
    }
    mindRef.current.updateConfig(config);
  };

  const fitView = () => {
    if (!mindRef.current) {
      message.warning(`请先选择${caseLabel}`);
      return;
    }
    mindRef.current.view?.fit?.();
    requestAnimationFrame(syncScaleFromMind);
  };

  const resetView = () => {
    if (!mindRef.current) {
      message.warning(`请先选择${caseLabel}`);
      return;
    }
    mindRef.current.view?.reset?.();
    requestAnimationFrame(syncScaleFromMind);
  };

  const centerActiveNode = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current?.renderer?.moveNodeToCenter?.(node);
  };

  const toggleActiveNodeExpand = (expand) => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_EXPAND', node, expand);
  };

  const clearNodeExtra = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    mindRef.current.execCommand('SET_NODE_ICON', node, []);
    mindRef.current.execCommand('SET_NODE_TAG', node, []);
    mindRef.current.execCommand('SET_NODE_HYPERLINK', node, '', '');
    mindRef.current.execCommand('SET_NODE_NOTE', node, '');
    mindRef.current.execCommand('SET_NODE_ATTACHMENT', node, '', '');
    mindRef.current.execCommand('SET_NODE_IMAGE', node, { url: null });
  };

  const renderColorSwatches = (onPick) => (
    <div className="functional-color-grid">
      {COLOR_SWATCHES.map((color) => (
        <button
          type="button"
          key={color}
          title={color}
          style={{ background: color }}
          onClick={() => onPick(color)}
        />
      ))}
    </div>
  );

  const renderColorField = (label, onPick) => (
    <div className="functional-color-field">
      <span>{label}</span>
      {renderColorSwatches(onPick)}
    </div>
  );

  const renderSliderField = (label, field, onChange, min = 0, max = 40) => (
    <div className="functional-slider-field">
      <div className="functional-slider-label">
        <span>{label}</span>
        <strong>{styleDraft[field]}</strong>
      </div>
      <Slider
        min={min}
        max={max}
        value={styleDraft[field]}
        onChange={(value) => {
          setStyleDraft((prev) => ({ ...prev, [field]: value }));
          onChange(value);
        }}
      />
    </div>
  );

  const openLink = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setLinkUrl(node.getData?.('hyperlink') || '');
    setLinkTitle(node.getData?.('hyperlinkTitle') || '');
    setLinkModal({ open: true });
  };

  const submitLink = () => {
    execNodeCommand('SET_NODE_HYPERLINK', linkUrl.trim(), linkTitle.trim());
    setLinkModal({ open: false });
  };

  const openNote = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setNoteText(node.getData?.('note') || '');
    setNoteModal({ open: true });
  };

  const submitNote = () => {
    execNodeCommand('SET_NODE_NOTE', noteText);
    setNoteModal({ open: false });
  };

  const openImage = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setImageUrl(normalizeNodeImageUrl(node.getData?.('image')));
    setImageModal({ open: true });
  };

  const submitImage = () => {
    const url = imageUrl.trim();
    if (!url) {
      execNodeCommand('SET_NODE_IMAGE', { url: null });
      setImageModal({ open: false });
      return;
    }
    loadImageNaturalSize(url).then((size) => {
      const payload = size ? { url, width: size.width, height: size.height } : { url };
      execNodeCommand('SET_NODE_IMAGE', payload);
    });
    setImageModal({ open: false });
  };

  const handleNodeImageUpload = async (file) => {
    if (!file?.type?.startsWith?.('image/')) {
      message.warning('仅支持上传图片文件');
      return Upload.LIST_IGNORE;
    }
    try {
      setImageUploading(true);
      const res = await uploadFunctionalCaseNodeImage(file);
      if (res?.code !== 0) {
        message.warning(res?.msg || '图片上传失败，请重试');
        return Upload.LIST_IGNORE;
      }
      const staticUrl = String(res?.data?.url || '').trim();
      if (!staticUrl) {
        message.warning('图片上传成功但未返回访问地址');
        return Upload.LIST_IGNORE;
      }
      const backendBase = String(CONFIG.URL || '').replace(/\/$/, '');
      const absoluteUrl = staticUrl.startsWith('http')
        ? staticUrl
        : `${backendBase}${staticUrl.startsWith('/') ? staticUrl : `/${staticUrl}`}`;
      setImageUrl(absoluteUrl);
      const activeNode = getActiveNode();
      if (activeNode && mindRef.current) {
        const size = await loadImageNaturalSize(absoluteUrl);
        const payload = size
          ? { url: absoluteUrl, width: size.width, height: size.height }
          : { url: absoluteUrl };
        mindRef.current.execCommand('SET_NODE_IMAGE', activeNode, payload);
        markCaseDirty();
      }
      message.success('图片已上传，可预览后应用');
    } catch (error) {
      message.error(error?.message || '图片上传失败');
    } finally {
      setImageUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  const openAttachment = () => {
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    setAttachmentUrl(node.getData?.('attachmentUrl') || '');
    setAttachmentName(node.getData?.('attachmentName') || '');
    setAttachmentModal({ open: true });
  };

  const submitAttachment = () => {
    execNodeCommand('SET_NODE_ATTACHMENT', attachmentUrl.trim(), attachmentName.trim());
    setAttachmentModal({ open: false });
  };

  const removeNodeImage = () => {
    execNodeCommand('SET_NODE_IMAGE', { url: null });
    setImageUrl('');
    message.success('节点图片已删除');
  };

  const removeNodeAttachment = () => {
    execNodeCommand('SET_NODE_ATTACHMENT', '', '');
    setAttachmentUrl('');
    setAttachmentName('');
    message.success('节点附件已删除');
  };

  const handleNodeAttachmentUpload = async (file) => {
    try {
      setAttachmentUploading(true);
      const res = await uploadFunctionalCaseNodeAttachment(file);
      if (res?.code !== 0) {
        message.warning(res?.msg || '附件上传失败，请重试');
        return Upload.LIST_IGNORE;
      }
      const staticUrl = String(res?.data?.url || '').trim();
      if (!staticUrl) {
        message.warning('附件上传成功但未返回访问地址');
        return Upload.LIST_IGNORE;
      }
      const backendBase = String(CONFIG.URL || '').replace(/\/$/, '');
      const absoluteUrl = staticUrl.startsWith('http')
        ? staticUrl
        : `${backendBase}${staticUrl.startsWith('/') ? staticUrl : `/${staticUrl}`}`;
      setAttachmentUrl(absoluteUrl);
      setAttachmentName(String(res?.data?.name || file?.name || '').trim());
      const activeNode = getActiveNode();
      if (activeNode && mindRef.current) {
        mindRef.current.execCommand(
          'SET_NODE_ATTACHMENT',
          activeNode,
          absoluteUrl,
          String(res?.data?.name || file?.name || '').trim(),
        );
        markCaseDirty();
      }
      message.success('附件已上传，可直接保存到当前节点');
    } catch (error) {
      message.error(error?.message || '附件上传失败');
    } finally {
      setAttachmentUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  const submitFormula = () => {
    if (!formulaText.trim()) {
      message.warning('请输入公式');
      return;
    }
    const node = getActiveNode();
    if (!node) {
      message.warning('请先选中脑图节点');
      return;
    }
    const formula = formulaText.trim();
    if (mindRef.current.formula?.insertFormulaToNode && mindRef.current.richText?.showEditText) {
      mindRef.current.formula.insertFormulaToNode(node, formula);
    } else {
      const currentText = getNodeData(node).text || '';
      const nextText = currentText ? `${currentText}\n$${formula}$` : `$${formula}$`;
      mindRef.current.execCommand('SET_NODE_DATA', node, {
        text: nextText,
        formula,
      });
      mindRef.current.render?.();
    }
    setFormulaModal({ open: false });
    setFormulaText('');
  };

  const openFormulaModal = () => {
    if (!getActiveNode()) {
      message.warning('请先选中脑图节点');
      return;
    }
    setFormulaText('');
    setFormulaModal({ open: true });
  };

  const openExportModal = () => {
    if (!currentCase) return;
    setExportModal({
      open: true,
      type: 'png',
      name: currentCase.title || '功能用例',
    });
  };

  const submitExport = async () => {
    if (!mindRef.current || !currentCase) {
      message.warning(`请先选择${caseLabel}`);
      return;
    }
    const fileName = (exportModal.name || currentCase.title || '功能用例').trim();
    const typeMap = {
      png: 'png',
      xmind: 'xmind',
      markdown: 'md',
    };
    const exportType = typeMap[exportModal.type] || exportModal.type;
    try {
      if (exportModal.type === 'xmind') {
        const originalData = mindRef.current.getData(true);
        await exportXMindFile(normalizeXMindExportData(originalData), fileName);
        setExportModal((prev) => ({ ...prev, open: false }));
        message.warning('XMind 客户端对网页自定义样式支持有限，已导出优先级/进度标记和标签；完整视觉请导出 PNG。');
        return;
      }
      await mindRef.current.export(exportType, true, fileName);
      setExportModal((prev) => ({ ...prev, open: false }));
      message.success('导出成功');
    } catch (error) {
      if (exportModal.type === 'markdown') {
        try {
          await mindRef.current.export('markdown', true, fileName);
          setExportModal((prev) => ({ ...prev, open: false }));
          message.success('导出成功');
          return;
        } catch (innerError) {
          message.error('导出失败');
          return;
        }
      }
      message.error('导出失败');
    }
  };

  const confirmDeleteCurrentCase = () => {
    if (!currentCase) return;
    Modal.confirm({
      title: '确认删除该功能用例吗？',
      centered: true,
      content: `将删除「${currentCase.title || '未命名用例'}」，删除后不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteCase(),
    });
  };

  const toggleCanvasFullscreen = async () => {
    const target = editorPanelRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen?.();
      } else if (!document.fullscreenElement) {
        await target.requestFullscreen?.();
      }
    } catch (error) {
      message.warning('当前浏览器不支持全屏切换');
    }
  };

  const triggerImport = () => {
    importFileRef.current?.click?.();
  };

  const parseImportFile = (file) => {
    const lowerName = (file?.name || '').toLowerCase();
    const isXmind = lowerName.endsWith('.xmind');
    if (isXmind) {
      const parser = mindRef.current?.doExportXMind?.getXmind?.();
      if (!parser?.parseXmindFile) {
        return Promise.reject(new Error('当前环境未启用 XMind 解析能力'));
      }
      return parser.parseXmindFile(file, false).then((data) => sanitizeMindData(data));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = sanitizeMindData(JSON.parse(reader.result));
          resolve(data);
        } catch (error) {
          reject(new Error('导入文件不是有效的 JSON'));
        }
      };
      reader.onerror = () => reject(new Error('读取导入文件失败'));
      reader.readAsText(file, 'utf-8');
    });
  };

  const applyImportedData = (data, titleOverride = null) => {
    setCaseDirty(true);
    setCurrentCase((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        title: titleOverride || prev.title,
        data,
      };
    });
    if (!mindRef.current) {
      return;
    }
    if (isFullMindData(data) || data.layout || data.theme) {
      mindRef.current.setFullData(data);
    } else {
      mindRef.current.setData(data);
    }
  };

  const getClipboardMindData = (event) => {
    const clipboard = event?.clipboardData;
    if (!clipboard) return null;
    const types = Array.from(clipboard.types || []);
    const jsonText = clipboard.getData('application/json') || '';
    const plainText = clipboard.getData('text/plain') || '';
    const htmlText = clipboard.getData('text/html') || '';
    const rtfText = clipboard.getData('text/rtf') || '';
    window.__ARGUS_XMIND_CLIPBOARD_DEBUG__ = {
      at: new Date().toISOString(),
      types,
      jsonPreview: String(jsonText || '').slice(0, 400),
      htmlPreview: String(htmlText || '').slice(0, 400),
      rtfPreview: String(rtfText || '').slice(0, 400),
      plainPreview: String(plainText || '').slice(0, 200),
    };
    const candidates = [jsonText, plainText, htmlText].filter(Boolean);
    for (const item of candidates) {
      const parsedJson = tryParseJsonString(item);
      const normalized = normalizeClipboardMindData(parsedJson);
      if (normalized) return normalized;
    }
    const htmlEmbedded = extractEmbeddedJsonBlocks(htmlText);
    for (const block of htmlEmbedded) {
      const parsedJson = tryParseJsonString(block);
      const normalized = normalizeClipboardMindData(parsedJson);
      if (normalized) return normalized;
    }
    const internalClipboardData = getInternalClipboardMindData();
    if (internalClipboardData) return internalClipboardData;
    const rtfData = parseRtfToMindData(rtfText);
    if (rtfData) return markClipboardSource(rtfData, rtfData.__clipboardSource || 'rtf');
    const htmlData = parseHtmlToMindData(htmlText);
    if (htmlData) {
      const source = Array.isArray(htmlData.children) && htmlData.children.length > 0 && htmlData.data?.text === '粘贴内容'
        ? 'html-wrapper'
        : 'html-node';
      return markClipboardSource(sanitizeMindData(htmlData), source);
    }
    const outlineData = parseOutlineTextToMindData(plainText);
    return outlineData ? markClipboardSource(sanitizeMindData(outlineData), 'outline') : null;
  };

  const getClipboardPasteNodes = (pastedData) => {
    if (!pastedData) return [];
    const root = getMindRootData(pastedData);
    const clipboardSource = pastedData?.__clipboardSource || '';
    if (!root) return [];
    if (clipboardSource === 'simpleMindMap' || clipboardSource === 'html-wrapper') {
      return Array.isArray(root.children) ? root.children.filter(Boolean) : [];
    }
    if (clipboardSource === 'xmind' || clipboardSource === 'html-node' || clipboardSource === 'outline' || clipboardSource === 'rtf') {
      return [root];
    }
    if (Array.isArray(root.children) && root.children.length > 0 && root.data?.text === '粘贴内容') {
      return root.children.filter(Boolean);
    }
    return [root];
  };

  const insertPastedDataAfterActiveNode = (pastedData) => {
    if (!mindRef.current || !currentCase) return false;
    const activeNode = getActiveNode();
    if (!activeNode) return false;
    const pasteNodes = getClipboardPasteNodes(pastedData);
    if (pasteNodes.length === 0) return false;
    mindRef.current.execCommand('PASTE_NODE', pasteNodes);
    const latestData = sanitizeMindData(getMindData() || currentCase.data || defaultCaseData(currentCase.title), currentCase.title);
    const latestStats = countMindData(getMindRootData(latestData));
    setCurrentCase((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        data: latestData,
        __nodeCount: latestStats.nodeCount,
        __wordCount: latestStats.wordCount,
      };
    });
    markCaseDirty();
    return true;
  };

  const importJson = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    const lowerName = (file.name || '').toLowerCase();
    const isAllowed = lowerName.endsWith('.json') || lowerName.endsWith('.xmind');
    if (!isAllowed) {
      message.warning('仅支持导入 .json 或 .xmind 文件');
      return;
    }
    Modal.confirm({
      title: '确认覆盖当前用例数据？',
      centered: true,
      content: '导入后将会覆盖当前在线编辑内容，且不可撤销。',
      okText: '是，覆盖导入',
      cancelText: '否，取消导入',
      onOk: async () => {
        try {
          const data = await parseImportFile(file);
          applyImportedData(data);
          message.success('导入成功，已覆盖当前用例数据');
        } catch (error) {
          message.error(error?.message || '导入失败，请检查文件格式');
        }
      },
      onCancel: () => {
        message.info('已取消导入');
      },
    });
  };

  const openModelGenerateModal = () => {
    if (!currentCase) return;
    if (skillAiModal.polling || skillAiModal.hasPendingResult) {
      setSkillAiModal((prev) => ({
        ...prev,
        open: true,
      }));
      return;
    }
    setSkillAiModal((prev) => ({
      ...prev,
      open: true,
      loading: false,
      polling: false,
      taskId: null,
      targetProjectId: projectId,
      targetCaseId: currentCase.id,
      targetCaseTitle: currentCase.title || '功能用例',
      stage: 'idle',
      stageText: '',
      errorMessage: '',
      reviewProvider: '',
      reviewRounds: 0,
      progress: 0,
      resultCaseCount: 0,
      aiModelId: skillAiModelOptions[0]?.value || '',
      elapsedText: '',
      requestStartedAt: 0,
      hasPendingResult: false,
      ruleDocIds: [],
      generateDocIds: [],
      generateInstructionText: DEFAULT_SKILL_AI_GENERATE_INSTRUCTION,
      reviewDocIds: [],
      reviewInstructionText: DEFAULT_SKILL_AI_REVIEW_INSTRUCTION,
      requirementItems: [createSkillRequirementItem()],
    }));
  };

  const resetModelGenerateModal = useCallback(() => {
    pendingModelGenerateResultRef.current = null;
    setSkillAiModal((prev) => ({
      ...prev,
      open: false,
      polling: false,
      taskId: null,
      targetProjectId: null,
      targetCaseId: null,
      targetCaseTitle: '',
      progress: 0,
      stage: 'idle',
      stageText: '',
      errorMessage: '',
      reviewProvider: '',
      reviewRounds: 0,
      resultCaseCount: 0,
      aiModelId: skillAiModelOptions[0]?.value || '',
      elapsedText: '',
      requestStartedAt: 0,
      hasPendingResult: false,
      ruleDocIds: [],
      generateDocIds: [],
      generateInstructionText: DEFAULT_SKILL_AI_GENERATE_INSTRUCTION,
      reviewDocIds: [],
      reviewInstructionText: DEFAULT_SKILL_AI_REVIEW_INSTRUCTION,
      requirementItems: [createSkillRequirementItem()],
    }));
  }, []);

  const closeModelGenerateModal = () => {
    if (skillAiModal.loading) return;
    Modal.confirm({
      title: skillAiModal.polling ? '确认停止模型生成任务？' : '确认取消当前操作？',
      content: skillAiModal.polling
        ? '停止后后台将不再继续生成，本次结果不会回填到画布。确认停止吗？'
        : '关闭后当前填写的需求、提示词和已选文档将被清空。确认继续吗？',
      okText: '确认',
      cancelText: '继续编辑',
      onOk: async () => {
        if (skillAiModal.polling) {
          try {
            if (skillAiModal.taskId) {
              await cancelFunctionalCaseGenerateTask({ id: skillAiModal.taskId });
              unregisterFunctionalCaseActiveTask(skillAiModal.taskId);
            }
          } catch (error) {
            message.error(error?.message || '停止生成任务失败');
            return;
          }
          setSkillAiModal((prev) => ({
            ...prev,
            open: false,
            loading: false,
            polling: false,
            taskId: null,
            progress: 100,
            stage: 'done',
            stageText: '任务已停止',
          }));
          message.info('模型生成任务已停止');
          return;
        }
        resetModelGenerateModal();
      },
    });
  };

  const skillTaskProgressItems = [
    { title: '任务创建' },
    { title: '组装需求和规则材料' },
    { title: '调用模型生成测试用例' },
    { title: '审查测试用例' },
    { title: '完成' },
  ];

  const resolveSkillTaskProgressIndex = () => {
    const stage = String(skillAiModal.stage || '').toLowerCase();
    const stageText = String(skillAiModal.stageText || '').toLowerCase();
    if (skillAiModal.errorMessage) {
      return 3;
    }
    if (stage === 'success' || stage === 'done' || stage.includes('done') || stageText.includes('完成') || stageText.includes('已生成')) {
      return 4;
    }
    if (stage.includes('review') || stageText.includes('审查')) {
      return 3;
    }
    if (stage.includes('generate') || stage.includes('model') || stage.includes('convert') || stage.includes('parse') || stageText.includes('调用') || stageText.includes('模型') || stageText.includes('生成测试用例')) {
      return 2;
    }
    if (stage.includes('prepare') || stageText.includes('组装') || stageText.includes('材料')) {
      return 1;
    }
    return 0;
  };

  const updateSkillRequirementItem = (itemKey, updater) => {
    setSkillAiModal((prev) => ({
      ...prev,
      requirementItems: prev.requirementItems.map((item) => (
        item.key === itemKey ? updater(item) : item
      )),
    }));
  };

  const addSkillRequirementItem = () => {
    setSkillAiModal((prev) => ({
      ...prev,
      requirementItems: [...prev.requirementItems, createSkillRequirementItem()],
    }));
  };

  const removeSkillRequirementItem = (itemKey) => {
    setSkillAiModal((prev) => {
      const nextItems = prev.requirementItems.filter((item) => item.key !== itemKey);
      return {
        ...prev,
        requirementItems: nextItems.length ? nextItems : [createSkillRequirementItem()],
      };
    });
  };

  const handleSkillItemUpload = (itemKey, file) => {
    if (!file?.type?.startsWith?.('image/')) {
      message.warning('仅支持上传图片格式的需求截图');
      return Upload.LIST_IGNORE;
    }
    updateSkillRequirementItem(itemKey, (item) => ({
      ...item,
      fileList: [...item.fileList, file].slice(-9),
    }));
    return false;
  };

  const removeSkillItemUpload = (itemKey, target) => {
    updateSkillRequirementItem(itemKey, (item) => ({
      ...item,
      fileList: item.fileList.filter((file) => file.uid !== target.uid),
    }));
  };

  const updateSkillRequirementLink = (itemKey, index, value) => {
    updateSkillRequirementItem(itemKey, (item) => ({
      ...item,
      designLinks: item.designLinks.map((link, linkIndex) => (
        linkIndex === index ? value : link
      )),
    }));
  };

  const addSkillRequirementLink = (itemKey) => {
    updateSkillRequirementItem(itemKey, (item) => ({
      ...item,
      designLinks: [...item.designLinks, ''],
    }));
  };

  const removeSkillRequirementLink = (itemKey, index) => {
    updateSkillRequirementItem(itemKey, (item) => {
      const nextLinks = item.designLinks.filter((_, linkIndex) => linkIndex !== index);
      return {
        ...item,
        designLinks: nextLinks.length ? nextLinks : [''],
      };
    });
  };

  const buildSkillRequirementItemsPayload = async () => {
    const normalizedItems = skillAiModal.requirementItems
      .map((item) => ({
        title: item.title.trim(),
        text: item.text.trim(),
        fileList: item.fileList || [],
        designLinks: (item.designLinks || []).map((link) => link.trim()).filter(Boolean),
      }))
      .filter((item) => item.title || item.text || item.fileList.length > 0 || item.designLinks.length > 0);

    return Promise.all(
      normalizedItems.map(async (item) => ({
        title: item.title,
        text: item.text,
        design_links: item.designLinks,
        images: await Promise.all(
          item.fileList.map((file) => readFileAsDataUrl(file.originFileObj || file)),
        ),
      })),
    );
  };

  const submitModelGenerate = async () => {
    if (!currentCase || !projectId) {
      message.warning('请先选择项目和功能用例');
      return;
    }
    const requestStartedAt = Date.now();
    const selectedAiModelId = String(skillAiModal.aiModelId || '').trim();
    if (!selectedAiModelId) {
      message.warning('请选择一个已启用模型');
      return;
    }
    const generateInstructionText = skillAiModal.generateInstructionText.trim();
    const reviewInstructionText = skillAiModal.reviewInstructionText.trim();
    const selectedDocCount = (
      (skillAiModal.ruleDocIds || []).length
      + (skillAiModal.generateDocIds || []).length
      + (skillAiModal.reviewDocIds || []).length
    );
    const targetProjectId = projectId;
        const targetCaseId = Number(currentCase.id || 0);
    const targetCaseTitle = currentCase.title || '功能用例';
    pendingModelGenerateResultRef.current = null;
    setSkillAiModal((prev) => ({
      ...prev,
      loading: true,
      elapsedText: '',
      requestStartedAt,
      targetProjectId,
      targetCaseId,
      targetCaseTitle,
    }));
    try {
      const requirementItems = await buildSkillRequirementItemsPayload();
      if (requirementItems.length === 0 && !generateInstructionText && !reviewInstructionText && selectedDocCount === 0) {
        throw new Error('请至少补充一组需求说明、需求图片、设计链接，或选择文档并填写简短生成说明');
      }

      const requirementText = requirementItems.map((item, index) => {
        const parts = [];
        if (item.title) parts.push(`标题：${item.title}`);
        if (item.text) parts.push(`说明：${item.text}`);
        if (item.design_links?.length) parts.push(`链接：${item.design_links.join('；')}`);
        if (item.images?.length) parts.push(`图片：${item.images.length}张`);
        return `需求组${index + 1}\n${parts.join('\n')}`;
      }).join('\n\n');

      const createRes = await generateFunctionalCaseByModel({
        project_id: projectId,
        case_file_id: targetCaseId,
        ai_model_id: selectedAiModelId,
        title: targetCaseTitle,
        requirement_text: requirementText,
        requirement_items: requirementItems,
        instruction_text: generateInstructionText,
        generate_instruction_text: generateInstructionText,
        review_instruction_text: reviewInstructionText,
        rule_doc_ids: skillAiModal.ruleDocIds,
        generate_doc_ids: skillAiModal.generateDocIds,
        review_doc_ids: skillAiModal.reviewDocIds,
      });
      if (createRes?.code !== 0) {
        throw new Error(createRes?.msg || '模型生成请求失败');
      }
      const responseData = createRes?.data || {};
      const generatedPayload = responseData?.result && typeof responseData.result === 'object' ? responseData.result : responseData;
      if (generatedPayload?.data && typeof generatedPayload.data === 'object') {
        const generatedTitle = generatedPayload.title || targetCaseTitle || '功能用例';
        const generatedData = sanitizeMindData(generatedPayload.data || defaultCaseData(generatedTitle), generatedTitle);
        const elapsedText = resolveSkillTaskElapsedText({
          taskLogs: responseData?.task_logs || generatedPayload?.task_logs,
          startedAt: generatedPayload.started_at || responseData?.started_at,
          finishedAt: generatedPayload.finished_at || responseData?.finished_at,
          fallbackStartedAt: requestStartedAt,
          fallbackFinishedAt: Date.now(),
        });
        pendingModelGenerateResultRef.current = {
          data: generatedData,
          title: generatedTitle,
          targetCaseId,
          caseCount: resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data),
          reviewProvider: generatedPayload.review_provider || '',
          reviewRounds: Number(generatedPayload.review_rounds || 0),
          elapsedText,
        };
        if (!isFunctionalCaseRouteActive) {
          queueGeneratedCaseResult({
            taskId: responseData?.task_id || responseData?.id,
            projectId: targetProjectId,
            targetCaseId,
            targetCaseTitle,
            title: generatedTitle,
            data: generatedData,
              caseCount: resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data),
            reviewProvider: generatedPayload.review_provider || '',
            reviewRounds: Number(generatedPayload.review_rounds || 0),
            elapsedText,
          });
          setSkillAiModal((prev) => ({
            ...prev,
            open: false,
            loading: false,
            polling: false,
            taskId: null,
            targetCaseId,
            targetCaseTitle,
            progress: 100,
            stage: 'done',
            stageText: appendElapsedToSkillText(
              `模型已生成 ${resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data)} 条候选用例，可点击通知中的“查看”前往结果页面`,
              elapsedText,
            ),
            errorMessage: '',
            reviewProvider: generatedPayload.review_provider || prev.reviewProvider || '',
            reviewRounds: Number(generatedPayload.review_rounds || prev.reviewRounds || 0),
            resultCaseCount: resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data),
            elapsedText: elapsedText || prev.elapsedText || '',
            hasPendingResult: true,
          }));
          return;
        }
        const matchesCurrentCase = currentCase && Number(currentCase.id) === Number(targetCaseId);
        if (matchesCurrentCase) {
          applyImportedData(generatedData, generatedTitle);
          pendingModelGenerateResultRef.current = null;
        }
        setSkillAiModal((prev) => ({
          ...prev,
          open: true,
          loading: false,
          polling: false,
          taskId: null,
          targetCaseId,
          targetCaseTitle,
          progress: 100,
          stage: 'done',
          stageText: matchesCurrentCase
            ? appendElapsedToSkillText(`模型已生成 ${resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data)} 条候选用例，当前画布已同步最新结果`, elapsedText)
            : appendElapsedToSkillText(`模型已生成 ${resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data)} 条候选用例，你已切换到其他用例，请切回“${targetCaseTitle}”后应用结果`, elapsedText),
          errorMessage: matchesCurrentCase ? '' : prev.errorMessage,
          reviewProvider: generatedPayload.review_provider || prev.reviewProvider || '',
          reviewRounds: Number(generatedPayload.review_rounds || prev.reviewRounds || 0),
          resultCaseCount: resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data),
          elapsedText: elapsedText || prev.elapsedText || '',
          hasPendingResult: !matchesCurrentCase,
        }));
        if (matchesCurrentCase) {
          message.success(appendElapsedToSkillText(`模型生成完成，识别到 ${resolveGeneratedCaseCount(generatedPayload, generatedPayload?.data)} 条候选用例，当前画布已更新`, elapsedText));
        }
        if (!matchesCurrentCase) {
          message.warning(appendElapsedToSkillText(`模型生成已完成，但当前不在原始用例“${targetCaseTitle}”上，结果尚未自动覆盖`, elapsedText));
        }
        return;
      }
      const taskId = responseData?.task_id || responseData?.id;
      if (!taskId) {
        throw new Error('未获取到模型生成结果');
      }
      registerFunctionalCaseActiveTask({
        taskId,
        projectId: targetProjectId,
        targetCaseId,
        targetCaseTitle,
        requestStartedAt,
        resultToken: buildFunctionalCaseResultToken(taskId, targetCaseId),
      });
      setSkillAiModal((prev) => ({
        ...prev,
        loading: false,
        polling: true,
        taskId,
        targetProjectId,
        targetCaseId,
        targetCaseTitle,
        progress: Number(responseData?.progress || 0),
        stage: responseData?.stage || 'queued',
        stageText: responseData?.stage_text || '请求已提交，正在调用模型生成测试用例',
        errorMessage: '',
        reviewProvider: '',
        reviewRounds: 0,
        resultCaseCount: 0,
        elapsedText: '',
        requestStartedAt,
        hasPendingResult: false,
      }));
      message.success('模型生成请求已提交，正在后台执行');
    } catch (error) {
      setSkillAiModal((prev) => ({ ...prev, loading: false }));
      message.error(error?.message || '模型生成失败');
    }
  };

  const updateScale = (nextScale) => {
    const safeScale = Math.min(200, Math.max(20, nextScale));
    setScale(safeScale);
    if (mindRef.current?.view?.setScale) {
      mindRef.current.view.setScale(safeScale / 100);
      requestAnimationFrame(syncScaleFromMind);
    }
  };

  const openUiDslDrawer = useCallback(async () => {
    const nodes = await openUiNodeDrawer();
    const targetNode = Array.isArray(nodes) ? nodes[0] : null;
    if (targetNode?.id) {
      await handlePreviewUiDsl(targetNode);
      return;
    }
    setUiDrawerActiveTab('dsl');
    setUiNodeDrawerOpen(true);
  }, [handlePreviewUiDsl, openUiNodeDrawer]);

  const openUiDebugDrawer = useCallback(async () => {
    const nodes = await openUiNodeDrawer();
    const targetNode = Array.isArray(nodes) ? nodes[0] : null;
    if (targetNode?.id) {
      setUiSelectedNode(targetNode);
      setUiDebugSelectedNodeIds([targetNode.id]);
    } else {
      setUiDebugSelectedNodeIds([]);
    }
    setUiDrawerActiveTab('debug');
    setUiNodeDrawerOpen(true);
  }, [openUiNodeDrawer]);

  const uiDebugRunColumns = useMemo(() => ([
    {
      title: '调试任务',
      dataIndex: 'id',
      width: 110,
      render: (value) => (
        <a onClick={() => fetchUiDebugDetail(value)}>{`Run #${value}`}</a>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      render: (value) => value || '-',
    },
  ]), [fetchUiDebugDetail]);

  const getUiDebugStepScreenshotArtifact = useCallback((record) => (
    record?.screenshot_artifact?.view_url
      ? record.screenshot_artifact
      : (Array.isArray(record?.artifacts)
        ? record.artifacts.find((item) => item?.preview_type === 'image' && item?.view_url)
        : null)
  ), []);

  const uiDebugStepColumns = useMemo(() => ([
    {
      title: '步骤',
      dataIndex: 'step_index',
      width: 70,
      render: (value) => value ?? '-',
    },
    {
      title: '名称',
      dataIndex: 'step_name',
      render: (_, record) => record?.step_name || record?.title || record?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value) => uiStatusTag(value),
    },
    {
      title: '截图',
      key: 'screenshot',
      width: 110,
      render: (_, record) => {
        const imageArtifact = getUiDebugStepScreenshotArtifact(record);
        if (!imageArtifact?.view_url) return '-';
        return (
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => setUiImagePreview({ open: true, title: imageArtifact.label || record?.title || '步骤截图', src: imageArtifact.view_url })}
          >
            查看
          </Button>
        );
      },
    },
  ]), [getUiDebugStepScreenshotArtifact]);

  const treeMenu = (node) => {
    if (uiOnly) {
      if (node.nodeType === 'case') {
        return (
          <Menu>
            <Menu.Item key="open" icon={<FileTextOutlined />} onClick={() => loadCase(node.raw)}>
              打开用例
            </Menu.Item>
            <Menu.Item key="edit-source" icon={<EditOutlined />} onClick={() => openFunctionalCaseEditor(node.id)}>
              去功能用例编辑
            </Menu.Item>
          </Menu>
        );
      }
      return (
        <Menu>
          <Menu.Item key="open-source" icon={<EditOutlined />} onClick={() => openFunctionalCaseEditor()}>
            去功能用例编辑
          </Menu.Item>
        </Menu>
      );
    }
    if (node.nodeType === 'case') {
      return (
        <Menu>
          <Menu.Item key="open" icon={<FileTextOutlined />} onClick={() => loadCase(node.raw)}>
            打开用例
          </Menu.Item>
          <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => openCaseModal(node.raw, node.directory_id)}>
            编辑名称
          </Menu.Item>
          <Menu.Item key="move" icon={<ExportOutlined />} onClick={() => openMoveModal('case', node.raw)}>
            移动/排序
          </Menu.Item>
          <Menu.Item
            key="delete-case"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除该用例吗？',
                okText: '删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: async () => {
                  await deleteCaseById(node.id);
                },
              });
            }}
          >
            删除用例
          </Menu.Item>
        </Menu>
      );
    }
    return (
      <Menu>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => openDirectoryModal(node)}>
          编辑目录
        </Menu.Item>
        <Menu.Item key="move" icon={<ExportOutlined />} onClick={() => openMoveModal('directory', node)}>
          移动/排序
        </Menu.Item>
        <Menu.Item
          key="delete-directory"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: '确认删除目录吗？',
              content: '会连同子目录和用例一起删除',
              okText: '删除',
              cancelText: '取消',
              okButtonProps: { danger: true },
              onOk: async () => {
                await handleDeleteDirectory(node.id);
              },
            });
          }}
        >
          删除目录
        </Menu.Item>
      </Menu>
    );
  };

  const titleRender = (node) => (
    (() => {
      const nodeText = getNodeText(node.title) || '未命名';
      const caseCount = toCountNumber(node.case_count);
      const passCount = toCountNumber(node.pass_count);
      const hoverTitle = uiOnly
        ? `${nodeText} UI用例数${caseCount}`
        : `${nodeText} 用例数${caseCount}/通过数${passCount}`;
      return (
    <div
      className={`functional-tree-title ${node.nodeType === 'case' ? 'functional-tree-case' : ''}`}
      onMouseEnter={() => setNodeKey(node.key)}
      onMouseLeave={() => setNodeKey(null)}
    >
      {node.nodeType === 'case' ? (
        <FileTextOutlined className="folder functional-case-folder" />
      ) : (
        <FolderCode theme="outline" size="15" className="folder" />
      )}
        <span className="functional-tree-content">
          <span className="functional-tree-name-line" title={hoverTitle}>
            <span className="functional-tree-text">{getNodeText(node.title)}</span>
            <span className="functional-tree-count">
              {uiOnly ? (
                <span className="functional-tree-count-total">{toCountNumber(node.case_count)}</span>
              ) : (
                <>
                  <span className="functional-tree-count-total">{toCountNumber(node.case_count)}</span>
                  <span className="functional-tree-count-sep">/</span>
                  <span className="functional-tree-count-pass">{toCountNumber(node.pass_count)}</span>
                </>
              )}
            </span>
          </span>
        </span>
      <span className={`suffixButton ${node.nodeType === 'directory' ? 'directory-actions' : 'case-actions'} ${nodeKey === node.key ? 'visible' : ''}`}>
        {!uiOnly && node.nodeType === 'directory' ? (
          <FolderAddOutlined
            className="icon-left"
            onClick={(event) => {
              event.stopPropagation();
              openDirectoryModal(null, node.id);
            }}
          />
        ) : null}
        {!uiOnly && node.nodeType === 'directory' ? (
          <FileAddOutlined
            className="icon-mid"
            onClick={(event) => {
              event.stopPropagation();
              openCaseModal(null, node.id);
            }}
          />
        ) : null}
        <Dropdown overlay={treeMenu(node)} trigger={['click']}>
          <MoreOutlined className="icon-right" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      </span>
    </div>
      );
    })()
  );

  const disabledDirectoryKeys = new Set(
    moveModal.type === 'directory' && moveModal.record
      ? [moveModal.record.id, ...getDescendantDirectoryIds(directoryTree, moveModal.record.id)]
      : [],
  );

  const renderSidePanel = () => {
    if (!currentCase) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择用例后编辑样式" />;
    }
    const isHugeCase = Number(currentCase?.__nodeCount || 0) >= HUGE_CASE_NODE_THRESHOLD;
    if (activePanel === 'icon') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">图标/贴纸</div>
          {ICON_GROUPS.map((group) => (
            <div className="functional-panel-group" key={group.label}>
              <div className="functional-field-label">{group.label}</div>
              <div className="functional-icon-grid side-panel">
                {group.items.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className="functional-icon-item"
                    onClick={() => applyNodeIcon(item.value)}
                    title={item.label}
                  >
                    {renderIconPreview(item)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button block onClick={() => execNodeCommand('SET_NODE_ICON', [])}>清除当前节点图标</Button>
        </div>
      );
    }
    if (activePanel === 'theme') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">主题</div>
          <div className="functional-theme-tab">
            {THEME_CATEGORY_TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={themeCategory === item.key ? 'active' : ''}
                onClick={() => setThemeCategory(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="functional-theme-grid">
            {filteredThemePresets.map((item) => (
              <button
                type="button"
                key={item.value}
                className={`functional-theme-card ${activeThemeValue === item.value ? 'active' : ''}`}
                onClick={() => applyTheme(item.value)}
              >
                <div
                  className="functional-theme-preview"
                  style={{
                    background: item.config.backgroundColor,
                    '--line-color': item.config.lineColor,
                    '--root-fill': item.config.root.fillColor,
                    '--second-fill': item.config.second.fillColor,
                    '--node-fill': item.config.node.fillColor,
                  }}
                >
                  <span className="theme-root" />
                  <span className="theme-second" />
                  <span className="theme-node top" />
                  <span className="theme-node bottom" />
                  <span className="theme-line" />
                  <span className="theme-branch top" />
                  <span className="theme-branch bottom" />
                </div>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (activePanel === 'structure') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">结构</div>
          {LAYOUT_GROUPS.map((group) => (
            <div className="functional-panel-group" key={group.title}>
              <div className="functional-field-label">{group.title}</div>
              <div className="functional-layout-grid">
                {group.items.map((item) => (
                  <button
                    type="button"
                    key={`${group.title}-${item.label}`}
                    className={`functional-layout-card ${activeLayoutValue === item.value ? 'active' : ''}`}
                    onClick={() => applyLayout(item.value)}
                  >
                    <span className={`functional-layout-preview ${item.preview || ''}`} />
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="functional-panel-group">
            <div className="functional-field-label">展开层级</div>
            <div className="functional-side-row">
              <Button onClick={() => execCommand('EXPAND_ALL')}>展开全部</Button>
              <Button onClick={() => execCommand('UNEXPAND_ALL')}>收起全部</Button>
            </div>
            <div className="functional-side-row">
              <Button onClick={() => execCommand('UNEXPAND_TO_LEVEL', 1)}>保留1级</Button>
              <Button onClick={() => execCommand('UNEXPAND_TO_LEVEL', 2)}>保留2级</Button>
              <Button onClick={() => execCommand('UNEXPAND_TO_LEVEL', 3)}>保留3级</Button>
            </div>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">当前节点</div>
            <div className="functional-side-row">
              <Button onClick={() => toggleActiveNodeExpand(true)}>展开当前</Button>
              <Button onClick={() => toggleActiveNodeExpand(false)}>收起当前</Button>
            </div>
            <Button block icon={<ReloadOutlined />} onClick={() => execCommand('RESET_LAYOUT')}>重排布局</Button>
            <Button block icon={<EnvironmentOutlined />} onClick={centerActiveNode}>当前节点居中</Button>
          </div>
        </div>
      );
    }
    if (activePanel === 'outline') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">大纲</div>
          <div className="functional-outline">
            {outline.map((item) => (
              <div key={item.key} style={{ paddingLeft: item.level * 12 }}>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activePanel === 'setting') {
      const effectiveHugeMode = hugeCaseModeOverride === null ? isHugeCase : Boolean(hugeCaseModeOverride);
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">设置</div>
          <div className="functional-check-list">
            <Checkbox onChange={(event) => updateMindConfig({ readonly: event.target.checked })}>只读模式</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ alwaysShowExpandBtn: event.target.checked })}>一直显示展开收起按钮</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ enableFreeDrag: event.target.checked })}>开启节点自由拖拽</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ isShowCreateChildBtnIcon: event.target.checked })}>显示快捷创建子节点按钮</Checkbox>
            <Checkbox onChange={(event) => updateMindConfig({ mousewheelAction: event.target.checked ? 'zoom' : 'move' })}>鼠标滚轮改为缩放</Checkbox>
            <Checkbox
              checked={effectiveHugeMode}
              onChange={(event) => setHugeCaseModeOverride(event.target.checked)}
            >
              启用超大用例编辑模式
            </Checkbox>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">超大用例模式</div>
            <div className="functional-stat-line">
              当前策略：{hugeCaseModeOverride === null ? `自动（节点数${HUGE_CASE_NODE_THRESHOLD}+启用）` : (effectiveHugeMode ? '手动开启' : '手动关闭')}
            </div>
            <div className="functional-stat-line">当前节点数：{Number(currentCase?.__nodeCount || 0)}</div>
            <Button onClick={() => setHugeCaseModeOverride(null)}>恢复自动策略</Button>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">统计</div>
            <div className="functional-stat-line">字数 {mindStats.wordCount}</div>
            <div className="functional-stat-line">节点 {mindStats.nodeCount}</div>
          </div>
        </div>
      );
    }
    if (activePanel === 'base') {
      return (
        <div className="functional-panel-section">
          <div className="functional-side-title">基础样式</div>
          <div className="functional-panel-group">
            <div className="functional-field-label">背景</div>
            {renderColorField('画布颜色', (color) => setThemeValue('backgroundColor', color))}
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">连线</div>
            {renderColorField('颜色', (color) => setThemeValue('lineColor', color))}
            <Select className="functional-side-control" placeholder="连线风格" onChange={(value) => setThemeValue('lineStyle', value)}>
              {LINE_STYLE_OPTIONS.map((item) => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
            {renderSliderField('粗细', 'themeLineWidth', (value) => setThemeValue('lineWidth', value), 1, 8)}
            <Checkbox onChange={(event) => setThemeValue('showLineMarker', event.target.checked)}>显示箭头</Checkbox>
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">概要的连线</div>
            {renderColorField('颜色', (color) => setThemeValue('generalizationLineColor', color))}
            {renderSliderField('粗细', 'generalizationLineWidth', (value) => setThemeValue('generalizationLineWidth', value), 1, 8)}
          </div>
          <div className="functional-panel-group">
            <div className="functional-field-label">关联线</div>
            {renderColorField('颜色', (color) => setThemeValue('associativeLineColor', color))}
            {renderSliderField('粗细', 'associativeLineWidth', (value) => setThemeValue('associativeLineWidth', value), 1, 8)}
          </div>
        </div>
      );
    }
    return (
      <div className="functional-panel-section">
        <div className="functional-side-title">节点样式</div>
        <div className="functional-panel-group">
          <div className="functional-field-label">文字</div>
          <Input
            className="functional-side-control"
            placeholder="输入节点文本后回车"
            onPressEnter={(event) => execNodeCommand('SET_NODE_TEXT', event.target.value)}
          />
          <div className="functional-side-row">
            <Select placeholder="字体" onChange={(value) => setNodeStyle('fontFamily', value)}>
              {FONT_FAMILY_OPTIONS.map((item) => (
                <Option key={item.value} value={item.value}>{item.label}</Option>
              ))}
            </Select>
            <Select placeholder="字号" onChange={(value) => setNodeStyle('fontSize', value)}>
              {FONT_SIZE_OPTIONS.map((item) => (
                <Option key={item} value={item}>{item}px</Option>
              ))}
            </Select>
          </div>
          <div className="functional-format-row">
            <Button onClick={() => setNodeStyle('color', '#1f2a44')}>A</Button>
            <Button onClick={() => toggleNodeStyle('fontWeight', 'bold', 'normal')}>B</Button>
            <Button onClick={() => toggleNodeStyle('fontStyle', 'italic', 'normal')}>I</Button>
            <Button onClick={() => toggleNodeStyle('textDecoration', 'underline', 'none')}>U</Button>
            <Button onClick={() => toggleNodeStyle('textDecoration', 'line-through', 'none')}>S</Button>
          </div>
          {renderColorField('文字颜色', (color) => setNodeStyle('color', color))}
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">边框</div>
          {renderColorField('颜色', (color) => setNodeStyle('borderColor', color))}
          {renderSliderField('宽度', 'borderWidth', (value) => setNodeStyle('borderWidth', value), 0, 8)}
          {renderSliderField('圆角', 'borderRadius', (value) => setNodeStyle('borderRadius', value), 0, 24)}
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">背景</div>
          {renderColorField('颜色', (color) => setNodeStyle('fillColor', color))}
          <div className="functional-side-row">
            <Button onClick={() => setNodeStyle('fillColor', 'transparent')}>透明</Button>
            <Button onClick={() => setNodeStyles({ fillColor: '#eef5ff', color: '#1f2a44' })}>浅蓝</Button>
          </div>
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">形状</div>
          <Select className="functional-side-control" placeholder="节点形状" onChange={(value) => execNodeCommand('SET_NODE_SHAPE', value)}>
            {SHAPE_OPTIONS.map((item) => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          {renderSliderField('水平内边距', 'paddingX', (value) => setNodeStyle('paddingX', value), 0, 40)}
          {renderSliderField('垂直内边距', 'paddingY', (value) => setNodeStyle('paddingY', value), 0, 24)}
        </div>
        <div className="functional-panel-group">
          <div className="functional-field-label">线条</div>
          {renderColorField('颜色', (color) => setNodeStyle('lineColor', color))}
          <Select className="functional-side-control" placeholder="线条样式" onChange={(value) => setNodeStyle('lineStyle', value)}>
            {LINE_STYLE_OPTIONS.map((item) => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
          {renderSliderField('粗细', 'lineWidth', (value) => setNodeStyle('lineWidth', value), 1, 8)}
        </div>
      </div>
    );
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className={`functional-case-page ${treeCollapsed ? 'tree-collapsed' : ''}`}>
        <Tooltip title={`展开${caseTreeLabel}`}>
          <Button
            className="functional-tree-restore"
            icon={<DoubleRightOutlined />}
            onClick={() => handleTreeCollapse(false)}
          />
        </Tooltip>
        <div className="functional-panel functional-tree-panel">
          <div className="functional-panel-header">
            <strong>{caseTreeLabel}</strong>
            <Tooltip title={`收起${caseTreeLabel}`}>
              <Button
                size="small"
                type="text"
                icon={<DoubleLeftOutlined />}
                onClick={() => handleTreeCollapse(true)}
              />
            </Tooltip>
          </div>
          <div className="functional-tree-toolbar">
            <div className="functional-project-switch">
              <Select
                className="functional-project-select"
                showSearch
                allowClear
                placeholder="请选择项目"
                value={projectId}
                onChange={(value) => {
                  if (value !== undefined) {
                    saveProject(value);
                  }
                  setCurrentDirectory(null);
                  setCurrentCase(null);
                  destroyMindMap();
                }}
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {projects.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="functional-tree-search">
              <Input
                size="small"
                className="treeSearch"
                placeholder="输入目录或用例名称"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={async () => {
                  if (!projectId) return;
                  setAppliedKeyword(searchText.trim());
                  await fetchTree(searchText.trim());
                }}
              />
              <Tooltip title="查询">
                <SearchOutlined
                  className="toolbar-button"
                  onClick={async () => {
                    if (!projectId) return;
                    setAppliedKeyword(searchText.trim());
                    await fetchTree(searchText.trim());
                  }}
                />
              </Tooltip>
              <Tooltip title="重置">
                <ReloadOutlined
                  className="toolbar-button"
                  onClick={async () => {
                    if (!projectId) return;
                    setSearchText('');
                    setAppliedKeyword('');
                    await fetchTree('');
                  }}
                />
              </Tooltip>
              <Tooltip title="点击可新建根目录，子目录需要在树上新建">
                {!uiOnly ? (
                  <PlusOutlined className="toolbar-button" onClick={() => projectId && openDirectoryModal()} />
                ) : null}
              </Tooltip>
            </div>
          </div>
          <div className="functional-panel-body">
            <Spin spinning={loadingTree}>
              {!projectId ? (
                <Empty description="请先选择项目" />
              ) : caseTree.length > 0 ? (
                <Tree
                  blockNode
                  treeData={caseTree}
                  selectedKeys={selectedKeys}
                  defaultExpandAll
                  titleRender={titleRender}
                  draggable={!uiOnly}
                  onDrop={uiOnly ? undefined : handleDrop}
                  onSelect={(_, { node }) => {
                    if (node.nodeType === 'case') {
                      setCurrentDirectory(node.directory_id);
                      loadCase(node.raw);
                      return;
                    }
                    setCurrentDirectory(node.id || null);
                    setCurrentCase(null);
                    destroyMindMap();
                  }}
                />
              ) : (
                <Empty description={`暂无${caseLabel}`} />
              )}
            </Spin>
          </div>
        </div>

        <div ref={editorPanelRef} className={`functional-panel functional-editor ${canvasFullscreen ? 'canvas-fullscreen' : ''}`}>
          <div className="functional-editor-stage">
            <div className="functional-editor-top">
              {uiOnly ? (
                <>
                  <div className="functional-ui-canvas-tools">
                    <Tooltip title="预览当前 UI 用例的 DSL 结构">
                      <Button className="functional-ui-tool-button" icon={<CodeOutlined />} disabled={!currentCase} onClick={openUiDslDrawer}>
                        DSL预览
                      </Button>
                    </Tooltip>
                    <Tooltip title="打开当前 UI 用例的调试台">
                      <Button className="functional-ui-tool-button" icon={<HistoryOutlined />} disabled={!currentCase} onClick={openUiDebugDrawer}>
                        调试台
                      </Button>
                    </Tooltip>
                  </div>
                </>
              ) : (
                <>
                <div className="functional-toolbar-group">
                  <Tooltip title="回退">
                    <Button icon={<span>↶</span>} disabled={!currentCase} onClick={() => execCommand('BACK')} />
                  </Tooltip>
                  <Tooltip title="前进">
                    <Button icon={<span>↷</span>} disabled={!currentCase} onClick={() => execCommand('FORWARD')} />
                  </Tooltip>
                  <Tooltip title={formatPainterActive ? '格式刷进行中，点击可取消' : '格式刷'}>
                    <Button
                      icon={<FormatPainterOutlined />}
                      className={formatPainterActive ? 'functional-toolbar-active' : ''}
                      disabled={!currentCase}
                      onClick={() => (formatPainterActive ? stopFormatPainter() : startFormatPainter())}
                    />
                  </Tooltip>
                  <Tooltip title="同级节点">
                    <Button icon={<FileAddOutlined />} disabled={!currentCase} onClick={() => execCommand('INSERT_NODE')} />
                  </Tooltip>
                  <Tooltip title="子节点">
                    <Button icon={<PlusOutlined />} disabled={!currentCase} onClick={() => execCommand('INSERT_CHILD_NODE')} />
                  </Tooltip>
                  <Tooltip title="父节点">
                    <Button icon={<DoubleLeftOutlined />} disabled={!currentCase} onClick={() => execCommand('INSERT_PARENT_NODE')} />
                  </Tooltip>
                  <Tooltip title="前插节点">
                    <Button icon={<span>↑</span>} disabled={!currentCase} onClick={() => insertSiblingNode('before')} />
                  </Tooltip>
                  <Tooltip title="后插节点">
                    <Button icon={<span>↓</span>} disabled={!currentCase} onClick={() => insertSiblingNode('after')} />
                  </Tooltip>
                  <Tooltip title="删除节点">
                    <Button icon={<DeleteOutlined />} disabled={!currentCase} onClick={() => execCommand('REMOVE_CURRENT_NODE')} />
                  </Tooltip>
                  <Tooltip title="图片">
                    <Button icon={<PictureOutlined />} disabled={!currentCase} onClick={openImage} />
                  </Tooltip>
                  <Tooltip title="图标">
                    <Button
                      icon={<SmileOutlined />}
                      disabled={!currentCase}
                      className={activePanel === 'icon' && panelOpen ? 'functional-toolbar-active' : ''}
                      onClick={() => {
                        setActivePanel('icon');
                        setPanelOpen(true);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="超链接">
                    <Button icon={<LinkOutlined />} disabled={!currentCase} onClick={openLink} />
                  </Tooltip>
                  <Tooltip title="备注">
                    <Button icon={<FileTextOutlined />} disabled={!currentCase} onClick={openNote} />
                  </Tooltip>
                  <Tooltip title="概要">
                    <Button icon={<AppstoreOutlined />} disabled={!currentCase} onClick={() => execCommand('ADD_GENERALIZATION')} />
                  </Tooltip>
                  <Tooltip title="删除概要">
                    <Button icon={<CloseCircleOutlined />} disabled={!currentCase} onClick={() => execCommand('REMOVE_GENERALIZATION')} />
                  </Tooltip>
                  <Tooltip title="公式">
                    <Button icon={<span>Σ</span>} disabled={!currentCase} onClick={openFormulaModal} />
                  </Tooltip>
                  <Tooltip title="附件">
                    <Button icon={<PaperClipOutlined />} disabled={!currentCase} onClick={openAttachment} />
                  </Tooltip>
                </div>

                <div className="functional-toolbar-group">
                  <Tooltip title="导入(JSON/XMind)">
                    <Button icon={<UploadOutlined />} disabled={!currentCase} onClick={triggerImport} />
                  </Tooltip>
                  <Tooltip title="导出">
                    <Button icon={<DownloadOutlined />} disabled={!currentCase} onClick={openExportModal} />
                  </Tooltip>
                  <Tooltip title="删除用例">
                    <Button danger icon={<DeleteOutlined />} disabled={!currentCase} onClick={confirmDeleteCurrentCase} />
                  </Tooltip>
                  <Tooltip title="AI 生成用例">
                    <Button
                      className="functional-ai-trigger"
                      icon={<span className="ai-icon-text">AI</span>}
                      disabled={!currentCase || !projectId}
                      onClick={openModelGenerateModal}
                    />
                  </Tooltip>
                  <Tooltip title="保存">
                    <Button
                      className={`functional-save-button ${caseDirty ? 'is-dirty' : ''}`}
                      icon={<SaveOutlined />}
                      loading={saving}
                      disabled={!currentCase}
                      onClick={saveMind}
                    />
                  </Tooltip>
                </div>
                </>
              )}
            </div>

            <div className={`functional-canvas-shell ${!uiOnly && panelOpen ? 'panel-open' : ''}`}>
              <div className="functional-canvas-area">
                <div className="functional-case-name">
                  <span className="functional-case-title">{currentCase?.title || caseCanvasLabel}</span>
                  {currentCase ? (
                    <span className="functional-case-meta">
                      {`创建人 ${currentCase.create_user_name || currentCase.creator_name || '-'} · 创建时间 ${formatTreeTime(currentCase.created_at) || '-'}`}
                    </span>
                  ) : null}
                </div>
                {currentCase ? (
                  <div ref={mindContainerRef} className="functional-mind" />
                ) : (
                  <div className="functional-empty">
                    <Empty description={emptyCanvasHint} />
                  </div>
                )}
                {loadingCase && currentCase ? (
                  <div className="functional-case-loading-mask">
                    <Spin size="large" tip="正在加载用例画布..." />
                  </div>
                ) : null}
                <div className="functional-bottom-bar">
                  <Button size="small" icon={<EnvironmentOutlined />} disabled={!currentCase} onClick={fitView} />
                  <Button
                    size="small"
                    icon={canvasFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    disabled={!currentCase}
                    onClick={toggleCanvasFullscreen}
                  />
                  <Button size="small" icon={<ZoomOutOutlined />} disabled={!currentCase} onClick={() => updateScale(scale - 10)} />
                  <span className="functional-scale">{scale} %</span>
                  <Button size="small" icon={<ZoomInOutlined />} disabled={!currentCase} onClick={() => updateScale(scale + 10)} />
                  <Button size="small" icon={<ReloadOutlined />} disabled={!currentCase} onClick={resetView} />
                </div>
                <div className="functional-status-bar">
                  字数 {mindStats.wordCount}
                  <span>节点 {mindStats.nodeCount}</span>
                </div>
              </div>

              {!uiOnly ? (
                <>
                  <Tooltip title="展开功能面板">
                    <button
                      type="button"
                      className="functional-drawer-trigger"
                      onClick={() => setPanelOpen(true)}
                    >
                      <LeftOutlined />
                    </button>
                  </Tooltip>
                  <div className="functional-right-tabs">
                    {SIDE_PANELS.map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        className={panelOpen && activePanel === item.key ? 'active' : ''}
                        onClick={() => {
                          if (activePanel === item.key) {
                            setPanelOpen((open) => !open);
                            return;
                          }
                          setActivePanel(item.key);
                          setPanelOpen(true);
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className={`functional-side-panel ${panelOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="functional-side-close"
                      onClick={() => setPanelOpen(false)}
                    >
                      ×
                    </button>
                    {renderSidePanel()}
                  </div>
                </>
              ) : null}
              {!uiOnly && mindContextMenu.open ? (
                <div
                  className="functional-mind-contextmenu"
                  style={{ left: mindContextMenu.x, top: mindContextMenu.y }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {mindContextMenu.type === 'node' ? (
                    <>
                      <button type="button" onClick={() => clearNodeIcons(mindContextMenu.node)}>移除节点图标</button>
                      <button type="button" onClick={() => toggleNodeExpand(true, mindContextMenu.node)}>展开子节点</button>
                      <button type="button" onClick={() => toggleNodeExpand(false, mindContextMenu.node)}>折叠子节点</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={clearAllNodeIcons}>移除所有节点图标</button>
                      <button type="button" onClick={expandAllNodes}>展开所有节点</button>
                      <button type="button" onClick={collapseAllNodes}>折叠所有节点</button>
                    </>
                  )}
                </div>
              ) : null}
              {!uiOnly && iconQuickMenu.open ? (
                <div
                  className="functional-icon-quick-menu"
                  style={{ left: iconQuickMenu.x, top: iconQuickMenu.y }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="functional-icon-quick-title">
                    {QUICK_ICON_TYPE_MAP[iconQuickMenu.type]?.label || '图标'}
                  </div>
                  <div className="functional-icon-grid quick-menu">
                    {(QUICK_ICON_TYPE_MAP[iconQuickMenu.type]?.items || []).map((item) => (
                      <button
                        type="button"
                        key={item.value}
                        className={`functional-icon-item ${iconQuickMenu.value === item.value ? 'active' : ''}`}
                        onClick={() => {
                          applyNodeIconByType(iconQuickMenu.node, iconQuickMenu.type, iconQuickMenu.value, item.value);
                          closeIconQuickMenu();
                        }}
                      >
                        {renderIconPreview(item)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="functional-icon-quick-remove"
                    onClick={() => {
                      applyNodeIconByType(iconQuickMenu.node, iconQuickMenu.type, iconQuickMenu.value, null);
                      closeIconQuickMenu();
                    }}
                  >
                    删除当前图标
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <input
        ref={importFileRef}
        type="file"
        accept="application/json,.json,application/vnd.xmind.workbook,.xmind"
        hidden
        onChange={importJson}
      />

      <Modal
        title={directoryModal.record ? '编辑目录' : '新增目录'}
        open={directoryModal.open}
        onOk={submitDirectory}
        onCancel={() => setDirectoryModal({ open: false, record: null, parent: null })}
      >
        <Input
          maxLength={18}
          showCount
          placeholder="请输入目录名称"
          value={directoryName}
          onChange={(e) => setDirectoryName(e.target.value)}
        />
      </Modal>

      <Modal
        title={caseModal.record ? '编辑功能用例' : '新增功能用例'}
        open={caseModal.open}
        onOk={submitCase}
        onCancel={() => setCaseModal({ open: false, record: null, directoryId: null })}
      >
        <Input
          maxLength={18}
          showCount
          placeholder="请输入功能用例名称"
          value={caseTitle}
          onChange={(e) => setCaseTitle(e.target.value)}
        />
      </Modal>

      <Modal
        title={moveModal.type === 'directory' ? '移动/排序目录' : '移动/排序用例'}
        open={moveModal.open}
        onOk={submitMove}
        onCancel={() => setMoveModal({ open: false, type: '', record: null })}
      >
        {moveModal.type === 'directory' ? (
          <TreeSelect
            style={{ width: '100%', marginBottom: 12 }}
            treeData={treeToSelectOptions(directoryTree, disabledDirectoryKeys)}
            value={moveParent}
            allowClear
            treeDefaultExpandAll
            placeholder="请选择父目录，不选即根目录"
            onChange={setMoveParent}
          />
        ) : (
          <TreeSelect
            style={{ width: '100%', marginBottom: 12 }}
            treeData={directoryOptions}
            value={moveDirectoryId}
            treeDefaultExpandAll
            placeholder="请选择目标目录"
            onChange={setMoveDirectoryId}
          />
        )}
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          value={moveSortIndex}
          placeholder="排序号，越小越靠前"
          onChange={(value) => setMoveSortIndex(value || 0)}
        />
      </Modal>

      <Modal
        title="设置超链接"
        open={linkModal.open}
        onOk={submitLink}
        onCancel={() => setLinkModal({ open: false })}
      >
        <Input style={{ marginBottom: 12 }} placeholder="链接标题" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
        <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
      </Modal>

      <Modal
        title="设置备注"
        open={noteModal.open}
        onOk={submitNote}
        onCancel={() => setNoteModal({ open: false })}
      >
        <Input.TextArea rows={5} placeholder="请输入节点备注" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
      </Modal>

      <Modal
        title="设置图片"
        open={imageModal.open}
        onOk={submitImage}
        onCancel={() => {
          setImageModal({ open: false });
        }}
      >
        <Input
          style={{ marginBottom: 12 }}
          placeholder="请输入图片 URL，留空可移除图片"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleNodeImageUpload}
          disabled={imageUploading}
        >
          <Button loading={imageUploading} icon={<UploadOutlined />}>上传本地图片</Button>
        </Upload>
        <Button style={{ marginLeft: 8 }} onClick={removeNodeImage} disabled={!imageUrl}>
          删除图片
        </Button>
        {imageUrl ? (
          <div style={{ marginTop: 12, border: '1px solid #f0f0f0', borderRadius: 8, padding: 8 }}>
            <img
              src={imageUrl}
              alt="节点图片预览"
              style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', cursor: 'zoom-in' }}
              onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        title="设置附件"
        open={attachmentModal.open}
        onOk={submitAttachment}
        onCancel={() => setAttachmentModal({ open: false })}
      >
        <Input style={{ marginBottom: 12 }} placeholder="附件名称" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} />
        <Input placeholder="附件 URL" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Upload
            showUploadList={false}
            beforeUpload={handleNodeAttachmentUpload}
            disabled={attachmentUploading}
          >
            <Button loading={attachmentUploading} icon={<UploadOutlined />}>上传本地附件</Button>
          </Upload>
          <Button onClick={removeNodeAttachment} disabled={!attachmentUrl && !attachmentName}>
            删除附件
          </Button>
        </div>
      </Modal>

      <Modal
        title="节点图片预览"
        open={nodeImagePreview.open}
        footer={null}
        width="72vw"
        onCancel={() => setNodeImagePreview({ open: false, url: '' })}
      >
        {nodeImagePreview.url ? (
          <img
            src={nodeImagePreview.url}
            alt="节点图片预览"
            style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }}
          />
        ) : null}
      </Modal>

      <Modal
        title="模型生成测试用例"
        open={skillAiModal.open}
        onCancel={closeModelGenerateModal}
        width={760}
        className="functional-ai-modal"
        footer={[
          <Button key="cancel" onClick={closeModelGenerateModal} disabled={skillAiModal.loading}>
            {skillAiModal.stage === 'done' ? '关闭' : '取消'}
          </Button>,
          skillAiModal.hasPendingResult ? (
            <Button
              key="apply"
              type="primary"
              onClick={applyPendingModelGenerateResult}
              disabled={!currentCase || Number(currentCase.id) !== Number(skillAiModal.targetCaseId)}
            >
              应用结果
            </Button>
          ) : null,
          <Button
            key="start"
            type="primary"
            onClick={submitModelGenerate}
            loading={skillAiModal.loading}
            disabled={skillAiModal.polling || skillAiModal.hasPendingResult}
          >
            {skillAiModal.stage === 'done' ? '重新生成' : '开始生成'}
          </Button>,
        ]}
      >
        <div className="functional-ai-modal-body">
          <div className="functional-ai-tip">
            先按需求组补充说明、截图和设计链接，再按用途选择规则文档、生成要求和审查要求。提交后会按结构化提示生成测试用例，并覆盖当前画布。
          </div>

          <div className="functional-ai-field">
            <div className="functional-ai-label">需求组</div>
            <div style={{ color: '#6b7280', marginBottom: 12 }}>
              每组都可以单独填写需求说明、上传截图、补充设计链接，模型会按组理解上下文，减少图文串位。
            </div>

            {skillAiModal.requirementItems.map((item, itemIndex) => (
              <div
                key={item.key}
                style={{
                  padding: 16,
                  marginBottom: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  background: '#fafbfc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{`需求组 ${itemIndex + 1}`}</div>
                  <Button
                    danger
                    type="text"
                    disabled={skillAiModal.polling}
                    onClick={() => removeSkillRequirementItem(item.key)}
                  >
                    删除
                  </Button>
                </div>

                <div className="functional-ai-field">
                  <div className="functional-ai-label">需求组标题</div>
                  <Input
                    placeholder="例如：新增数据源第二步 / 列表查询区 / 原型A审批流"
                    value={item.title}
                    disabled={skillAiModal.polling}
                    onChange={(event) => updateSkillRequirementItem(item.key, (current) => ({
                      ...current,
                      title: event.target.value,
                    }))}
                  />
                </div>

                <div className="functional-ai-field">
                  <div className="functional-ai-label">需求说明</div>
                  <Input.TextArea
                    rows={4}
                    placeholder="请输入这一组需求说明。可以只写文字、只传图片、只贴链接，也可以自由组合。"
                    value={item.text}
                    disabled={skillAiModal.polling}
                    onChange={(event) => updateSkillRequirementItem(item.key, (current) => ({
                      ...current,
                      text: event.target.value,
                    }))}
                  />
                </div>

                <div className="functional-ai-field">
                  <div className="functional-ai-label">关联需求图片</div>
                  <Upload
                    accept={AI_UPLOAD_ACCEPT}
                    listType="picture-card"
                    fileList={item.fileList}
                    beforeUpload={(file) => handleSkillItemUpload(item.key, file)}
                    onRemove={(file) => {
                      removeSkillItemUpload(item.key, file);
                      return false;
                    }}
                    multiple
                    disabled={skillAiModal.polling}
                  >
                    {item.fileList.length >= 9 ? null : (
                      <div className="functional-ai-upload-button">
                        <UploadOutlined />
                        <span>上传截图</span>
                      </div>
                    )}
                  </Upload>
                </div>

                <div className="functional-ai-field">
                  <div className="functional-ai-label">关联设计链接</div>
                  {(item.designLinks || ['']).map((link, linkIndex) => (
                    <div key={`${item.key}_link_${linkIndex}`} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <Input
                        placeholder={DESIGN_LINK_PLACEHOLDER}
                        value={link}
                        disabled={skillAiModal.polling}
                        onChange={(event) => updateSkillRequirementLink(item.key, linkIndex, event.target.value)}
                      />
                      <Button
                        danger
                        disabled={skillAiModal.polling}
                        onClick={() => removeSkillRequirementLink(item.key, linkIndex)}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button disabled={skillAiModal.polling} onClick={() => addSkillRequirementLink(item.key)}>
                    新增链接
                  </Button>
                </div>
              </div>
            ))}

            <Button type="dashed" block disabled={skillAiModal.polling} onClick={addSkillRequirementItem}>
              新增需求组
            </Button>
          </div>

          <div className="functional-ai-field">
            <div className="functional-ai-label">执行模型</div>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="选择用于生成功能用例的模型"
              options={skillAiModelOptions}
              value={skillAiModal.aiModelId || undefined}
              disabled={skillAiModal.polling}
              onChange={(value) => setSkillAiModal((prev) => ({ ...prev, aiModelId: value || '' }))}
            />
          </div>

          <div className="functional-ai-field">
            <div className="functional-ai-label">规则文档</div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="选择编写规范、模板约束、通用规则等文档"
              options={skillDocOptions}
              value={skillAiModal.ruleDocIds}
              loading={loadingSkillDocs}
              disabled={skillAiModal.polling}
              onChange={(value) => setSkillAiModal((prev) => ({ ...prev, ruleDocIds: value }))}
            />
          </div>

          <div
            className="functional-ai-field"
            style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafbfc' }}
          >
            <div className="functional-ai-label">生成要求</div>
            <div style={{ color: '#6b7280', marginBottom: 12 }}>
              这里放“怎么生成”。可以选模板、示例、生成规则，再补一句本轮最想强调的生成目标。
            </div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%', marginBottom: 12 }}
              placeholder="选择生成要求文档、模板示例、输出结构说明等"
              options={skillDocOptions}
              value={skillAiModal.generateDocIds}
              loading={loadingSkillDocs}
              disabled={skillAiModal.polling}
              onChange={(value) => setSkillAiModal((prev) => ({ ...prev, generateDocIds: value }))}
            />
            <Input.TextArea
              rows={3}
              placeholder="补一句本轮生成重点，例如：优先覆盖异常和边界；按前置条件/步骤/预期结果输出；语言简洁，可直接评审。"
              value={skillAiModal.generateInstructionText}
              disabled={skillAiModal.polling}
              onChange={(event) => setSkillAiModal((prev) => ({ ...prev, generateInstructionText: event.target.value }))}
            />
          </div>

          <div
            className="functional-ai-field"
            style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafbfc' }}
          >
            <div className="functional-ai-label">审查要求</div>
            <div style={{ color: '#6b7280', marginBottom: 12 }}>
              这里放“怎么审查”。可以选评审标准、检查清单，再补一句希望模型重点自检的内容。
            </div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%', marginBottom: 12 }}
              placeholder="选择审查要求文档、评审标准、检查清单等"
              options={skillDocOptions}
              value={skillAiModal.reviewDocIds}
              loading={loadingSkillDocs}
              disabled={skillAiModal.polling}
              onChange={(value) => setSkillAiModal((prev) => ({ ...prev, reviewDocIds: value }))}
            />
            <Input.TextArea
              rows={3}
              placeholder="补一句本轮审查重点，例如：检查命名统一性；预期结果是否可验证；是否遗漏异常流和边界场景。"
              value={skillAiModal.reviewInstructionText}
              disabled={skillAiModal.polling}
              onChange={(event) => setSkillAiModal((prev) => ({ ...prev, reviewInstructionText: event.target.value }))}
            />
          </div>

          {(skillAiModal.polling || skillAiModal.stageText || skillAiModal.errorMessage || skillAiModal.stage === 'done') ? (
            <div className="functional-ai-field">
              <div className="functional-ai-label">生成状态</div>
              <div style={{ padding: 12, background: '#f7f9fc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <Steps
                  current={resolveSkillTaskProgressIndex()}
                  size="small"
                  direction="vertical"
                  items={skillTaskProgressItems}
                />
                <div style={{ color: '#1f2937', marginTop: 10 }}>
                  {skillAiModal.stageText || (skillAiModal.stage === 'done' ? '本轮模型生成已完成。' : '等待执行')}
                </div>
                {skillAiModal.hasPendingResult && skillAiModal.targetCaseTitle ? (
                  <div style={{ color: '#b45309', marginTop: 4 }}>
                    {`当前结果属于“${skillAiModal.targetCaseTitle}”，请切回该用例后点击“应用结果”。`}
                  </div>
                ) : null}
                {skillAiModal.resultCaseCount ? (
                  <div style={{ color: '#6b7280', marginTop: 4 }}>
                    {`候选用例数：${skillAiModal.resultCaseCount}`}
                  </div>
                ) : null}
                {skillAiModal.elapsedText ? (
                  <div style={{ color: '#6b7280', marginTop: 4 }}>
                    {`生成耗时：${skillAiModal.elapsedText}`}
                  </div>
                ) : null}
                {skillAiModal.reviewProvider ? (
                  <div style={{ color: '#6b7280', marginTop: 4 }}>
                    {`审查模型：${skillAiModal.reviewProvider} · 审查轮次：${skillAiModal.reviewRounds || 0}`}
                  </div>
                ) : null}
                {skillAiModal.errorMessage ? (
                  <div style={{ color: '#dc2626', marginTop: 4 }}>{skillAiModal.errorMessage}</div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Drawer
        title={
          <Space>
            {uiDrawerActiveTab === 'debug' ? (
              <HistoryOutlined style={{ color: uiPalette.primary }} />
            ) : (
              <CodeOutlined style={{ color: uiPalette.primary }} />
            )}
            <span>{uiDrawerActiveTab === 'debug' ? '调试台' : 'DSL预览'}</span>
            <Tag style={{ margin: 0, borderRadius: 999, background: '#f8fafc' }}>
              {currentUiCaseMeta?.file_title || currentCase?.title || 'UI 用例'}
            </Tag>
          </Space>
        }
        open={uiNodeDrawerOpen}
        width={1480}
        destroyOnClose={false}
        onClose={() => {
          setUiNodeDrawerOpen(false);
          setUiDrawerActiveTab('dsl');
        }}
        styles={{
          body: {
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
          header: { borderBottom: `1px solid ${uiPalette.border}` },
        }}
      >
        {uiNodeDrawerLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin />
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="functional-ui-drawer functional-ui-drawer-single" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {uiDrawerActiveTab === 'debug' ? (
              <div className="functional-ui-dsl-layout functional-ui-debug-layout">
                {uiSelectedNode ? (
                  <Row gutter={16} className="functional-ui-dsl-row">
                    <Col xs={24} lg={10}>
                      <InsetCard
                        title={(
                          <Space size={8}>
                            <span>用例列表</span>
                            <Tag className="functional-ui-count-tag">{uiDrawerNodes.length}</Tag>
                          </Space>
                        )}
                        compact
                        icon={<HistoryOutlined />}
                        actions={
                          <Space>
                            <Button
                              size="small"
                              onClick={() => setUiDebugSelectedNodeIds(uiDrawerNodes.map((item) => item.id))}
                              disabled={uiDrawerNodes.length === 0}
                            >
                              全选
                            </Button>
                            <Button
                              size="small"
                              onClick={() => setUiDebugSelectedNodeIds([])}
                              disabled={uiDebugSelectedNodeIds.length === 0}
                            >
                              清空
                            </Button>
                            {uiCurrentRunningDebugRun ? (
                              <Popconfirm
                                title="确认停止该调试任务？"
                                okText="停止"
                                cancelText="取消"
                                onConfirm={() => handleStopUiDebugRun(uiCurrentRunningDebugRun.id)}
                              >
                                <PillButton
                                  size="small"
                                  danger
                                  icon={uiStopLoading[uiCurrentRunningDebugRun.id] ? <SyncOutlined spin /> : <StopOutlined />}
                                  loading={uiStopLoading[uiCurrentRunningDebugRun.id]}
                                >
                                  停止
                                </PillButton>
                              </Popconfirm>
                            ) : (
                              <PillButton
                                size="small"
                                icon={<PlayCircleOutlined />}
                                disabled={uiDebugSelectedNodes.length === 0}
                                loading={uiDebugSelectedNodes.some((item) => uiTrialLoading[item.id])}
                                onClick={() => handleOpenUiTrialModal(uiDebugSelectedNodes)}
                              >
                                运行选中
                              </PillButton>
                            )}
                          </Space>
                        }
                      >
                        <div className="functional-ui-debug-side">
                        <div className="functional-ui-case-tree-tools">
                          <Input
                            allowClear
                            size="small"
                            prefix={<SearchOutlined />}
                            value={uiNodeKeyword}
                            placeholder="搜索用例名称或节点路径"
                            onChange={(event) => setUiNodeKeyword(event.target.value)}
                          />
                        </div>
                        <div className="functional-ui-debug-case-list functional-ui-case-tree-wrap">
                          {uiDrawerTreeData.length > 0 ? (
                            <Tree
                              checkable
                              defaultExpandAll
                              className="functional-ui-case-tree"
                              treeData={uiDrawerTreeData}
                              selectedKeys={uiSelectedNode?.id ? [`case-${uiSelectedNode.id}`] : []}
                              checkedKeys={uiDebugSelectedNodeIds.map((id) => `case-${id}`)}
                              onSelect={(selectedKeys) => {
                                const node = uiDrawerNodeMap.get(selectedKeys?.[0]);
                                if (node) {
                                  setUiSelectedNode(node);
                                }
                              }}
                              onCheck={(checkedKeys) => {
                                const keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys?.checked || [];
                                setUiDebugSelectedNodeIds(
                                  keys
                                    .map((key) => String(key))
                                    .filter((key) => key.startsWith('case-'))
                                    .map((key) => Number(key.replace('case-', '')))
                                    .filter(Boolean),
                                );
                              }}
                            />
                          ) : (
                            <UiEmpty description="暂无匹配的 UI 自动化用例" />
                          )}
                        </div>
                        </div>
                        <div className="functional-ui-debug-record-head">
                          <Space>
                            <RefreshButton
                              size="small"
                              text="刷新"
                              onClick={() => fetchUiDebugRuns(uiSelectedNode)}
                              loading={uiDebugLoading}
                              disabled={!uiSelectedNode?.id}
                            />
                          </Space>
                        </div>
                        <Table
                          className="functional-ui-debug-run-table"
                          rowKey="id"
                          size="small"
                          loading={uiDebugLoading}
                          columns={uiDebugRunColumns}
                          dataSource={uiDebugRuns}
                          pagination={false}
                          scroll={{ y: 150 }}
                          locale={{ emptyText: <UiEmpty description="当前用例还没有调试记录" /> }}
                          style={{ marginTop: 8 }}
                        />
                      </InsetCard>
                    </Col>
                    <Col xs={24} lg={14}>
                      <div className="functional-ui-debug-result">
                      <InsetCard
                        title={uiDebugDetail ? `Run #${uiDebugDetail.id} 步骤结果` : '步骤结果'}
                        compact
                        icon={<EyeOutlined />}
                        actions={uiDebugDetail ? (
                          <Space>
                            {uiStatusTag(uiDebugDetail.status)}
                          </Space>
                        ) : null}
                      >
                        {uiDebugDetail ? (
                          <div className="functional-ui-debug-result-body">
                            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                              <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                                触发: {uiDebugDetail.trigger_mode || 'trial'}
                              </Tag>
                              <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                                步骤: {uiDebugDetail.steps?.length || 0}
                              </Tag>
                              <Tag style={{ borderRadius: 6, border: 'none', background: '#f1f5f9' }}>
                                开始: {uiDebugDetail.started_at || '-'}
                              </Tag>
                            </Space>
                            {uiDebugDetail.error_message ? (
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
                                {uiDebugDetail.error_message}
                              </div>
                            ) : null}
                            {uiDebugArtifactWarnings.length > 0 ? (
                              <Alert
                                type="warning"
                                showIcon
                                icon={<CloudDownloadOutlined />}
                                style={{ borderRadius: 8, marginBottom: 12 }}
                                message={`对象存储上传存在 ${uiDebugArtifactWarnings.length} 个告警`}
                              />
                            ) : null}
                            {uiDebugArtifacts.length > 0 ? (
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
                                  {uiDebugArtifacts.map((item) => (
                                    <PillButton
                                      key={item.object_key || item.name}
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
                            ) : null}
                            <Table
                              rowKey={(record) => record.id || record.step_index}
                              size="small"
                              loading={uiDebugDetailLoading}
                              columns={uiDebugStepColumns}
                              dataSource={uiDebugDetail.steps || []}
                              pagination={false}
                              onRow={(record) => ({
                                onClick: () => {
                                  const imageArtifact = getUiDebugStepScreenshotArtifact(record);
                                  if (!imageArtifact?.view_url) return;
                                  setUiImagePreview({
                                    open: true,
                                    title: imageArtifact.label || record?.step_name || record?.title || '步骤截图',
                                    src: imageArtifact.view_url,
                                  });
                                },
                                style: { cursor: getUiDebugStepScreenshotArtifact(record)?.view_url ? 'pointer' : 'default' },
                              })}
                              locale={{ emptyText: <UiEmpty description="Runner 尚未回传步骤结果" /> }}
                            />
                          </div>
                        ) : (
                          <div className="functional-ui-debug-result-body">
                            <UiEmpty description="选择一次调试任务查看步骤、截图和错误" />
                          </div>
                        )}
                      </InsetCard>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <UiEmpty description="选择一个节点，点击「调试台」开始调试" />
                )}
              </div>
            ) : (
              <div className="functional-ui-dsl-layout">
                {uiDslPreview ? (
                  <Row gutter={16} className="functional-ui-dsl-row">
                    <Col xs={24} xl={8}>
                      <div className="functional-ui-dsl-side">
                        <div className="functional-ui-dsl-info">
                          <div className="functional-ui-dsl-section-head">
                            <FileTextOutlined />
                            <span>用例信息</span>
                          </div>
                          <div className="functional-ui-dsl-info-body">
                            <div className="functional-ui-dsl-info-row">
                              <span>状态</span>
                              <strong>{uiStatusTag(uiDslPreview.status)}</strong>
                            </div>
                            <div className="functional-ui-dsl-info-row">
                              <span>节点路径</span>
                              <strong>{uiSelectedNode?.node_path || uiSelectedNode?.node_title || '-'}</strong>
                            </div>
                            <div className="functional-ui-dsl-info-row">
                              <span>模式</span>
                              <strong>{uiDslPreview.dsl?.mode || '-'}</strong>
                            </div>
                            <div className="functional-ui-dsl-info-row">
                              <span>浏览器</span>
                              <strong>{uiDslPreview.dsl?.browser || '-'}</strong>
                            </div>
                          </div>
                        </div>
                        <div className="functional-ui-dsl-list">
                          <div className="functional-ui-dsl-section-head">
                            <CodeOutlined />
                            <span>用例列表</span>
                            <Tag className="functional-ui-count-tag">{uiDrawerNodes.length}</Tag>
                          </div>
                          <div className="functional-ui-case-tree-tools">
                            <Input
                              allowClear
                              size="small"
                              prefix={<SearchOutlined />}
                              value={uiNodeKeyword}
                              placeholder="搜索用例名称或节点路径"
                              onChange={(event) => setUiNodeKeyword(event.target.value)}
                            />
                          </div>
                          <div className="functional-ui-dsl-list-body">
                            {uiDrawerTreeData.length > 0 ? (
                              <div className="functional-ui-case-tree-wrap">
                                <Tree
                                  defaultExpandAll
                                  className="functional-ui-case-tree"
                                  treeData={uiDrawerTreeData}
                                  selectedKeys={uiSelectedNode?.id ? [`case-${uiSelectedNode.id}`] : []}
                                  onSelect={(selectedKeys) => {
                                    const node = uiDrawerNodeMap.get(selectedKeys?.[0]);
                                    if (node) {
                                      handlePreviewUiDsl(node);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <UiEmpty description={uiNodeKeyword ? '暂无匹配的 UI 自动化用例' : '当前文件暂无 UI 用例节点'} />
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} xl={16}>
                      <div className="functional-ui-dsl-preview">
                        <InsetCard title="DSL 结构" compact icon={<CodeOutlined />}>
                          <DslCodeBlock data={uiDslPreview.dsl || uiDslPreview} style={{ height: '100%', maxHeight: 'none', minHeight: 0 }} />
                        </InsetCard>
                      </div>
                    </Col>
                  </Row>
                ) : (
                  <UiEmpty description="从用例列表中选择一个用例查看 DSL" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </Drawer>

      <Modal
        open={uiTrialModal.open}
        title="选择试运行环境"
        okText="开始调试"
        cancelText="取消"
        confirmLoading={(uiTrialModal.nodes || [uiTrialModal.node]).some((item) => uiTrialLoading[item?.id])}
        onCancel={() => {
          setUiTrialModal({ open: false, node: null, nodes: [], envId: undefined, addressId: undefined });
          setUiAddressOptions([]);
        }}
        onOk={() => {
          const trialNodes = uiTrialModal.nodes || (uiTrialModal.node ? [uiTrialModal.node] : []);
          if (trialNodes.length === 0) {
            message.warning('请选择要调试的用例');
            return;
          }
          if (!uiTrialModal.envId) {
            message.warning('请选择执行环境');
            return;
          }
          if (uiAddressOptions.length > 1 && !uiTrialModal.addressId) {
            message.warning('当前环境存在多个地址前缀，请先选择一个');
            return;
          }
          submitUiTrialRun({
            nodes: trialNodes,
            envId: uiTrialModal.envId,
            addressId: uiTrialModal.addressId,
          });
          setUiTrialModal({ open: false, node: null, nodes: [], envId: undefined, addressId: undefined });
          setUiAddressOptions([]);
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message={`本次将调试 ${(uiTrialModal.nodes || [uiTrialModal.node]).filter((item) => item?.id).length} 个 UI 自动化用例`}
          />
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>执行环境</div>
            <Select
              value={uiTrialModal.envId}
              style={{ width: '100%' }}
              placeholder="选择执行环境"
              options={uiEnvOptions.map((item) => ({ label: item.name, value: item.id }))}
              onChange={async (value) => {
                const list = await fetchUiAddresses(value);
                setUiTrialModal((prev) => ({
                  ...prev,
                  envId: value,
                  addressId: list.length === 1 ? list[0].id : undefined,
                }));
              }}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>地址前缀</div>
            <Select
              allowClear
              value={uiTrialModal.addressId}
              style={{ width: '100%' }}
              placeholder={uiTrialModal.envId ? '选择地址前缀（可选）' : '请先选择执行环境'}
              disabled={!uiTrialModal.envId}
              options={uiAddressOptions.map((item) => ({
                label: `${item.name} (${resolveUiAddressPreview(item) || item.gateway || '-'})`,
                value: item.id,
              }))}
              onChange={(value) => setUiTrialModal((prev) => ({ ...prev, addressId: value }))}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        open={uiImagePreview.open}
        title={uiImagePreview.title || '步骤截图'}
        footer={null}
        width={980}
        onCancel={() => setUiImagePreview({ open: false, title: '', src: '' })}
      >
        {uiImagePreview.src ? (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={uiImagePreview.src}
              alt={uiImagePreview.title || '步骤截图'}
              style={{ maxWidth: '100%', maxHeight: 640, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={exportModal.open}
        footer={null}
        centered
        width={800}
        className="functional-export-modal"
        onCancel={() => setExportModal((prev) => ({ ...prev, open: false }))}
      >
        <div className="functional-export-content">
          <div className="functional-export-types">
            {EXPORT_OPTIONS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={exportModal.type === item.key ? 'active' : ''}
                onClick={() => setExportModal((prev) => ({ ...prev, type: item.key }))}
              >
                <span className={`functional-export-type-icon ${item.key}`}>{item.icon}</span>
                <strong>{item.label}</strong>
                {exportModal.type === item.key ? <span className="functional-export-check">✓</span> : null}
              </button>
            ))}
          </div>
          <div className="functional-export-main">
            <div className="functional-export-header">
              <span>导出文件名称</span>
              <Input
                value={exportModal.name}
                onChange={(event) => setExportModal((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="请输入导出文件名称"
              />
            </div>
            <div className="functional-export-body">
              {(() => {
                const current = EXPORT_OPTIONS.find((item) => item.key === exportModal.type) || EXPORT_OPTIONS[0];
                return (
                  <>
                    <div className="functional-export-row">
                      <span>格式</span>
                      <strong>{current.format}</strong>
                    </div>
                    <div className="functional-export-row">
                      <span>说明</span>
                      <strong>{current.description}</strong>
                    </div>
                    <div className="functional-export-row">
                      <span>选项</span>
                      <strong>{current.option}</strong>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="functional-export-footer">
              <Button onClick={() => setExportModal((prev) => ({ ...prev, open: false }))}>取消</Button>
              <Button type="primary" onClick={submitExport}>导出</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="插入公式"
        open={formulaModal.open}
        onOk={submitFormula}
        onCancel={() => setFormulaModal({ open: false })}
      >
        <Input.TextArea rows={4} placeholder="请输入 LaTeX 公式，例如：E = mc^2" value={formulaText} onChange={(e) => setFormulaText(e.target.value)} />
      </Modal>
    </PageContainer>
  );
};

export default connect(({ project, gconfig }) => ({ project, gconfig }))(FunctionalCase);
