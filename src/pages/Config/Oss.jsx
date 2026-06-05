import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { PageContainer } from '@ant-design/pro-components';
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  List,
  message,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Tabs,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowUpOutlined,
  EyeOutlined,
  FileOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { deleteFile, detailFile, listFile, uploadFile } from '@/services/configure';
import auth from '@/utils/auth';
import CONFIG from '@/consts/config';
const MAX_UPLOAD_COUNT = 100;
const UPLOAD_BATCH_SIZE = 5;
const PREVIEW_MAX_ROWS = 100;
const PREVIEW_MAX_COLS = 20;
const PREVIEW_MAX_TEXT_LENGTH = 20000;
const TEXT_PREVIEW_SUFFIXES = new Set(['.txt', '.json', '.yaml', '.yml', '.log', '.xml', '.html', '.htm']);
const MARKDOWN_PREVIEW_SUFFIXES = new Set(['.md']);
const CSV_PREVIEW_SUFFIXES = new Set(['.csv']);
const EXCEL_PREVIEW_SUFFIXES = new Set(['.xlsx', '.xls']);
const DOC_PREVIEW_SUFFIXES = new Set(['.doc']);
const DOCX_PREVIEW_SUFFIXES = new Set(['.docx']);
const IMAGE_PREVIEW_SUFFIXES = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']);
const VIDEO_PREVIEW_SUFFIXES = new Set(['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi', '.mkv']);
const AUDIO_PREVIEW_SUFFIXES = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']);
const PDF_PREVIEW_SUFFIXES = new Set(['.pdf']);
const EMPTY_PREVIEW_STATE = {
  type: '',
  title: '',
  content: '',
  html: '',
  url: '',
  columns: [],
  rows: [],
  sheetName: '',
  truncated: false,
};

const joinPath = (...parts) => (
  parts
    .map((item) => String(item || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
);

const splitPath = (path = '') => String(path).split('/').filter(Boolean);

const previewTitle = (record) => record?.name || record?.file_path || '文件预览';

const getFileSuffix = (path = '') => {
  const value = String(path || '').trim();
  const index = value.lastIndexOf('.');
  return index >= 0 ? value.slice(index).toLowerCase() : '';
};

const isBlobUrl = (url = '') => String(url || '').startsWith('blob:');

const revokeObjectUrl = (url = '') => {
  if (isBlobUrl(url)) {
    window.URL.revokeObjectURL(url);
  }
};

const truncateText = (content, limit = PREVIEW_MAX_TEXT_LENGTH) => {
  const text = String(content || '');
  if (text.length <= limit) {
    return { content: text, truncated: false };
  }
  return {
    content: text.slice(0, limit),
    truncated: true,
  };
};

const sanitizeHtml = (html = '') => {
  if (typeof window === 'undefined' || !window.document) {
    return String(html || '');
  }
  const container = window.document.createElement('div');
  container.innerHTML = String(html || '');
  container.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
  container.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || '').trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        element.removeAttribute(attr.name);
      }
    });
  });
  return container.innerHTML;
};

const parseMarkdownPreview = (arrayBuffer) => {
  const textPreview = truncateText(decodeTextContent(arrayBuffer));
  return {
    ...textPreview,
    html: sanitizeHtml(marked.parse(textPreview.content || '')),
  };
};

const buildOfficePreviewUrl = (sourceUrl = '') => (
  sourceUrl ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(sourceUrl)}` : ''
);

const decodeTextContent = (arrayBuffer) => {
  const encodings = ['utf-8', 'utf-8-sig', 'gbk', 'gb18030', 'big5'];
  for (let index = 0; index < encodings.length; index += 1) {
    try {
      return new TextDecoder(encodings[index]).decode(arrayBuffer);
    } catch (error) {
      // try next encoding
    }
  }
  return new TextDecoder('utf-8').decode(arrayBuffer);
};

const detectCsvDelimiter = (text) => {
  const sample = String(text || '').split(/\r?\n/).slice(0, 5).join('\n');
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let score = -1;
  candidates.forEach((delimiter) => {
    const count = sample.split(delimiter).length - 1;
    if (count > score) {
      score = count;
      best = delimiter;
    }
  });
  return best;
};

const parseCsvRows = (text, delimiter = ',') => {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && char === delimiter) {
      row.push(value);
      value = '';
      continue;
    }
    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }
    value += char;
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
};

const buildTablePreview = (rows = [], sheetName = '') => {
  const normalized = [];
  let maxCols = 0;
  rows.slice(0, PREVIEW_MAX_ROWS + 1).forEach((row) => {
    const values = Array.isArray(row) ? row.slice(0, PREVIEW_MAX_COLS) : [row];
    maxCols = Math.max(maxCols, Math.min(values.length, PREVIEW_MAX_COLS));
    normalized.push(values.map((item) => (item == null ? '' : String(item))));
  });
  if (!normalized.length) {
    return {
      columns: [],
      rows: [],
      sheetName,
      truncated: false,
    };
  }
  const columnCount = Math.max(maxCols, 1);
  const headerRow = normalized[0];
  const columns = Array.from({ length: columnCount }).map((_, index) => ({
    title: headerRow[index] || `列${index + 1}`,
    dataIndex: `c${index}`,
    key: `c${index}`,
  }));
  const dataRows = normalized.slice(1, PREVIEW_MAX_ROWS + 1).map((row, rowIndex) => {
    const item = { key: String(rowIndex + 1) };
    for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
      item[`c${colIndex}`] = row[colIndex] || '';
    }
    return item;
  });
  return {
    columns,
    rows: dataRows,
    sheetName,
    truncated: rows.length > PREVIEW_MAX_ROWS + 1,
  };
};

const parseCsvPreview = (arrayBuffer) => {
  const text = decodeTextContent(arrayBuffer);
  return buildTablePreview(parseCsvRows(text, detectCsvDelimiter(text)));
};

const parseTextPreview = (arrayBuffer) => truncateText(decodeTextContent(arrayBuffer));

const parseDocxPreview = async (arrayBuffer) => {
  try {
    const mammothModule = await import('mammoth/mammoth.browser');
    const mammoth = mammothModule?.default?.extractRawText ? mammothModule.default : mammothModule;
    const result = await mammoth.extractRawText({ arrayBuffer });
    return truncateText(result?.value || '');
  } catch (error) {
    throw new Error('当前前端未集成 docx 预览依赖 mammoth');
  }
};

const parseExcelPreview = async (arrayBuffer) => {
  try {
    const xlsxModule = await import('xlsx');
    const XLSX = xlsxModule?.default?.read ? xlsxModule.default : xlsxModule;
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook?.SheetNames?.[0] || '';
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;
    const rows = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) : [];
    return buildTablePreview(rows, sheetName);
  } catch (error) {
    throw new Error('当前前端未集成表格预览依赖 xlsx');
  }
};

const formatFileSize = (size) => {
  const value = Number(size || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '-';
  }
  if (value < 1024) {
    return `${value} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let next = value / 1024;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }
  return `${next >= 100 ? next.toFixed(0) : next.toFixed(next >= 10 ? 1 : 2)} ${units[index]}`;
};

export default function Oss() {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewState, setPreviewState] = useState(EMPTY_PREVIEW_STATE);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailState, setDetailState] = useState(null);
  const [taskVisible, setTaskVisible] = useState(false);
  const [uploadTasks, setUploadTasks] = useState([]);
  const [uploadMode, setUploadMode] = useState('file');
  const [uploadSelection, setUploadSelection] = useState({
    count: 0,
    totalSize: 0,
    items: [],
  });
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const relativePathValue = Form.useWatch('relative_path', form);
  const uploadFilesRef = useRef([]);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const previewObjectUrlRef = useRef('');

  const getUploadRawFile = (item) => item?.originFileObj || item;
  const getUploadFileName = (item) => item?.name || item?.originFileObj?.name || '';
  const getUploadRelativePath = (item) => (
    String(item?.webkitRelativePath || item?.originFileObj?.webkitRelativePath || getUploadFileName(item) || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
  );
  const hasFolderRelativePath = (item) => getUploadRelativePath(item).includes('/');
  const buildDisplayUploadPath = (item, relativePath = '', forceFileName = false) => {
    const relative = getUploadRelativePath(item);
    if (!relative) {
      return '';
    }
    if (!forceFileName && !hasFolderRelativePath(item)) {
      return String(relativePath || '').trim() || getUploadFileName(item);
    }
    return hasFolderRelativePath(item)
      ? joinPath(relativePath, relative)
      : joinPath(relativePath, getUploadFileName(item));
  };

  const buildUploadEntries = (fileList = [], relativePath = '') => {
    const basePath = String(relativePath || '').trim();
    return fileList.map((item) => {
      const file = getUploadRawFile(item);
      const fileName = getUploadFileName(item);
      const displayPath = buildDisplayUploadPath(item, basePath);
      const filepath = (
        fileList.length === 1 && !hasFolderRelativePath(item)
          ? joinPath(currentPath, basePath || fileName)
          : joinPath(currentPath, displayPath)
      );
      return {
        file: item,
        filepath,
        displayPath: displayPath || fileName,
        fileSize: formatFileSize(file?.size),
      };
    }).filter((item) => item.filepath);
  };

  const buildSelectionPreviewPath = (item, relativePath = '') => {
    const basePath = String(relativePath || '').trim();
    const relative = String(item?.relativePath || '').trim();
    if (!relative) {
      return basePath || item?.name || '';
    }
    if (relative.includes('/')) {
      return joinPath(basePath, relative);
    }
    return basePath || item?.name || relative;
  };

  const syncUploadSelection = (fileList = []) => {
    const normalizedList = (Array.isArray(fileList) ? fileList : []).map((item, index) => {
      const rawFile = getUploadRawFile(item);
      if (item?.originFileObj) {
        return item;
      }
      return {
        uid: item?.uid || `${Date.now()}-${index}-${rawFile?.name || 'file'}`,
        name: item?.name || rawFile?.name || '',
        originFileObj: rawFile || item,
        status: 'done',
      };
    });
    const limitedFileList = normalizedList.slice(0, MAX_UPLOAD_COUNT);
    uploadFilesRef.current = limitedFileList;
    let totalSize = 0;
    const items = [];
    limitedFileList.forEach((item, index) => {
      const rawFile = getUploadRawFile(item);
      const size = Number(rawFile?.size || 0);
      if (Number.isFinite(size)) {
        totalSize += size;
      }
      items.push({
        uid: item?.uid || `${Date.now()}-${index}`,
        name: getUploadFileName(item),
        relativePath: getUploadRelativePath(item),
        size,
      });
    });
    setUploadSelection({
      count: limitedFileList.length,
      totalSize,
      items,
    });
  };

  const resetUploadPickers = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleNativeFileChange = (event) => {
    const nextFiles = Array.from(event?.target?.files || []);
    syncUploadSelection(nextFiles);
    if (event?.target) {
      event.target.value = '';
    }
  };

  const openNativePicker = () => {
    if (uploadMode === 'folder') {
      folderInputRef.current?.click();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const nextFiles = Array.from(event?.dataTransfer?.files || []);
    if (!nextFiles.length) {
      return;
    }
    syncUploadSelection(nextFiles);
  };

  const appendUploadTasks = (entries = []) => {
    const now = new Date().toLocaleString();
    const tasks = entries.map((entry, index) => ({
      id: `${Date.now()}-${index}-${entry.filepath}`,
      file_path: entry.filepath,
      file_size: entry.fileSize,
      status: 'uploading',
      message: '',
      created_at: now,
    }));
    setUploadTasks((prev) => [...tasks, ...prev]);
    return tasks;
  };

  const updateUploadTask = (taskId, status, msg = '') => {
    setUploadTasks((prev) => prev.map((item) => {
      if (item.id !== taskId) {
        return item;
      }
      return {
        ...item,
        status,
        message: status === 'failed' ? (msg || '上传失败') : '',
        finished_at: status === 'uploading' ? undefined : new Date().toLocaleString(),
      };
    }));
  };

  const removeUploadFile = (uid) => {
    syncUploadSelection(uploadFilesRef.current.filter((item) => item?.uid !== uid));
  };

  const clearUploadFiles = () => {
    syncUploadSelection([]);
    resetUploadPickers();
  };

  const uploadEntriesInParallel = async (entries = [], taskItems = []) => {
    let hasSuccess = false;
    for (let start = 0; start < entries.length; start += UPLOAD_BATCH_SIZE) {
      const batchEntries = entries.slice(start, start + UPLOAD_BATCH_SIZE);
      const batchTasks = taskItems.slice(start, start + UPLOAD_BATCH_SIZE);
      await Promise.all(batchEntries.map(async (entry, index) => {
        const task = batchTasks[index];
        try {
          const res = await uploadFile({
            filepath: entry.filepath,
            files: [entry.file],
          });
          if (auth.response(res, false)) {
            hasSuccess = true;
            updateUploadTask(task.id, 'success');
          } else {
            updateUploadTask(task.id, 'failed', res?.msg || '上传失败');
          }
        } catch (error) {
          updateUploadTask(task.id, 'failed', error?.message || '上传失败');
        }
      }));
    }
    return hasSuccess;
  };

  const groupedTasks = useMemo(() => ({
    all: uploadTasks,
    uploading: uploadTasks.filter((item) => item.status === 'uploading'),
    success: uploadTasks.filter((item) => item.status === 'success'),
    failed: uploadTasks.filter((item) => item.status === 'failed'),
  }), [uploadTasks]);

  const resetPreviewState = () => {
    revokeObjectUrl(previewObjectUrlRef.current);
    previewObjectUrlRef.current = '';
    setPreviewState({ ...EMPTY_PREVIEW_STATE });
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setPreviewLoading(false);
    resetPreviewState();
  };

  const downloadObject = async (record) => {
    const res = await fetch(`${CONFIG.URL}/oss/download?filepath=${encodeURIComponent(record.file_path)}`, {
      headers: auth.headers(false),
    });
    if (!res.ok) {
      message.error('下载文件失败');
      return;
    }
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = record?.name || record?.file_path?.split('/')?.pop() || 'download';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  };

  const loadItems = async (prefix = currentPath) => {
    setLoading(true);
    const res = await listFile({
      filepath: prefix,
      recursive: false,
    });
    setLoading(false);
    if (auth.response(res, false)) {
      setItems(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    loadItems('');
  }, []);

  useEffect(() => {
    loadItems(currentPath);
  }, [currentPath]);

  useEffect(() => () => {
    revokeObjectUrl(previewObjectUrlRef.current);
  }, []);

  const loadOfficePreview = async (record, title) => {
    const detailRes = await detailFile({ filepath: record.file_path });
    if (!auth.response(detailRes, false)) {
      throw new Error('获取 Office 预览链接失败');
    }
    const sourceUrl = detailRes?.data?.view_url || record?.view_url || '';
    const officeUrl = buildOfficePreviewUrl(sourceUrl);
    if (!officeUrl) {
      throw new Error('当前文件缺少可用的预览链接');
    }
    setPreviewState({
      ...EMPTY_PREVIEW_STATE,
      type: 'office',
      title,
      url: officeUrl,
    });
  };

  const dataSource = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return items;
    }
    return items.filter((item) => (
      String(item?.name || '').toLowerCase().includes(keyword)
      || String(item?.file_path || '').toLowerCase().includes(keyword)
    ));
  }, [items, search]);

  const breadcrumbItems = [
    {
      title: (
        <Space size={8}>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>Bucket</Tag>
          <a onClick={() => setCurrentPath('')}>
            <Typography.Text strong style={{ color: '#1677ff' }}>public</Typography.Text>
          </a>
        </Space>
      ),
    },
    ...splitPath(currentPath).map((segment, index, array) => ({
      title: (
        <a onClick={() => setCurrentPath(array.slice(0, index + 1).join('/'))}>
          <Typography.Text>{segment}</Typography.Text>
        </a>
      ),
    })),
  ];

  const openPreview = async (record) => {
    if (record?.is_dir) {
      setCurrentPath(record.file_path);
      return;
    }
    resetPreviewState();
    setPreviewVisible(true);
    setPreviewLoading(true);
    try {
      const title = previewTitle(record);
      const suffix = getFileSuffix(record?.file_path);
      if (DOC_PREVIEW_SUFFIXES.has(suffix)) {
        await loadOfficePreview(record, title);
        return;
      }
      const res = await fetch(`${CONFIG.URL}/oss/download?filepath=${encodeURIComponent(record.file_path)}`, {
        headers: auth.headers(false),
      });
      if (!res.ok) {
        throw new Error('获取预览文件失败');
      }
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const contentType = String(blob.type || record?.content_type || '').toLowerCase();

      if (IMAGE_PREVIEW_SUFFIXES.has(suffix) || contentType.startsWith('image/')) {
        const url = window.URL.createObjectURL(blob);
        previewObjectUrlRef.current = url;
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'image', title, url });
        return;
      }
      if (VIDEO_PREVIEW_SUFFIXES.has(suffix) || contentType.startsWith('video/')) {
        const url = window.URL.createObjectURL(blob);
        previewObjectUrlRef.current = url;
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'video', title, url });
        return;
      }
      if (AUDIO_PREVIEW_SUFFIXES.has(suffix) || contentType.startsWith('audio/')) {
        const url = window.URL.createObjectURL(blob);
        previewObjectUrlRef.current = url;
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'audio', title, url });
        return;
      }
      if (PDF_PREVIEW_SUFFIXES.has(suffix) || contentType.includes('pdf')) {
        const url = window.URL.createObjectURL(blob);
        previewObjectUrlRef.current = url;
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'pdf', title, url });
        return;
      }
      if (TEXT_PREVIEW_SUFFIXES.has(suffix)) {
        const textPreview = parseTextPreview(arrayBuffer);
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'text', title, ...textPreview });
        return;
      }
      if (MARKDOWN_PREVIEW_SUFFIXES.has(suffix)) {
        const markdownPreview = parseMarkdownPreview(arrayBuffer);
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'markdown', title, ...markdownPreview });
        return;
      }
      if (CSV_PREVIEW_SUFFIXES.has(suffix)) {
        const tablePreview = parseCsvPreview(arrayBuffer);
        setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'table', title, ...tablePreview });
        return;
      }
      if (EXCEL_PREVIEW_SUFFIXES.has(suffix)) {
        try {
          const tablePreview = await parseExcelPreview(arrayBuffer);
          setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'table', title, ...tablePreview });
        } catch (error) {
          await loadOfficePreview(record, title);
        }
        return;
      }
      if (DOCX_PREVIEW_SUFFIXES.has(suffix)) {
        try {
          const textPreview = await parseDocxPreview(arrayBuffer);
          setPreviewState({ ...EMPTY_PREVIEW_STATE, type: 'text', title, ...textPreview });
        } catch (error) {
          await loadOfficePreview(record, title);
        }
        return;
      }
      throw new Error('暂不支持该文件的在线预览');
    } catch (error) {
      const messageText = error?.message || '预览失败';
      message.warning(messageText);
      closePreview();
      return;
    } finally {
      setPreviewLoading(false);
    }
  };

  const openDetail = async (record) => {
    if (record?.is_dir) {
      setCurrentPath(record.file_path);
      return;
    }
    setDetailVisible(true);
    setDetailLoading(true);
    const res = await detailFile({ filepath: record.file_path });
    setDetailLoading(false);
    if (auth.response(res, false)) {
      setDetailState({
        ...record,
        ...(res.data || {}),
      });
      return;
    }
    setDetailVisible(false);
  };

  const onDelete = async (record) => {
    Modal.confirm({
      title: record?.is_dir ? '确认删除目录' : '确认删除对象',
      content: `删除后无法恢复：${record.file_path}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const res = await deleteFile({ filepath: record.file_path, is_dir: !!record?.is_dir });
        if (auth.response(res, true)) {
          await loadItems(currentPath);
        }
      },
    });
  };

  const onUpload = async () => {
    const values = await form.validateFields();
    const relativePath = String(values.relative_path || '').trim();
    const fileList = Array.isArray(uploadFilesRef.current) ? uploadFilesRef.current : [];
    if (fileList.length === 0) {
      message.error('请选择上传对象');
      return;
    }
    if (fileList.length > MAX_UPLOAD_COUNT) {
      message.error(`单次最多上传${MAX_UPLOAD_COUNT}个对象`);
      return;
    }
    const entries = buildUploadEntries(fileList, relativePath);
    if (entries.length === 0) {
      message.error('请选择有效的上传对象');
      return;
    }
    const taskItems = appendUploadTasks(entries);
    setTaskVisible(true);
    setUploadSubmitting(true);
    try {
      const hasSuccess = await uploadEntriesInParallel(entries, taskItems);
      if (hasSuccess) {
        await loadItems(currentPath);
      }
      setUploadVisible(false);
      form.resetFields();
      clearUploadFiles();
    } finally {
      setUploadSubmitting(false);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          {record?.is_dir ? <FolderOpenOutlined style={{ color: '#1677ff' }} /> : <FileOutlined style={{ color: '#64748b' }} />}
          {record?.is_dir ? (
            <a onClick={() => setCurrentPath(record.file_path)}>{record.name || record.file_path}</a>
          ) : (
            <a onClick={() => openDetail(record)}>{record.name || record.file_path}</a>
          )}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'is_dir',
      width: 100,
      render: (value) => value ? <Tag color="blue">目录</Tag> : <Tag>文件</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      width: 120,
      render: (value, record) => (record?.is_dir ? '-' : (value || '-')),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      render: (value) => value || '-',
    },
    {
      title: '更新人',
      dataIndex: 'update_user_name',
      width: 140,
      render: (value) => value || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="middle" wrap={false} style={{ whiteSpace: 'nowrap' }}>
          {record?.is_dir ? (
            <a onClick={() => onDelete(record)} style={{ color: '#ff4d4f' }}>
              <DeleteOutlined /> 删除
            </a>
          ) : (
            <>
              <a onClick={() => openPreview(record)}><EyeOutlined /> 预览</a>
              <a onClick={() => downloadObject(record)}>
                <DownloadOutlined /> 下载
              </a>
            </>
          )}
          {!record?.is_dir ? (
            <a onClick={() => onDelete(record)} style={{ color: '#ff4d4f' }}>
              <DeleteOutlined /> 删除
            </a>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false} breadcrumb={null}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col flex="auto">
              <Breadcrumb items={breadcrumbItems} />
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ArrowUpOutlined />}
                  disabled={!currentPath}
                  onClick={() => setCurrentPath(splitPath(currentPath).slice(0, -1).join('/'))}
                >
                  上级目录
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => loadItems(currentPath)}>
                  刷新
                </Button>
                <span style={{ display: 'inline-block', marginRight: 12 }}>
                  <Badge count={groupedTasks.uploading.length} size="small" offset={[-2, 6]}>
                    <Button onClick={() => setTaskVisible(true)}>
                      任务管理
                    </Button>
                  </Badge>
                </span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadVisible(true)}>
                  上传对象
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="按名称或路径过滤当前目录内容"
              />
            </Col>
          </Row>

          <Table
            rowKey={(record) => record.file_path}
            loading={loading}
            dataSource={dataSource}
            columns={columns}
            pagination={{
              defaultPageSize: 100,
              showSizeChanger: true,
              pageSizeOptions: [20, 50, 100, 200, 500],
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Space>
      </Card>

      <Modal
        title="上传对象到 public bucket"
        open={uploadVisible}
        onCancel={() => {
          if (!uploadSubmitting) {
            setUploadVisible(false);
          }
        }}
        onOk={onUpload}
        okText={uploadSubmitting ? '上传中...' : '开始上传'}
        okButtonProps={{ loading: uploadSubmitting }}
        cancelButtonProps={{ disabled: uploadSubmitting }}
        width={760}
        destroyOnClose
      >
        <Spin spinning={uploadSubmitting} tip="上传中">
          <Form form={form} layout="vertical">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleNativeFileChange}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            webkitdirectory=""
            directory=""
            onChange={handleNativeFileChange}
          />
          <Form.Item label="当前目录">
            <Input value={currentPath || '/'} disabled />
          </Form.Item>
          <Form.Item
            label="目标相对路径"
            name="relative_path"
            extra="单文件时可直接填写子目录/文件名；文件夹上传时这里会作为统一前缀追加到文件夹相对路径前"
          >
            <Input placeholder="留空则使用原文件名上传到当前目录" />
          </Form.Item>
          <Form.Item label="上传方式">
            <Segmented
              value={uploadMode}
              onChange={setUploadMode}
              options={[
                { label: '文件', value: 'file' },
                { label: '文件夹', value: 'folder' },
              ]}
            />
          </Form.Item>
          <Form.Item label="对象" required extra={`支持文件和整个文件夹上传，单次最多${MAX_UPLOAD_COUNT}个对象`}>
            <div
              role="button"
              tabIndex={0}
              onClick={openNativePicker}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openNativePicker();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!dragActive) {
                  setDragActive(true);
                }
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const nextTarget = event.relatedTarget;
                if (!event.currentTarget.contains(nextTarget)) {
                  setDragActive(false);
                }
              }}
              onDrop={handleDrop}
              style={{
                border: `1px dashed ${dragActive ? '#1677ff' : '#d9d9d9'}`,
                borderRadius: 8,
                background: dragActive ? '#f0f7ff' : '#fafafa',
                padding: '36px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <p className="ant-upload-drag-icon" style={{ marginBottom: 12 }}>
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">拖拽或点击选择文件 / 文件夹</p>
              <Typography.Text type="secondary">文件夹上传会保留相对目录结构</Typography.Text>
            </div>
            {uploadSelection.count ? (
              <div style={{ marginTop: 12, border: '1px solid #f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 12px',
                    background: '#fafafa',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <Space size={12} wrap>
                    <Typography.Text strong>已选 {uploadSelection.count} 个对象</Typography.Text>
                    <Typography.Text type="secondary">
                      总大小 {uploadSelection.totalSize > 0 ? formatFileSize(uploadSelection.totalSize) : '-'}
                    </Typography.Text>
                  </Space>
                  <a onClick={clearUploadFiles}>清空</a>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'scroll' }}>
                  {uploadSelection.items.map((item) => (
                    <div
                      key={item.uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '8px 12px',
                        borderBottom: '1px solid #f8fafc',
                      }}
                    >
                      <Space size={8} style={{ minWidth: 0, flex: 1 }}>
                        <FileOutlined style={{ color: '#64748b' }} />
                        <Typography.Text
                          style={{ minWidth: 0 }}
                          ellipsis={{ tooltip: buildSelectionPreviewPath(item, relativePathValue) }}
                        >
                          {buildSelectionPreviewPath(item, relativePathValue)}
                        </Typography.Text>
                      </Space>
                      <Space size={12}>
                        <Typography.Text type="secondary">{formatFileSize(item.size)}</Typography.Text>
                        <a onClick={() => removeUploadFile(item.uid)}>删除</a>
                      </Space>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={previewState.title}
        open={previewVisible}
        onCancel={closePreview}
        footer={null}
        width={previewState.type === 'image' ? 880 : 1080}
      >
        {previewLoading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#64748b' }}>预览加载中...</div>
        ) : previewState.type === 'image' ? (
          <Image src={previewState.url} alt={previewState.title} style={{ width: '100%' }} />
        ) : previewState.type === 'video' ? (
          <video
            src={previewState.url}
            controls
            style={{ width: '100%', maxHeight: '78vh', borderRadius: 8, background: '#fff' }}
          />
        ) : previewState.type === 'audio' ? (
          <div style={{ padding: '32px 12px', background: '#fff', borderRadius: 8 }}>
            <audio src={previewState.url} controls style={{ width: '100%' }} />
          </div>
        ) : previewState.type === 'pdf' ? (
          <iframe
            title={previewState.title}
            src={previewState.url}
            style={{ width: '100%', height: '78vh', border: 0, borderRadius: 8, background: '#fff' }}
          />
        ) : previewState.type === 'office' ? (
          <iframe
            title={previewState.title}
            src={previewState.url}
            style={{ width: '100%', height: '78vh', border: 0, borderRadius: 8, background: '#fff' }}
          />
        ) : previewState.type === 'table' ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {previewState.sheetName ? (
              <Typography.Text type="secondary">工作表：{previewState.sheetName}</Typography.Text>
            ) : null}
            <Table
              rowKey="key"
              size="small"
              pagination={false}
              scroll={{ x: true, y: 560 }}
              columns={previewState.columns}
              dataSource={previewState.rows}
            />
            {previewState.truncated ? (
              <Typography.Text type="secondary">仅展示前 100 行内容</Typography.Text>
            ) : null}
          </Space>
        ) : previewState.type === 'markdown' ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div
              style={{
                maxHeight: '70vh',
                overflow: 'auto',
                padding: 16,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#0f172a',
              }}
              dangerouslySetInnerHTML={{ __html: previewState.html || '' }}
            />
            {previewState.truncated ? (
              <Typography.Text type="secondary">内容过长，仅展示前 20000 个字符</Typography.Text>
            ) : null}
          </Space>
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <pre
              style={{
                maxHeight: '70vh',
                overflow: 'auto',
                margin: 0,
                padding: 12,
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {previewState.content}
            </pre>
            {previewState.truncated ? (
              <Typography.Text type="secondary">内容过长，仅展示前 20000 个字符</Typography.Text>
            ) : null}
          </Space>
        )}
      </Modal>

      <Drawer
        title={detailState?.name || detailState?.file_path || '对象详情'}
        open={detailVisible}
        onClose={() => {
          setDetailVisible(false);
          setDetailState(null);
        }}
        width={520}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Descriptions
            column={1}
            size="small"
            colon
            labelStyle={{ width: 96, color: '#64748b' }}
            contentStyle={{ color: '#0f172a' }}
          >
            <Descriptions.Item label="Bucket">{detailState?.bucket || 'public'}</Descriptions.Item>
            <Descriptions.Item label="对象名">{detailState?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="对象路径">{detailState?.file_path || '-'}</Descriptions.Item>
            <Descriptions.Item label="大小">{detailState?.file_size || '-'}</Descriptions.Item>
            <Descriptions.Item label="更新人">{detailState?.update_user_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="本地记录时间">{detailState?.local_updated_at || detailState?.updated_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="类型">{detailState?.content_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="ETag">{detailState?.etag || '-'}</Descriptions.Item>
            <Descriptions.Item label="存储类型">{detailState?.storage_class || '-'}</Descriptions.Item>
            <Descriptions.Item label="最后修改">{detailState?.last_modified || detailState?.updated_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="缓存策略">{detailState?.cache_control || '-'}</Descriptions.Item>
            <Descriptions.Item label="内容编码">{detailState?.content_encoding || '-'}</Descriptions.Item>
            <Descriptions.Item label="下载文件名">{detailState?.content_disposition || '-'}</Descriptions.Item>
            <Descriptions.Item label="下载URL">
              {detailState?.file_path ? (
                <a
                  href={`${CONFIG.URL}/oss/download?filepath=${encodeURIComponent(detailState.file_path)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`${CONFIG.URL}/oss/download?filepath=${encodeURIComponent(detailState.file_path)}`}
                </a>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="过期时间">{detailState?.expires || '-'}</Descriptions.Item>
            <Descriptions.Item label="版本号">{detailState?.version_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="Accept-Ranges">{detailState?.accept_ranges || '-'}</Descriptions.Item>
          </Descriptions>

          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text type="secondary">用户元数据</Typography.Text>
            <pre
              style={{
                maxHeight: 220,
                overflow: 'auto',
                margin: 0,
                padding: 12,
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(detailState?.metadata || {}, null, 2)}
            </pre>
          </Space>

          {!detailLoading && detailState ? (
            <Space wrap>
              <Button type="primary" onClick={() => downloadObject(detailState)}>
                下载对象
              </Button>
              {detailState?.view_url ? (
                <Button
                  href={detailState.view_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  临时访问链接
                </Button>
              ) : null}
            </Space>
          ) : null}
        </Space>
      </Drawer>

      <Drawer
        title="上传任务"
        open={taskVisible}
        onClose={() => setTaskVisible(false)}
        width={680}
      >
        <Tabs
          items={[
            { key: 'all', label: `全部 (${groupedTasks.all.length})` },
            { key: 'uploading', label: `进行中 (${groupedTasks.uploading.length})` },
            { key: 'success', label: `成功 (${groupedTasks.success.length})` },
            { key: 'failed', label: `失败 (${groupedTasks.failed.length})` },
          ].map((tab) => ({
            ...tab,
            children: (
              <List
                dataSource={groupedTasks[tab.key] || []}
                locale={{ emptyText: '暂无任务' }}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <Typography.Text ellipsis={{ tooltip: item.file_path }} style={{ flex: 1, minWidth: 0 }}>
                        {item.file_path}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {item.file_size || '-'}
                      </Typography.Text>
                      {item.message ? (
                        <Typography.Text type="danger" ellipsis={{ tooltip: item.message }} style={{ maxWidth: 220 }}>
                          {item.message}
                        </Typography.Text>
                      ) : null}
                      <Tag color={
                        item.status === 'success'
                          ? 'success'
                          : item.status === 'failed'
                            ? 'error'
                            : 'processing'
                      }
                      >
                        {item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '进行中'}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            ),
          }))}
        />
      </Drawer>
    </PageContainer>
  );
}
