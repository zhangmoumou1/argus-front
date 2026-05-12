import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { connect } from '@umijs/max';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';
import {
  deleteMQConfig,
  insertMQConfig,
  listMQConfig,
  testMQConnectByForm,
  updateMQConfig,
} from '@/services/configure';

const { Option } = Select;

const typeTag = (type) => (
  type === 'rabbitmq' ? <Tag color="orange">RabbitMQ</Tag> : <Tag color="blue">Kafka</Tag>
);

const MessageBroker = ({ gconfig, dispatch, loading: modelLoading }) => {
  const { envList, envMap } = gconfig;
  const [queryForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const fetchEnv = () => {
    dispatch({
      type: 'gconfig/fetchEnvList',
      payload: { page: 1, size: 1000, exactly: true },
    });
  };

  const fetchList = async () => {
    setTableLoading(true);
    const res = await listMQConfig(queryForm.getFieldsValue());
    setTableLoading(false);
    if (auth.response(res)) setRows(res.data || []);
  };

  useEffect(() => {
    fetchEnv();
    fetchList();
  }, []);

  const openEdit = (record = {}) => {
    editForm.resetFields();
    editForm.setFieldsValue({
      mq_type: 'kafka',
      virtual_host: '/',
      use_ssl: false,
      ...record,
    });
    setEditOpen(true);
  };

  const onSave = async () => {
    const values = await editForm.validateFields();
    setSaving(true);
    const res = values.id ? await updateMQConfig(values) : await insertMQConfig(values);
    setSaving(false);
    if (auth.response(res, true)) {
      setEditOpen(false);
      fetchList();
    }
  };

  const onDelete = async (record) => {
    const res = await deleteMQConfig({ id: record.id });
    if (auth.response(res, true)) fetchList();
  };

  const onTestConnectionByForm = async () => {
    const values = await editForm.validateFields();
    setTestingConnection(true);
    const res = await testMQConnectByForm(values);
    setTestingConnection(false);
    auth.response(res, true);
  };

  const columns = [
    { title: '环境', key: 'env', dataIndex: 'env', width: 120, render: (env) => envMap[env] || env },
    { title: '名称', key: 'name', dataIndex: 'name', width: 180 },
    { title: '类型', key: 'mq_type', dataIndex: 'mq_type', width: 120, render: typeTag },
    { title: '地址', key: 'endpoint', width: 200, render: (_, record) => `${record.host}:${record.port}` },
    { title: '用户名', key: 'username', dataIndex: 'username', width: 140, render: (value) => value || '-' },
    { title: 'Virtual Host', key: 'virtual_host', dataIndex: 'virtual_host', width: 130, render: (value) => value || '-' },
    {
      title: '操作',
      key: 'ops',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该配置吗?" onConfirm={() => onDelete(record)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false} breadcrumb={null}>
      <Card>
        <Form form={queryForm} {...CONFIG.LAYOUT} onValuesChange={fetchList}>
          <Row gutter={[8, 8]}>
            <Col span={6}>
              <Form.Item label="环境" name="env">
                <Select placeholder="选择环境" allowClear>
                  {envList.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="名称" name="name">
                <Input placeholder="输入连接名称" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="类型" name="mq_type">
                <Select placeholder="选择类型" allowClear>
                  <Option value="kafka">Kafka</Option>
                  <Option value="rabbitmq">RabbitMQ</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="主机" name="host">
                <Input placeholder="输入主机地址" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Button type="primary" style={{ marginBottom: 8 }} icon={<PlusOutlined />} onClick={() => openEdit({})}>
          添加配置
        </Button>
        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={rows}
          loading={tableLoading || modelLoading.effects['gconfig/fetchEnvList']}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="消息中间件配置"
        width={560}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={onSave}
        confirmLoading={saving}
        footer={[
          <Button key="cancel" onClick={() => setEditOpen(false)}>取消</Button>,
          <Button key="test" icon={<ThunderboltOutlined />} loading={testingConnection} onClick={onTestConnectionByForm}>
            连接测试
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={onSave}>保存</Button>,
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="id" hidden><Input /></Form.Item>
          <Form.Item label="环境" name="env" rules={[{ required: true, message: '请选择环境' }]}>
            <Select placeholder="选择环境">
              {envList.map((item) => <Option key={item.id} value={item.id}>{item.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="连接名称" name="name" rules={[{ required: true, message: '请输入连接名称' }]}>
            <Input placeholder="例如：订单Kafka" />
          </Form.Item>
          <Form.Item label="类型" name="mq_type" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="选择中间件类型">
              <Option value="kafka">Kafka</Option>
              <Option value="rabbitmq">RabbitMQ</Option>
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item label="主机" name="host" rules={[{ required: true, message: '请输入主机' }]}>
                <Input placeholder="127.0.0.1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="端口" name="port" rules={[{ required: true, message: '请输入端口' }]}>
                <InputNumber min={1} max={65535} style={{ width: '100%' }} placeholder="9092/5672" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="用户名" name="username"><Input placeholder="无鉴权可留空" /></Form.Item>
          <Form.Item label="密码" name="password"><Input.Password placeholder="无鉴权可留空" /></Form.Item>
          <Form.Item label="Virtual Host" name="virtual_host"><Input placeholder="RabbitMQ使用，默认/" /></Form.Item>
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} placeholder="可选说明" /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default connect(({ gconfig, loading }) => ({ gconfig, loading }))(MessageBroker);
