import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DiffOutlined,
  FileSearchOutlined,
  LinkOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { connect, useParams } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  compareApiEndpointVersion,
  deprecateApiEndpoint,
  getApiEndpointSample,
  listApiEndpointVersions,
  listApiEndpoints,
} from '@/services/interfaceManage';
import auth from '@/utils/auth';
import './InterfaceService.less';

const { Text, Title } = Typography;

const FIELD_LABELS = {
  name: '接口名称',
  method: '请求方法',
  module_name: '功能模块',
  path: '接口路径',
  full_url: '完整地址',
  request_headers: '请求头',
  request_params: '请求参数',
  response_body: '响应内容',
};

const METHOD_COLORS = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
};

const parseJsonText = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch (e) {
    return text;
  }
};

const MethodTag = ({ value }) => {
  const method = String(value || 'GET').toUpperCase();
  return <Tag color={METHOD_COLORS[method] || 'default'}>{method}</Tag>;
};

const StatusTag = ({ value }) => (
  value === 'deprecated' ? <Tag color="red">废弃</Tag> : <Tag color="green">可用</Tag>
);

const JsonBlock = ({ title, text, compact = false }) => {
  const value = parseJsonText(text);
  return (
    <Card size="small" title={title} className="interface-json-card">
      {value ? (
        <pre className={compact ? 'interface-json-block compact' : 'interface-json-block'}>{value}</pre>
      ) : (
        <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
};

const SampleDetail = ({ sample }) => {
  if (!sample) {
    return <Empty description="暂无录制实例数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <div className="interface-version-detail">
      <Descriptions bordered column={2} size="small" className="interface-version-desc">
        <Descriptions.Item label="样本来源">{sample.sample_source || 'record'}</Descriptions.Item>
        <Descriptions.Item label="录制时间">{sample.recorded_at || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态码">{sample.status_code || '-'}</Descriptions.Item>
        <Descriptions.Item label="请求路径">{sample.request_path || '-'}</Descriptions.Item>
        <Descriptions.Item label="请求地址" span={2}>{sample.request_url || '-'}</Descriptions.Item>
      </Descriptions>
      <Row gutter={[16, 16]} className="interface-version-blocks">
        <Col span={24}>
          <JsonBlock title="请求 Headers" text={sample.request_headers} />
        </Col>
        <Col span={12}>
          <JsonBlock title="请求 Query" text={sample.request_query} />
        </Col>
        <Col span={12}>
          <JsonBlock title="请求 Body" text={sample.request_body} />
        </Col>
        <Col span={12}>
          <JsonBlock title="返回 Headers" text={sample.response_headers} />
        </Col>
        <Col span={12}>
          <JsonBlock title="Response" text={sample.response_body} />
        </Col>
      </Row>
    </div>
  );
};

const VersionTimeline = ({ versions, activeId, onSelect }) => {
  if (!versions?.length) {
    return <Empty description="暂无版本" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <div className="interface-version-timeline">
      {versions.map((item, index) => {
        const active = item.id === activeId;
        return (
          <div
            className={active ? 'interface-version-node active' : 'interface-version-node'}
            key={item.id}
            onClick={() => onSelect(item.id)}
          >
            <div className="interface-version-node__dot">
              {index === 0 ? <BranchesOutlined /> : <ClockCircleOutlined />}
            </div>
            <div className="interface-version-node__content">
              <Space>
                <Text strong>{item.version_no}</Text>
                {index === 0 ? <Tag color="blue">当前</Tag> : null}
                <StatusTag value={item.endpoint_status} />
              </Space>
              <div className="interface-version-node__meta">{item.created_at || '-'}</div>
              <div className="interface-version-node__path">
                <MethodTag value={item.method} />
                <Text ellipsis>{item.path}</Text>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DiffFieldCard = ({ field, rows }) => {
  const changed = Array.isArray(rows) && rows.length > 0;
  return (
    <Card
      size="small"
      className={changed ? 'interface-diff-card changed' : 'interface-diff-card'}
      title={(
        <Space>
          <Badge status={changed ? 'warning' : 'success'} />
          <span>{FIELD_LABELS[field] || field}</span>
        </Space>
      )}
      extra={<Tag color={changed ? 'orange' : 'green'}>{changed ? '有变更' : '无差异'}</Tag>}
    >
      {changed ? (
        <pre className="interface-json-block compact">{JSON.stringify(rows, null, 2)}</pre>
      ) : (
        <Text type="secondary">两个版本在该字段完全一致</Text>
      )}
    </Card>
  );
};

const VersionDetail = ({ detail }) => {
  if (!detail) {
    return <Empty description="请选择版本查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <div className="interface-version-detail">
      <div className="interface-version-hero">
        <div>
          <Space>
            <MethodTag value={detail.method} />
            <StatusTag value={detail.endpoint_status} />
            <Tag color="geekblue">{detail.version_no}</Tag>
          </Space>
          <Title level={4}>{detail.name}</Title>
          <Space className="interface-version-url">
            <LinkOutlined />
            <Text copyable>{detail.full_url || detail.path}</Text>
          </Space>
        </div>
        <div className="interface-version-hero__time">
          <ClockCircleOutlined />
          <span>{detail.created_at || '-'}</span>
        </div>
      </div>

      <Descriptions bordered column={2} size="small" className="interface-version-desc">
        <Descriptions.Item label="版本号">{detail.version_no}</Descriptions.Item>
        <Descriptions.Item label="功能模块">{detail.module_name || '默认模块'}</Descriptions.Item>
        <Descriptions.Item label="请求方法">{detail.method}</Descriptions.Item>
        <Descriptions.Item label="接口路径">{detail.path}</Descriptions.Item>
        <Descriptions.Item label="完整地址" span={2}>{detail.full_url || '-'}</Descriptions.Item>
      </Descriptions>

      <Row gutter={[16, 16]} className="interface-version-blocks">
        <Col span={24}>
          <JsonBlock title="Headers" text={detail.request_headers} />
        </Col>
        <Col span={12}>
          <JsonBlock title="Params / Body" text={detail.request_params} />
        </Col>
        <Col span={12}>
          <JsonBlock title="Response" text={detail.response_body} />
        </Col>
      </Row>
    </div>
  );
};

const VersionCompare = ({
  versions,
  leftVersionId,
  rightVersionId,
  setLeftVersionId,
  setRightVersionId,
  compareResult,
  onCompare,
}) => {
  const versionOptions = versions.map((item) => ({
    label: `${item.version_no} · ${item.created_at || '-'}`,
    value: item.id,
  }));
  const changedFields = compareResult?.changed_fields || [];
  const diff = compareResult?.diff || {};

  return (
    <div className="interface-version-compare">
      <Card className="interface-compare-toolbar" bordered={false}>
        <Space wrap>
          <Select
            style={{ width: 260 }}
            placeholder="选择旧版本"
            value={leftVersionId || undefined}
            options={versionOptions}
            onChange={setLeftVersionId}
          />
          <DiffOutlined className="interface-compare-arrow" />
          <Select
            style={{ width: 260 }}
            placeholder="选择新版本"
            value={rightVersionId || undefined}
            options={versionOptions}
            onChange={setRightVersionId}
          />
          <Button type="primary" onClick={onCompare}>开始对比</Button>
        </Space>
      </Card>

      {!compareResult ? (
        <Empty description="选择两个版本后查看字段级差异" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : compareResult.error ? (
        <Empty description={compareResult.error} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <Row gutter={[16, 16]} className="interface-compare-summary">
            <Col span={8}>
              <Statistic title="变更字段" value={changedFields.length} suffix={`/ ${Object.keys(FIELD_LABELS).length}`} />
            </Col>
            <Col span={16}>
              <div className="interface-compare-tags">
                {changedFields.length ? changedFields.map((field) => (
                  <Tag color="orange" key={field}>{FIELD_LABELS[field] || field}</Tag>
                )) : <Tag color="green">两个版本无差异</Tag>}
              </div>
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            {Object.keys(FIELD_LABELS).map((field) => (
              <Col span={field.includes('response') || field.includes('request') ? 24 : 12} key={field}>
                <DiffFieldCard field={field} rows={diff[field] || []} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

const InterfaceEndpoint = () => {
  const { service_id } = useParams();
  const [keyword, setKeyword] = useState('');
  const [urlKeyword, setUrlKeyword] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [status, setStatus] = useState('');
  const [moduleOptions, setModuleOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const requestIdRef = useRef(0);

  const [versionOpen, setVersionOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [detailVersionId, setDetailVersionId] = useState(null);
  const [leftVersionId, setLeftVersionId] = useState(null);
  const [rightVersionId, setRightVersionId] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [sampleDetail, setSampleDetail] = useState(null);

  const fetchList = async (overrides = {}) => {
    if (!service_id) return;
    const query = {
      service_id,
      keyword: overrides.keyword ?? keyword,
      url: overrides.urlKeyword ?? urlKeyword,
      module_name: overrides.moduleName ?? moduleName,
      endpoint_status: overrides.status ?? status,
    };
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    setLoading(true);
    const res = await listApiEndpoints(query);
    if (currentRequestId !== requestIdRef.current) {
      return;
    }
    setLoading(false);
    if (auth.response(res, false)) {
      const nextList = res.data?.list || [];
      const nextModules = res.data?.modules || [];
      setList(nextList);
      setModuleOptions(nextModules);
    }
  };

  useEffect(() => {
    fetchList();
  }, [service_id, moduleName, status]);

  const endpointStats = useMemo(() => {
    const total = list.length;
    const available = list.filter((item) => item.endpoint_status !== 'deprecated').length;
    const deprecated = total - available;
    const modules = new Set(list.map((item) => item.module_name || '默认模块')).size;
    return { total, available, deprecated, modules };
  }, [list]);

  const detailData = useMemo(
    () => versions.find((item) => item.id === detailVersionId) || null,
    [versions, detailVersionId],
  );

  const onDeprecate = async (record) => {
    const res = await deprecateApiEndpoint({ endpoint_id: record.id });
    if (auth.response(res, true)) {
      fetchList();
    }
  };

  const openVersions = async (record) => {
    setCurrent(record);
    setVersions([]);
    setDetailVersionId(null);
    setCompareResult(null);
    setSampleDetail(null);
    setVersionOpen(true);
    const [versionRes, sampleRes] = await Promise.all([
      listApiEndpointVersions({ endpoint_id: record.id }),
      getApiEndpointSample({ endpoint_id: record.id }),
    ]);
    if (auth.response(versionRes, false)) {
      const versionRows = versionRes.data || [];
      const firstId = versionRows[0]?.id || null;
      setVersions(versionRows);
      setDetailVersionId(firstId);
      setLeftVersionId(versionRows[1]?.id || firstId);
      setRightVersionId(firstId);
    }
    if (auth.response(sampleRes, false)) {
      setSampleDetail(sampleRes.data || null);
    }
  };

  const onCompareVersion = async () => {
    if (!leftVersionId || !rightVersionId || leftVersionId === rightVersionId) {
      setCompareResult({ changed_fields: [], diff: {}, error: '请选择两个不同版本进行对比' });
      return;
    }
    const res = await compareApiEndpointVersion({
      left_version_id: leftVersionId,
      right_version_id: rightVersionId,
    });
    if (auth.response(res, false)) {
      setCompareResult(res.data);
    }
  };

  const onReset = () => {
    setKeyword('');
    setUrlKeyword('');
    setModuleName('');
    setStatus('');
    fetchList({
      keyword: '',
      urlKeyword: '',
      moduleName: '',
      status: '',
    });
  };

  const endpointColumns = [
    {
      title: '接口名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Text strong>{value}</Text>
            {record.endpoint_status === 'deprecated' ? <Tag color="red">废弃</Tag> : null}
          </Space>
          <Text type="secondary" ellipsis className="interface-endpoint-path">
            {record.path}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 84,
      render: (value) => String(value || 'GET').toUpperCase(),
    },
    {
      title: '功能模块',
      dataIndex: 'module_name',
      key: 'module_name',
      width: 220,
      render: (value) => value || '默认模块',
    },
    {
      title: '状态',
      dataIndex: 'endpoint_status',
      key: 'endpoint_status',
      width: 110,
      render: (value) => {
        const deprecated = value === 'deprecated';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 56,
              padding: '2px 10px',
              borderRadius: 8,
              border: `1px solid ${deprecated ? '#ec9a08' : '#2f9f3d'}`,
              background: deprecated ? '#ec9a08' : '#2f9f3d',
              color: deprecated ? '#000' : '#f9fafb',
              fontSize: 12,
              lineHeight: '20px',
            }}
          >
            {deprecated ? '废弃' : '可用'}
          </span>
        );
      },
    },
    {
      title: '实例数据',
      dataIndex: 'sample_available',
      key: 'sample_available',
      width: 110,
      render: (value) => (value ? '有实例' : '无实例'),
    },
    {
      title: '实例时间',
      dataIndex: 'sample_recorded_at',
      key: 'sample_recorded_at',
      width: 170,
      render: (value) => value || '-',
    },
    { title: '当前版本', dataIndex: 'current_version_no', key: 'current_version_no', width: 120 },
    { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 170 },
    {
      title: '操作',
      key: 'op',
      width: 180,
      render: (_, record) => (
        <Space>
          <a onClick={() => openVersions(record)}>版本工作台</a>
          {record.endpoint_status !== 'deprecated' ? (
            <Popconfirm title="确认将该接口废弃吗？" onConfirm={() => onDeprecate(record)}>
              <a>废弃</a>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="interface-endpoint-page">
        <Row gutter={[16, 16]} className="interface-endpoint-stats">
          <Col xs={12} md={6}>
            <Card bordered={false}><Statistic title="接口总数" value={endpointStats.total} prefix={<ApiOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false}><Statistic title="可用接口" value={endpointStats.available} prefix={<CheckCircleOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false}><Statistic title="废弃接口" value={endpointStats.deprecated} prefix={<StopOutlined />} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card bordered={false}><Statistic title="功能模块" value={endpointStats.modules} prefix={<BranchesOutlined />} /></Card>
          </Col>
        </Row>

        <Card bordered={false} className="interface-endpoint-card">
          <div className="interface-endpoint-toolbar">
            <Space wrap>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索接口名称" style={{ width: 220 }} />
              <Input value={urlKeyword} onChange={(e) => setUrlKeyword(e.target.value)} placeholder="URL模糊查询" style={{ width: 220 }} />
              <Select
                allowClear
                value={moduleName || undefined}
                style={{ width: 200 }}
                placeholder="选择功能模块"
                options={(moduleOptions || []).map((item) => ({ label: item, value: item }))}
                onChange={(value) => setModuleName(value || '')}
              />
              <Select
                allowClear
                value={status || undefined}
                style={{ width: 140 }}
                placeholder="接口状态"
                options={[{ label: '可用', value: 'available' }, { label: '废弃', value: 'deprecated' }]}
                onChange={(value) => setStatus(value || '')}
              />
              <Button type="primary" onClick={fetchList}>查询</Button>
              <Button onClick={onReset}>重置</Button>
            </Space>
          </div>
          <Table
            rowKey="id"
            columns={endpointColumns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 980 }}
            rowClassName={(record) => (record.endpoint_status === 'deprecated' ? 'interface-endpoint-row deprecated' : 'interface-endpoint-row')}
          />
        </Card>
      </div>

      <Drawer
        width="72vw"
        title={(
          <Space>
            <FileSearchOutlined />
            <span>接口版本工作台</span>
            {current?.name ? <Text type="secondary">/ {current.name}</Text> : null}
          </Space>
        )}
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        className="interface-version-drawer"
      >
        <Row gutter={16} className="interface-version-layout">
          <Col span={7}>
            <Card
              bordered={false}
              className="interface-version-sidebar"
              title={(
                <Space>
                  <BranchesOutlined />
                  <span>版本时间线</span>
                  <Tag>{versions.length}</Tag>
                </Space>
              )}
            >
              <VersionTimeline versions={versions} activeId={detailVersionId} onSelect={setDetailVersionId} />
            </Card>
          </Col>
          <Col span={17}>
            <Card bordered={false} className="interface-version-workbench">
              <Tabs
                items={[
                  {
                    key: 'detail',
                    label: '版本快照',
                    children: <VersionDetail detail={detailData} />,
                  },
                    {
                      key: 'sample',
                      label: '实例样本',
                      children: <SampleDetail sample={sampleDetail} />,
                    },
                    {
                      key: 'compare',
                      label: (
                        <Tooltip title="对比两个版本在基础信息、请求头、参数、响应上的差异">
                        <span>版本对比</span>
                      </Tooltip>
                    ),
                    children: (
                      <VersionCompare
                        versions={versions}
                        leftVersionId={leftVersionId}
                        rightVersionId={rightVersionId}
                        setLeftVersionId={setLeftVersionId}
                        setRightVersionId={setRightVersionId}
                        compareResult={compareResult}
                        onCompare={onCompareVersion}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Drawer>
    </PageContainer>
  );
};

export default connect(() => ({}))(InterfaceEndpoint);
