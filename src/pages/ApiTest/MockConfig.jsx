import { PageContainer } from '@ant-design/pro-components';
import { connect } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';
import {
  deleteMockConfig,
  listMockConfig,
  saveMockConfig,
  toggleMockConfig,
} from '@/services/mockConfig';
import styles from './MockConfig.less';
import UserLink from '@/components/Button/UserLink';

const METHOD_COLORS = {
  ANY: 'default',
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
};

const defaultResponse = JSON.stringify({ code: 0, msg: 'success', data: {} }, null, 2);

const safeParseJson = (value, fieldName, fallback = {}) => {
  if (value in [undefined, null, '']) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${fieldName} 不是合法JSON`);
  }
};

const stringifyJson = (value) => {
  if (value in [undefined, null, '']) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

const MockConfig = ({ user, dispatch }) => {
  const { userMap = {} } = user || {};
  const [form] = Form.useForm();
  const [keyword, setKeyword] = useState('');
  const [enabled, setEnabled] = useState(undefined);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);

  const mockPrefix = useMemo(() => `${CONFIG.URL}/mock-api`, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listMockConfig({ keyword, enabled });
      if (auth.response(res, false)) {
        setRows(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch({ type: 'user/fetchUserList' });
    fetchList();
  }, []);

  const openCreate = () => {
    setCurrent(null);
    form.resetFields();
    form.setFieldsValue({
      method: 'GET',
      enabled: true,
      priority: 0,
      response_status: 200,
      response_delay_ms: 0,
      match_query: '{}',
      match_headers: '{}',
      match_body: '',
      response_headers: '{\n  "Content-Type": "application/json; charset=utf-8"\n}',
      response_body: defaultResponse,
    });
    setDrawerOpen(true);
  };

  const openEdit = (record) => {
    setCurrent(record);
    form.resetFields();
    form.setFieldsValue({
      ...record,
      enabled: Number(record.enabled) === 1,
      match_query: stringifyJson(record.match_query || {}),
      match_headers: stringifyJson(record.match_headers || {}),
      response_headers: stringifyJson(record.response_headers || {}),
      match_body: record.match_body || '',
      response_body: record.response_body || '',
    });
    setDrawerOpen(true);
  };

  const openDetail = (record) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
    message.success('已复制');
  };

  const renderCodeBlock = (title, content) => {
    const text = typeof content === 'string' ? content : JSON.stringify(content || {}, null, 2);
    return (
      <div className={styles.codeBlock}>
        <div className={styles.codeBlockHeader}>
          <span>{title}</span>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(text)} />
        </div>
        <pre className={styles.jsonPreview}>{text || '-'}</pre>
      </div>
    );
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        id: current?.id,
        match_query: safeParseJson(values.match_query, 'Query匹配', {}),
        match_headers: safeParseJson(values.match_headers, 'Headers匹配', {}),
        response_headers: safeParseJson(values.response_headers, '响应Headers', {}),
      };
      if (values.match_body?.trim().startsWith('{') || values.match_body?.trim().startsWith('[')) {
        payload.match_body = safeParseJson(values.match_body, 'Body匹配', {});
      }
      setSaving(true);
      const res = await saveMockConfig(payload);
      if (auth.response(res, true)) {
        setDrawerOpen(false);
        await fetchList();
      }
    } catch (error) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onToggle = async (record, checked) => {
    const res = await toggleMockConfig({ id: record.id, enabled: checked });
    if (auth.response(res, true)) {
      await fetchList();
    }
  };

  const onDelete = (record) => {
    Modal.confirm({
      title: '删除Mock规则',
      content: `确认删除 ${record.name} 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const res = await deleteMockConfig({ id: record.id });
        if (auth.response(res, true)) {
          await fetchList();
        }
      },
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 260,
      render: (value, record) => (
        <div className={styles.ruleName}>
          <strong>{value}</strong>
        </div>
      ),
    },
    {
      title: '方法',
      dataIndex: 'method',
      width: 90,
      render: (value) => <Tag color={METHOD_COLORS[value] || 'default'}>{value}</Tag>,
    },
    {
      title: '接口后缀',
      dataIndex: 'path_suffix',
      ellipsis: true,
      render: (value) => <span>{value}</span>,
    },
    {
      title: 'Mock地址',
      dataIndex: 'path_suffix',
      width: 360,
      render: (value) => {
        const url = `${mockPrefix}${value}`;
        return (
          <span className={styles.mockUrl}>
            <Tooltip title={url}>
              <a onClick={() => copyText(url)}>{url}</a>
            </Tooltip>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(url)} />
          </span>
        );
      },
    },
    {
      title: '状态码',
      dataIndex: 'response_status',
      width: 90,
      render: (value) => <Tag color={Number(value) < 400 ? 'green' : 'red'}>{value}</Tag>,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 90,
      render: (value, record) => (
        <Switch checked={Number(value) === 1} onChange={(checked) => onToggle(record, checked)} />
      ),
    },
    {
      title: '创建人',
      dataIndex: 'create_user',
      width: 150,
      render: (value) => <UserLink user={userMap[value] || userMap[String(value)]} />,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a onClick={() => openDetail(record)}>详情</a>
          <a onClick={() => openEdit(record)}><EditOutlined /> 编辑</a>
          <a style={{ color: '#ff4d4f' }} onClick={() => onDelete(record)}><DeleteOutlined /> 删除</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className={styles.mockConfigPage}>
        <Card className={styles.toolbarCard} bordered={false}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarSearch}>
              <Input
                allowClear
                style={{ width: 280 }}
                placeholder="搜索名称或接口后缀"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onPressEnter={fetchList}
              />
              <Select
                allowClear
                style={{ width: 130 }}
                placeholder="启用状态"
                value={enabled}
                onChange={setEnabled}
                options={[
                  { label: '启用', value: 1 },
                  { label: '停用', value: 0 },
                ]}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={fetchList}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setKeyword('');
                setEnabled(undefined);
                setTimeout(fetchList, 0);
              }}>重置</Button>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增Mock</Button>
          </div>
        </Card>
        <Card className={styles.tableCard} bordered={false} style={{ marginTop: 16 }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={false}
            scroll={{ x: 1380 }}
          />
        </Card>
      </div>
      <Drawer title="Mock规则详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={920} className={styles.detailDrawer}>
        {detailRecord ? (
          <div className={styles.drawerBody}>
            <div className={styles.detailHeader}>
              <div>
                <Space size={8}>
                  <Tag color={METHOD_COLORS[detailRecord.method] || 'default'}>{detailRecord.method}</Tag>
                  <strong className={styles.detailTitle}>{detailRecord.name}</strong>
                </Space>
                <div className={styles.detailPath}>{detailRecord.path_suffix}</div>
              </div>
              <Switch checked={Number(detailRecord.enabled) === 1} disabled />
            </div>
            <div className={styles.detailMetaGrid}>
              <div className={styles.detailMetaItem}>
                <span>Mock地址</span>
                <span className={styles.mockUrl}>
                  <a onClick={() => copyText(`${mockPrefix}${detailRecord.path_suffix}`)}>{`${mockPrefix}${detailRecord.path_suffix}`}</a>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(`${mockPrefix}${detailRecord.path_suffix}`)} />
                </span>
              </div>
              <div className={styles.detailMetaItem}>
                <span>状态码</span>
                <strong>{detailRecord.response_status}</strong>
              </div>
              <div className={styles.detailMetaItem}>
                <span>延迟</span>
                <strong>{detailRecord.response_delay_ms || 0} ms</strong>
              </div>
              <div className={styles.detailMetaItem}>
                <span>创建人</span>
                <UserLink user={userMap[detailRecord.create_user] || userMap[String(detailRecord.create_user)]} />
              </div>
              <div className={styles.detailMetaItem}>
                <span>创建时间</span>
                <strong>{detailRecord.created_at || '-'}</strong>
              </div>
              <div className={styles.detailMetaItem}>
                <span>更新时间</span>
                <strong>{detailRecord.updated_at || '-'}</strong>
              </div>
            </div>
            <Tabs
              className={styles.detailTabs}
              items={[
                {
                  key: 'match',
                  label: '请求匹配',
                  children: (
                    <div className={styles.detailPanelList}>
                      {renderCodeBlock('Query 匹配', detailRecord.match_query || {})}
                      {renderCodeBlock('Headers 匹配', detailRecord.match_headers || {})}
                      {renderCodeBlock('Body 匹配', detailRecord.match_body || '')}
                    </div>
                  ),
                },
                {
                  key: 'response',
                  label: '响应结果',
                  children: (
                    <div className={styles.detailPanelList}>
                      <div className={styles.responseStrip}>
                        <span>响应状态码：<strong>{detailRecord.response_status || 200}</strong></span>
                        <span>延迟：<strong>{detailRecord.response_delay_ms || 0} ms</strong></span>
                      </div>
                      {renderCodeBlock('响应 Headers', detailRecord.response_headers || {})}
                      {renderCodeBlock('指定响应 Body', detailRecord.response_body || '')}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        ) : null}
      </Drawer>
      <Drawer
        title={current ? '编辑Mock规则' : '新增Mock规则'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={920}
        className={styles.editDrawer}
        destroyOnClose
        footer={(
          <div className={styles.drawerFooter}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={onSave}>保存</Button>
          </div>
        )}
      >
        <Form form={form} layout="vertical" className={styles.editForm}>
          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>基础信息</div>
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item name="name" label="Mock名称" rules={[{ required: true, message: '请输入Mock名称' }]}>
                  <Input placeholder="例如：维度列表成功响应" />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item name="method" label="请求方法" rules={[{ required: true }]}>
                  <Select options={['ANY', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((value) => ({ label: value, value }))} />
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item name="enabled" label="启用" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="path_suffix" label="接口后缀" rules={[{ required: true, message: '请输入接口后缀' }]}>
              <Input addonBefore="/mock-api" placeholder="/bytserver/mvp/dim/dimList 或 /dim/dimList" />
            </Form.Item>
          </div>
          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>请求匹配</div>
            <Tabs
              className={styles.formTabs}
              items={[
                {
                  key: 'query',
                  label: 'Query',
                  children: (
                    <Form.Item name="match_query" label="Query匹配（JSON子集）">
                      <Input.TextArea rows={8} placeholder='{"pageNo":"1","pageSize":"20"}' />
                    </Form.Item>
                  ),
                },
                {
                  key: 'headers',
                  label: 'Headers',
                  children: (
                    <Form.Item name="match_headers" label="Headers匹配（JSON子集）">
                      <Input.TextArea rows={8} placeholder='{"tenant-id":"81010000"}' />
                    </Form.Item>
                  ),
                },
                {
                  key: 'body',
                  label: 'Body',
                  children: (
                    <Form.Item name="match_body" label="Body匹配（JSON子集或文本包含）">
                      <Input.TextArea rows={8} placeholder='{"name":"测试"} 或 输入一段需要包含的文本' />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </div>
          <div className={styles.formSection}>
            <div className={styles.formSectionTitle}>响应配置</div>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="response_status" label="响应状态码">
                  <InputNumber min={100} max={599} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="response_delay_ms" label="延迟(ms)">
                  <InputNumber min={0} max={60000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="remark" label="备注">
                  <Input placeholder="用于说明这个Mock规则的使用场景" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="response_headers" label="响应Headers（JSON）">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="response_body" label="指定响应Body">
              <Input.TextArea rows={12} placeholder="支持JSON、HTML、纯文本等响应内容" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(MockConfig);
