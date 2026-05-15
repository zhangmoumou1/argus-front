import React, {useEffect, useMemo, useRef, useState} from "react";
import type {InputRef} from "antd";
import {
  Badge,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd';
import SyntaxHighlighter from "react-syntax-highlighter";
import {vs2015} from "react-syntax-highlighter/dist/cjs/styles/hljs";
import type {FilterConfirmProps} from 'antd/lib/table/interface';
import {TableRowSelection} from "antd/lib/table/interface";
import RequestInfo from "../../../types/RequestInfo";
import type {ColumnsType, ColumnType} from 'antd/lib/table';
import {
  DeleteTwoTone,
  FolderOpenOutlined,
  SearchOutlined,
  SettingOutlined
} from "@ant-design/icons";
import Highlighter from 'react-highlight-words';
import {
  associateApiEndpointSample,
  listApiEndpoints,
  listApiServices,
} from '@/services/interfaceManage';

const IGNORE_RULES_KEY = 'recorder.ignore.rules';

interface RequestInfoProps {
  dataSource: Array<RequestInfo>;
  rowKey?: string;
  rowSelection: TableRowSelection<any>;
  loading?: boolean;
  dispatch: (...args: any[]) => void,
  emptyText?: string | '暂无数据';
}

type DataIndex = keyof RequestInfoProps;

interface TagProps {
  color: string;
  fontColor: string;
}

const tagColor = (method: string): TagProps => {
  switch ((method || '').toUpperCase()) {
    case "GET":
      return {color: 'rgb(235, 249, 244)', fontColor: 'rgb(47, 177, 130)'}
    case "POST":
      return {color: 'rgb(242, 244, 248)', fontColor: 'rgb(5, 112, 175)'}
    case "PUT":
      return {color: 'rgb(255, 247, 230)', fontColor: 'rgb(255, 174, 0)'}
    case "DELETE":
      return {color: 'rgb(253, 244, 246)', fontColor: 'rgb(222, 72, 108)'}
    default:
      return {color: 'rgb(243, 251, 254)', fontColor: 'rgb(166, 187, 210)'}
  }
}

const MethodTag = ({color, text, fontColor}) => {
  return <Tag style={{color: fontColor, borderRadius: 12, padding: '0 12px'}} color={color}>{text}</Tag>
}

const toPrettyText = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
}

const safeJsonParse = (value, fallback = {}) => {
  if (!value) {
    return fallback;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

const readStorageArray = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

const writeStorageArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
}

const getRequestMeta = (url: string) => {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return {
      host: parsed.host || 'unknown-host',
      pathSegments: segments,
      fullPath: `${parsed.pathname || '/'}${parsed.search || ''}`,
      query: parsed.search ? parsed.search.slice(1) : '',
    };
  } catch (e) {
    const pure = (url || '').replace(/^https?:\/\//, '');
    const [hostWithPath, query = ''] = pure.split('?');
    const parts = hostWithPath.split('/').filter(Boolean);
    const host = parts[0] || 'unknown-host';
    const pathSegments = parts.slice(1);
    return {
      host,
      pathSegments,
      fullPath: `/${pathSegments.join('/')}${query ? `?${query}` : ''}` || '/',
      query,
    };
  }
}

const normalizeRequest = (item) => {
  if (item?.__normalized) {
    return item;
  }
  const meta = getRequestMeta(item.url);
  const statusCode = Number(item.status_code || 0);
  const responseHeaders = safeJsonParse(item.response_headers, {});
  const requestHeaders = safeJsonParse(item.request_headers, {});
  return {
    ...item,
    __host: meta.host,
    __pathSegments: meta.pathSegments,
    __fullPath: meta.fullPath,
    __query: meta.query,
    __statusCode: statusCode,
    __statusGroup: statusCode >= 500 ? '5xx' : statusCode >= 400 ? '4xx' : statusCode >= 300 ? '3xx' : statusCode >= 200 ? '2xx' : 'other',
    __hasBody: !!String(item.body || '').trim(),
    __isError: statusCode >= 400,
    __responseSize: String(item.response_content || '').length,
    __requestContentType: requestHeaders['Content-Type'] || requestHeaders['content-type'] || '-',
    __responseContentType: responseHeaders['Content-Type'] || responseHeaders['content-type'] || '-',
  };
}

const matchesIgnoreRules = (item, ignoreRules) => {
  if (!ignoreRules.length) {
    return false;
  }
  return ignoreRules.some((rule) => {
    try {
      return new RegExp(rule, 'i').test(item.url || '');
    } catch (e) {
      return false;
    }
  });
}

const createGroupNode = (segment, currentKey, level, host) => ({
  __isGroup: true,
  __rowKey: `group:${currentKey}`,
  __groupLevel: level,
  __segment: segment,
  __host: host,
  __leafCount: 0,
  __errorCount: 0,
  __latestAt: '',
  url: segment,
  request_method: '',
  created_at: '',
  children: [],
});

const compareTreeNode = (a, b) => {
  if (a.__isGroup && !b.__isGroup) {
    return -1;
  }
  if (!a.__isGroup && b.__isGroup) {
    return 1;
  }
  return String(a.url || '').localeCompare(String(b.url || ''));
}

const updateGroupStats = (node, item) => {
  node.__leafCount += 1;
  if (item.__isError) {
    node.__errorCount += 1;
  }
  if (!node.__latestAt || new Date(item.created_at || 0).getTime() >= new Date(node.__latestAt || 0).getTime()) {
    node.__latestAt = item.created_at || node.__latestAt;
  }
}

const appendGroupedRecord = (root, nodeMap, item) => {
  const levelOne = item.__pathSegments[0] || '(root)';
  const levelTwo = item.__pathSegments[1] || '(root)';
  const groupKeys = [item.__host, levelOne, levelTwo];
  let currentChildren = root;
  let parentKey = '';
  groupKeys.forEach((segment, index) => {
    const currentKey = `${parentKey}/${segment}`;
    let currentNode = nodeMap.get(currentKey);
    if (!currentNode) {
      currentNode = createGroupNode(segment, currentKey, index + 1, item.__host);
      nodeMap.set(currentKey, currentNode);
      currentChildren.push(currentNode);
      currentChildren.sort(compareTreeNode);
    }
    updateGroupStats(currentNode, item);
    currentChildren = currentNode.children;
    parentKey = currentKey;
  });
  currentChildren.push({
    ...item,
    url: item.__fullPath,
    __rowKey: item.index,
    __isLeaf: true,
  });
  currentChildren.sort(compareTreeNode);
}

const buildGroupedRecords = (records) => {
  const root = [];
  const nodeMap = new Map();
  records.forEach((item) => appendGroupedRecord(root, nodeMap, item));
  return { tree: root, nodeMap };
}

const collectLeafIndexes = (node) => {
  if (!node) {
    return [];
  }
  if (!node.__isGroup) {
    return [node.index];
  }
  return (node.children || []).flatMap(collectLeafIndexes);
}

const buildOverviewItems = (record) => {
  const queryPairs = Array.from(new URLSearchParams(record.__query || '').entries());
  return {
    queryPairs,
    requestHeaders: safeJsonParse(record.request_headers, {}),
    responseHeaders: safeJsonParse(record.response_headers, {}),
    requestCookies: safeJsonParse(record.request_cookies, {}),
    responseCookies: safeJsonParse(record.cookies, {}),
  }
}

const getDisplayRequestAddress = (record) => {
  const currentUrl = String(record?.url || '');
  if (/^https?:\/\//i.test(currentUrl)) {
    return currentUrl;
  }
  const host = String(record?.__host || '').trim();
  if (!host) {
    return currentUrl || '-';
  }
  if (currentUrl.startsWith(`${host}/`) || currentUrl === host) {
    return currentUrl;
  }
  if (currentUrl.startsWith(`//${host}/`)) {
    return currentUrl.slice(2);
  }
  if (!currentUrl || currentUrl === '-') {
    return host;
  }
  return `${host}${currentUrl.startsWith('/') ? '' : '/'}${currentUrl}`;
}

const CodeBlock = ({value}) => {
  const text = toPrettyText(value);
  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 8}}>
        <Button
          size="small"
          onClick={async () => {
            await navigator.clipboard.writeText(text === '-' ? '' : text)
            message.success('内容已复制')
          }}
        >
          复制内容
        </Button>
      </div>
      <SyntaxHighlighter language="json" style={vs2015}>{text}</SyntaxHighlighter>
    </div>
  )
}

const RequestInfoList: React.FC<RequestInfoProps> = ({dataSource, dispatch, loading, ...restProps}) => {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'group' | 'flat'>('group');
  const [methodFilters, setMethodFilters] = useState<string[]>([]);
  const [hostFilter, setHostFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [onlyError, setOnlyError] = useState(false);
  const [onlyHasBody, setOnlyHasBody] = useState(false);
  const [ignoreVisible, setIgnoreVisible] = useState(false);
  const [ignoreRulesText, setIgnoreRulesText] = useState('');
  const [ignoreRules, setIgnoreRules] = useState<string[]>(() => readStorageArray(IGNORE_RULES_KEY));
  const [associateVisible, setAssociateVisible] = useState(false);
  const [associateSubmitting, setAssociateSubmitting] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<any[]>([]);
  const [endpointOptions, setEndpointOptions] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>(undefined);
  const [selectedEndpointId, setSelectedEndpointId] = useState<number | undefined>(undefined);
  const [associateRecord, setAssociateRecord] = useState<any>(null);
  const searchInput = useRef<InputRef>(null);
  const groupedCacheRef = useRef<{ source: any[]; tree: any[]; nodeMap: Map<string, any> }>({
    source: [],
    tree: [],
    nodeMap: new Map(),
  });

  useEffect(() => {
    setIgnoreRulesText(ignoreRules.join('\n'));
  }, [ignoreRules]);

  const normalizedRecords = useMemo(() => dataSource.map(normalizeRequest), [dataSource]);

  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((item) => {
      if (matchesIgnoreRules(item, ignoreRules)) {
        return false;
      }
      if (methodFilters.length && !methodFilters.includes((item.request_method || '').toUpperCase())) {
        return false;
      }
      if (hostFilter && item.__host !== hostFilter) {
        return false;
      }
      if (statusFilter !== 'all' && item.__statusGroup !== statusFilter) {
        return false;
      }
      if (onlyError && !item.__isError) {
        return false;
      }
      if (onlyHasBody && !item.__hasBody) {
        return false;
      }
      return true;
    });
  }, [hostFilter, ignoreRules, methodFilters, normalizedRecords, onlyError, onlyHasBody, statusFilter]);

  const groupedDataSource = useMemo(() => {
    const cache = groupedCacheRef.current;
    const appendOnly =
      filteredRecords.length >= cache.source.length &&
      cache.source.every((item, index) => item === filteredRecords[index]);

    if (!appendOnly) {
      const next = buildGroupedRecords(filteredRecords);
      groupedCacheRef.current = {
        source: filteredRecords,
        tree: next.tree,
        nodeMap: next.nodeMap,
      };
      return next.tree;
    }

    if (filteredRecords.length > cache.source.length) {
      const nextTree = [...cache.tree];
      const nextNodeMap = new Map(cache.nodeMap);
      filteredRecords.slice(cache.source.length).forEach((item) => {
        appendGroupedRecord(nextTree, nextNodeMap, item);
      });
      groupedCacheRef.current = {
        source: filteredRecords,
        tree: nextTree,
        nodeMap: nextNodeMap,
      };
      return nextTree;
    }

    return cache.tree;
  }, [filteredRecords]);
  const flatDataSource = useMemo(() => filteredRecords.map(item => ({
    ...item,
    url: item.__fullPath,
    __rowKey: item.index,
  })), [filteredRecords]);
  const tableDataSource = viewMode === 'group' ? groupedDataSource : flatDataSource;
  const hostOptions = useMemo(() => Array.from(new Set(normalizedRecords.map(item => item.__host))).sort(), [normalizedRecords]);
  const selectedEndpointOption = useMemo(
    () => endpointOptions.find((item) => item.value === selectedEndpointId),
    [endpointOptions, selectedEndpointId],
  );

  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<RequestInfo> => ({
    filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
      <div style={{padding: 8}}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{marginBottom: 8, display: 'block'}}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined/>}
            size="small"
            style={{width: 90}}
          >
            查找
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{width: 90}}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{color: filtered ? '#1890ff' : undefined}}/>
    ),
    onFilter: (value, record) =>
      String(record[dataIndex] || '')
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    ellipsis: true,
  });

  const onRemoveRecord = index => {
    Modal.confirm({
      title: '确认删除该录制接口吗？',
      content: '删除后无法恢复，如果只是暂时不用，建议先保留。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => dispatch({
        type: 'recorder/remove',
        payload: index,
      })
    })
  }

  const onRemoveGroup = record => {
    const indexes = collectLeafIndexes(record)
    if (indexes.length === 0) {
      return
    }
    Modal.confirm({
      title: `确认删除该分组下的 ${indexes.length} 条录制接口吗？`,
      content: '分组删除会把该路径下的所有子路径和接口一并删除，删除后无法恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => dispatch({
        type: 'recorder/removeBatch',
        payload: indexes,
      })
    })
  }

  const saveIgnoreRules = () => {
    const rules = ignoreRulesText.split('\n').map(item => item.trim()).filter(Boolean);
    setIgnoreRules(rules);
    writeStorageArray(IGNORE_RULES_KEY, rules);
    setIgnoreVisible(false);
  }

  const resetAssociateState = () => {
    setAssociateVisible(false);
    setAssociateSubmitting(false);
    setSelectedServiceId(undefined);
    setSelectedEndpointId(undefined);
    setEndpointOptions([]);
    setAssociateRecord(null);
  }

  const loadServiceOptions = async () => {
    const res = await listApiServices({});
    if (res?.code === 0) {
      setServiceOptions(Array.isArray(res.data) ? res.data : []);
    }
  }

  const loadEndpointOptions = async (serviceId) => {
    if (!serviceId) {
      setEndpointOptions([]);
      return;
    }
    const res = await listApiEndpoints({ service_id: serviceId });
    if (res?.code === 0) {
      setEndpointOptions((res.data?.list || []).map((item) => ({
        ...item,
        label: `${item.method || 'GET'} ${item.name} · ${item.path}`,
        value: item.id,
      })));
    }
  }

  const openAssociateModal = async (record) => {
    setAssociateRecord(record);
    setAssociateVisible(true);
    setSelectedServiceId(undefined);
    setSelectedEndpointId(undefined);
    setEndpointOptions([]);
    if (!serviceOptions.length) {
      await loadServiceOptions();
    }
  }

  const submitAssociateSample = async () => {
    if (!associateRecord || !selectedEndpointId) {
      message.warning('请选择要关联的接口');
      return;
    }
    setAssociateSubmitting(true);
    const res = await associateApiEndpointSample({
      endpoint_id: selectedEndpointId,
      url: getDisplayRequestAddress(associateRecord),
      request_method: associateRecord.request_method,
      request_headers: safeJsonParse(associateRecord.request_headers, {}),
      body: associateRecord.body || '',
      response_headers: safeJsonParse(associateRecord.response_headers, {}),
      response_content: associateRecord.response_content || '',
      status_code: associateRecord.status_code || 0,
      created_at: associateRecord.created_at || '',
    });
    setAssociateSubmitting(false);
    if (res?.code === 0) {
      message.success('实例数据已手动关联，后续录制不会自动覆盖该接口样本');
      resetAssociateState();
    }
  }

  const selectionProps = restProps.rowSelection ? {
    ...restProps.rowSelection,
    getCheckboxProps: (record) => ({
      disabled: !!record.__isGroup,
    }),
  } : undefined

  const columns: ColumnsType<RequestInfo> = [
    {
      title: '请求地址',
      key: 'url',
      dataIndex: 'url',
      width: '52%',
      ...getColumnSearchProps('url'),
      render: (text, record) => {
        if (record.__isGroup) {
          return (
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <FolderOpenOutlined style={{color: '#1677ff'}} />
              <span>{record.__segment}</span>
              <Tag color="blue">{record.__leafCount} 条</Tag>
              {record.__errorCount > 0 ? <Tag color="red">{record.__errorCount} 异常</Tag> : null}
              {record.__latestAt ? <Typography.Text type="secondary" style={{fontSize: 12}}>最近录制 {record.__latestAt}</Typography.Text> : null}
            </div>
          )
        }
        const displayText = viewMode === 'flat'
          ? getDisplayRequestAddress(record)
          : (text ? text.toString() : '')
        return searchedColumn === 'url' ? (
          <Tooltip title={displayText}>
            <a onClick={() => setDetailRecord(record)}>
              <Highlighter
                highlightStyle={{backgroundColor: '#ffc069', padding: 0}}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={displayText}
              />
            </a>
          </Tooltip>
        ) : (
          <Tooltip title={displayText}>
            <a onClick={() => setDetailRecord(record)}>{displayText.slice(0, 150)}</a>
          </Tooltip>
        )
      }
    },
    {
      title: '请求方式',
      key: 'request_method',
      dataIndex: 'request_method',
      width: 120,
      render: (md, record) => record.__isGroup ? '-' : <MethodTag fontColor={tagColor(md).fontColor} color={tagColor(md).color} text={md}/>
    },
    {
      title: '状态',
      key: 'status_code',
      dataIndex: 'status_code',
      width: 100,
      render: (value, record) => {
        if (record.__isGroup) {
          return '-';
        }
        const status = Number(value || 0);
        if (status >= 500) {
          return <Badge status="error" text={status || '-'} />;
        }
        if (status >= 400) {
          return <Badge status="warning" text={status || '-'} />;
        }
        return <Badge status="success" text={status || '-'} />;
      }
    },
    {
      title: '时间',
      key: 'created_at',
      dataIndex: 'created_at',
      width: 180,
      render: (value, record) => record.__isGroup ? '-' : (value || '-')
    },
    {
      key: 'ops',
      title: '操作',
      width: 220,
      render: (_, record) => record.__isGroup ? (
        <Space size={12}>
          <a onClick={() => onRemoveGroup(record)}>删除分组</a>
        </Space>
      ) : <Space size={12}>
        <a onClick={() => setDetailRecord(record)}>详情</a>
        <a onClick={() => openAssociateModal(record)}>关联实例</a>
        <Tooltip title="删除当前录制接口"><DeleteTwoTone twoToneColor="#F56C6C" onClick={() => {
          onRemoveRecord(record.index)
        }}/></Tooltip>
      </Space>
    }
  ]

  const drawerMeta = detailRecord ? buildOverviewItems(detailRecord) : null;

  return (
    <>
      <div className="recorder-toolbar">
        <Space wrap size={[12, 12]}>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as 'group' | 'flat')}
            options={[
              { label: '分组查看', value: 'group' },
              { label: '平铺查看', value: 'flat' },
            ]}
          />
          <Select
            mode="multiple"
            allowClear
            placeholder="请求方式"
            style={{width: 180}}
            value={methodFilters}
            onChange={setMethodFilters}
            options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(item => ({label: item, value: item}))}
          />
          <Select
            allowClear
            placeholder="域名 / IP"
            style={{width: 220}}
            value={hostFilter}
            onChange={setHostFilter}
            options={hostOptions.map(item => ({label: item, value: item}))}
          />
          <Select
            value={statusFilter}
            style={{width: 130}}
            onChange={setStatusFilter}
            options={[
              {label: '全部状态', value: 'all'},
              {label: '2xx', value: '2xx'},
              {label: '4xx', value: '4xx'},
              {label: '5xx', value: '5xx'},
            ]}
          />
          <Space size={4}>
            <span>仅异常</span>
            <Switch checked={onlyError} onChange={setOnlyError} />
          </Space>
          <Space size={4}>
            <span>仅有请求体</span>
            <Switch checked={onlyHasBody} onChange={setOnlyHasBody} />
          </Space>
          <Button icon={<SettingOutlined />} onClick={() => setIgnoreVisible(true)}>忽略规则</Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={tableDataSource}
        rowSelection={selectionProps}
        rowKey={record => record.__rowKey ?? record[restProps.rowKey]}
        loading={loading}
        pagination={false}
        indentSize={24}
        rowClassName={(record) => {
          const latestClass = record.__isLatestFlash ? ' recorder-latest-row' : '';
          return record.__isGroup ? `recorder-group-row${latestClass}` : `recorder-leaf-row${latestClass}`;
        }}
        locale={{emptyText: <Empty description={restProps.emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />}}
      />
      <Drawer
        title={detailRecord ? `接口详情 - ${detailRecord.request_method || '-'} ${detailRecord.url || ''}` : '接口详情'}
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        width={820}
      >
        {detailRecord && drawerMeta ? (
          <Tabs
            defaultActiveKey="overview"
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="请求地址">{getDisplayRequestAddress(detailRecord)}</Descriptions.Item>
                    <Descriptions.Item label="请求方式">{detailRecord.request_method || '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态码">{detailRecord.status_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="录制时间">{detailRecord.created_at || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Host">{detailRecord.__host || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Request Content-Type">{detailRecord.__requestContentType || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Response Content-Type">{detailRecord.__responseContentType || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Response Size">{detailRecord.__responseSize || 0} chars</Descriptions.Item>
                  </Descriptions>
                )
              },
              {
                key: 'query',
                label: `Query${drawerMeta.queryPairs.length ? ` (${drawerMeta.queryPairs.length})` : ''}`,
                children: drawerMeta.queryPairs.length ? (
                  <Descriptions column={1} size="small" bordered>
                    {drawerMeta.queryPairs.map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>{value || '-'}</Descriptions.Item>
                    ))}
                  </Descriptions>
                ) : <Empty description="当前请求没有 Query 参数" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              },
              {
                key: 'request_headers',
                label: '请求 Headers',
                children: <CodeBlock value={drawerMeta.requestHeaders} />
              },
              {
                key: 'body',
                label: '请求参数',
                children: <CodeBlock value={detailRecord.body} />
              },
              {
                key: 'response_headers',
                label: '返回 Headers',
                children: <CodeBlock value={drawerMeta.responseHeaders} />
              },
              {
                key: 'cookies',
                label: 'Cookies',
                children: (
                  <>
                    <Typography.Title level={5}>Request Cookies</Typography.Title>
                    <SyntaxHighlighter language="json" style={vs2015}>{toPrettyText(drawerMeta.requestCookies)}</SyntaxHighlighter>
                    <Typography.Title level={5} style={{marginTop: 16}}>Response Cookies</Typography.Title>
                    <SyntaxHighlighter language="json" style={vs2015}>{toPrettyText(drawerMeta.responseCookies)}</SyntaxHighlighter>
                  </>
                )
              },
              {
                key: 'response_content',
                label: 'Response',
                children: <CodeBlock value={detailRecord.response_content} />
              },
              {
                key: 'timing',
                label: 'Timing',
                children: (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="录制时间">{detailRecord.created_at || '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态说明">{detailRecord.__isError ? '请求异常，建议结合状态码和响应内容排查。' : '当前版本暂未采集分阶段耗时，后续可继续补接详细 timing 数据。'}</Descriptions.Item>
                  </Descriptions>
                )
              },
            ]}
          />
        ) : null}
      </Drawer>
      <Modal
        title="忽略规则"
        open={ignoreVisible}
        onOk={saveIgnoreRules}
        onCancel={() => setIgnoreVisible(false)}
        okText="保存规则"
        cancelText="取消"
      >
        <Typography.Paragraph type="secondary">
          每行一条正则规则，命中 URL 的录制接口会在列表中隐藏。适合屏蔽心跳、静态资源、埋点等噪音请求。
        </Typography.Paragraph>
        <Input.TextArea
          rows={8}
          value={ignoreRulesText}
          onChange={(event) => setIgnoreRulesText(event.target.value)}
          placeholder={'例如：\n/health\n\\.js$\ntracking'}
        />
      </Modal>
      <Modal
        title="手动关联实例数据"
        open={associateVisible}
        confirmLoading={associateSubmitting}
        onOk={submitAssociateSample}
        onCancel={resetAssociateState}
        okText="确认关联"
        cancelText="取消"
        width={680}
        centered
        okButtonProps={{ size: 'large' }}
        cancelButtonProps={{ size: 'large' }}
      >
        <div className="associate-sample-modal">
          <div className="associate-sample-modal__banner">
            <div className="associate-sample-modal__banner-title">手动样本会覆盖当前接口的历史实例数据</div>
            <div className="associate-sample-modal__banner-desc">
              关联成功后，该接口样本将锁定为手动关联。只有在接口管理中清除实例数据后，新的录制请求才会重新自动补位。
            </div>
          </div>

          <div className="associate-sample-modal__section">
            <div className="associate-sample-modal__label">当前录制请求</div>
            <div className="associate-sample-modal__request">
              <div className="associate-sample-modal__method">
                {associateRecord?.request_method || 'GET'}
              </div>
              <div className="associate-sample-modal__request-body">
                <div className="associate-sample-modal__request-url">
                  {associateRecord ? getDisplayRequestAddress(associateRecord) : '-'}
                </div>
                <div className="associate-sample-modal__request-meta">
                  <span>状态码 {associateRecord?.status_code || '-'}</span>
                  <span>录制时间 {associateRecord?.created_at || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="associate-sample-modal__section">
            <div className="associate-sample-modal__label">目标接口</div>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div className="associate-sample-modal__field">
                <div className="associate-sample-modal__field-label">选择接口服务</div>
                <Select
                  showSearch
                  size="large"
                  placeholder="先选择服务"
                  value={selectedServiceId}
                  options={serviceOptions.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  onChange={async (value) => {
                    setSelectedServiceId(value);
                    setSelectedEndpointId(undefined);
                    await loadEndpointOptions(value);
                  }}
                  optionFilterProp="label"
                />
              </div>
              <div className="associate-sample-modal__field">
                <div className="associate-sample-modal__field-label">选择服务下的接口</div>
                <Select
                  showSearch
                  size="large"
                  placeholder="再选择具体接口"
                  value={selectedEndpointId}
                  options={endpointOptions}
                  onChange={setSelectedEndpointId}
                  optionFilterProp="label"
                />
              </div>
              <div className="associate-sample-modal__field">
                <div className="associate-sample-modal__field-label">关联的最新版本</div>
                <div className="associate-sample-modal__version">
                  {selectedEndpointOption?.current_version_no || '-'}
                </div>
              </div>
            </Space>
          </div>
        </div>
      </Modal>
      <style>{`
        .recorder-toolbar {
          margin-bottom: 16px;
          padding: 14px 16px;
          background: linear-gradient(180deg, #fbfdff 0%, #f6faff 100%);
          border: 1px solid #e6f4ff;
          border-radius: 14px;
        }
        .recorder-group-row td {
          background: linear-gradient(180deg, #fafcff 0%, #f6faff 100%) !important;
          font-weight: 600;
        }
        .recorder-leaf-row td {
          background: #fff !important;
        }
        .recorder-group-row:hover td,
        .recorder-leaf-row:hover td {
          background: #f5f9ff !important;
        }
        .recorder-latest-row td {
          animation: recorderFlash 4s ease-out;
        }
        @keyframes recorderFlash {
          0% { background: #fff7e6; }
          100% { background: transparent; }
        }
        .associate-sample-modal {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding-top: 4px;
        }
        .associate-sample-modal__banner {
          padding: 14px 16px;
          border-radius: 14px;
          background: linear-gradient(135deg, #f7fbff 0%, #edf5ff 100%);
          border: 1px solid #d7e8ff;
        }
        .associate-sample-modal__banner-title {
          color: #144a87;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .associate-sample-modal__banner-desc {
          color: #5b6b82;
          line-height: 1.7;
          font-size: 13px;
        }
        .associate-sample-modal__section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .associate-sample-modal__label {
          color: #1f2937;
          font-size: 13px;
          font-weight: 600;
        }
        .associate-sample-modal__request {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #e8edf5;
          background: #fbfcfe;
        }
        .associate-sample-modal__method {
          min-width: 72px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eaf3ff;
          color: #1554ad;
          font-weight: 700;
          text-align: center;
          font-size: 12px;
          letter-spacing: 0.4px;
        }
        .associate-sample-modal__request-body {
          flex: 1;
          min-width: 0;
        }
        .associate-sample-modal__request-url {
          color: #1f2937;
          font-size: 14px;
          line-height: 1.6;
          word-break: break-all;
        }
        .associate-sample-modal__request-meta {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          color: #7b8798;
          font-size: 12px;
        }
        .associate-sample-modal__field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .associate-sample-modal__field-label {
          color: #5b6472;
          font-size: 12px;
          font-weight: 600;
        }
        .associate-sample-modal__version {
          min-height: 48px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </>
  )
}

export default RequestInfoList;
