import { PageContainer } from '@ant-design/pro-components';
import { connect, history } from '@umijs/max';
import { Button, Card, Col, Dropdown, Form, Input, Menu, Modal, Row, Select, Space, Switch, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import parser from 'cron-parser';
import moment from 'moment';
import {
  ApiOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  CodeOutlined,
  LinkOutlined,
  MoreOutlined,
  NodeIndexOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import {
  deleteApiService,
  insertApiService,
  listApiServices,
  syncApiService,
  updateApiService,
} from '@/services/interfaceManage';
import auth from '@/utils/auth';
import './InterfaceService.less';

const InterfaceService = ({ project, dispatch }) => {
  const DEFAULT_SYNC_CRON = '0 0 * * *';
  const projectId = project?.project_id;
  const projects = project?.projects || [];
  const [queryProjectId, setQueryProjectId] = useState(undefined);
  const [keyword, setKeyword] = useState('');
  const [cronDate, setCronDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const sourceTypeValue = Form.useWatch('source_type', form);

  const sourceLabelMap = {
    manual: '手动',
    swagger: 'Swagger',
    yapi: 'YAPI',
  };

  const cardIcons = [
    <ApiOutlined key="api" />,
    <CloudServerOutlined key="cloud" />,
    <ClusterOutlined key="cluster" />,
    <AppstoreOutlined key="appstore" />,
    <CodeOutlined key="code" />,
    <LinkOutlined key="link" />,
    <NodeIndexOutlined key="node-index" />,
    <RocketOutlined key="rocket" />,
  ];

  const getCardIcon = (serviceId) => {
    const index = Math.abs(Number(serviceId || 0)) % cardIcons.length;
    return cardIcons[index];
  };

  const parseSourceConfig = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  };

  const getNextRunTime = (cronExpr) => {
    if (!cronExpr) return '-';
    try {
      const date = parser.parseExpression(cronExpr);
      return moment(new Date(date.next())).format('YYYY-MM-DD HH:mm:ss');
    } catch (e) {
      return '-';
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    const res = await listApiServices({ project_id: queryProjectId, keyword });
    setLoading(false);
    if (auth.response(res, false)) {
      setServices(res.data || []);
    }
  };

  useEffect(() => {
    if (!projects.length) {
      dispatch({
        type: 'project/listProject',
      });
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [queryProjectId]);

  const onSubmitService = async () => {
    const values = await form.validateFields();
    const payload = { ...values, project_id: values.project_id };
    const res = editing ? await updateApiService({ ...payload, id: editing.id }) : await insertApiService(payload);
    if (auth.response(res, true)) {
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchServices();
    }
  };

  const onServiceFormValuesChange = (changedValues, allValues) => {
    if (Object.prototype.hasOwnProperty.call(changedValues, 'sync_enabled') && changedValues.sync_enabled && !allValues.sync_cron) {
      form.setFieldsValue({ sync_cron: DEFAULT_SYNC_CRON });
    }
    if (Object.prototype.hasOwnProperty.call(changedValues, 'source_type') && changedValues.source_type === 'manual') {
      form.setFieldsValue({ sync_enabled: false, sync_cron: undefined, source_config: {} });
      setCronDate(null);
    }
  };

  const onDeleteService = async (id) => {
    const res = await deleteApiService({ id });
    if (auth.response(res, true)) {
      fetchServices();
    }
  };

  const onSync = async (serviceId) => {
    const res = await syncApiService({ service_id: serviceId });
    if (auth.response(res, true)) {
      fetchServices();
    }
  };

  const buildCardMenu = (item) => (
    <Menu
      className="interface-service-card__menu"
      onClick={({ key, domEvent }) => {
        domEvent.stopPropagation();
        if (key === 'edit') {
          setEditing(item);
          form.setFieldsValue({
            ...item,
            source_config: parseSourceConfig(item.source_config),
            sync_enabled: Number(item.sync_enabled) === 1,
          });
          setCronDate(null);
          setModalOpen(true);
          return;
        }
        if (key === 'sync') {
          if (item.source_type !== 'manual') onSync(item.id);
          return;
        }
        if (key === 'delete') {
          Modal.confirm({
            title: '确认删除该服务吗？',
            okType: 'danger',
            okText: '删除',
            cancelText: '取消',
            onOk: async () => {
              await onDeleteService(item.id);
            },
          });
        }
      }}
      items={[
        { key: 'edit', label: '编辑' },
        { key: 'sync', label: '同步', disabled: item.source_type === 'manual' },
        { key: 'delete', label: '删除', danger: true },
      ]}
    />
  );

  return (
    <PageContainer title={false} breadcrumb={null}>
      <Card bordered={false}>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Select
                allowClear
                showSearch
                value={queryProjectId}
                style={{ width: 220 }}
                placeholder="按项目筛选服务"
                options={projects.map((item) => ({ label: item.name, value: item.id }))}
                onChange={(value) => setQueryProjectId(value)}
              />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="服务名称模糊查询"
                style={{ width: 220 }}
              />
              <Button onClick={fetchServices}>查询</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ project_id: queryProjectId || projectId, source_type: 'manual', sync_enabled: false });
              setCronDate(null);
              setModalOpen(true);
            }}>新建服务</Button>
          </Col>
        </Row>
        <Row gutter={[16, 16]} className="interface-service-card-row">
          {(services || []).map((item) => (
            <Col xs={24} md={12} lg={8} xl={6} key={item.id}>
              <Card className="interface-service-card" hoverable loading={loading} onClick={() => history.push(`/apiTest/interface/${item.id}`)}>
                <div className="interface-service-card__head">
                  <div className="interface-service-card__main">
                    <span className="interface-service-card__icon">{getCardIcon(item.id)}</span>
                    <div className="interface-service-card__name-wrap">
                      <div className="interface-service-card__name" title={item.name}>{item.name}</div>
                      <div className="interface-service-card__project" title={projects.find((p) => p.id === item.project_id)?.name || item.project_id}>
                        {projects.find((p) => p.id === item.project_id)?.name || item.project_id}
                      </div>
                    </div>
                  </div>
                  <Space size={6} onClick={(e) => e.stopPropagation()}>
                    <Tag color={item.source_type === 'manual' ? 'default' : 'blue'}>
                      {sourceLabelMap[item.source_type] || sourceLabelMap.manual}
                    </Tag>
                    <Dropdown trigger={['click']} overlay={buildCardMenu(item)}>
                      <Button className="interface-service-card__more" size="small" type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  </Space>
                </div>
                <div className="interface-service-card__metric">
                  <div>
                    <div className="metric-value">{item.endpoint_total || 0}</div>
                    <div className="metric-label">接口数量</div>
                  </div>
                  <div className="metric-divider" />
                  <div className="metric-meta">
                    <div><span>开发</span>{item.developer || '-'}</div>
                    <div><span>测试</span>{item.tester || '-'}</div>
                  </div>
                </div>
                <div className="interface-service-card__sync-bar">
                  <span>
                    {item.source_type !== 'manual'
                      ? `定时同步：${Number(item.sync_enabled) === 1 ? '开启' : '关闭'}`
                      : '手动服务'}
                  </span>
                  <span title={Number(item.sync_enabled) === 1 ? getNextRunTime(item.sync_cron) : item.last_sync_at || '-'}>
                    {Number(item.sync_enabled) === 1 ? `下次执行 ${getNextRunTime(item.sync_cron)}` : `最近同步 ${item.last_sync_at || '-'}`}
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal title={editing ? '编辑服务' : '新建服务'} open={modalOpen} onOk={onSubmitService} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical" onValuesChange={onServiceFormValuesChange}>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true, message: '请选择所属项目' }]}>
            <Select showSearch options={projects.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item name="name" label="服务名称" rules={[{ required: true, message: '请输入服务名称' }]}><Input /></Form.Item>
          <Form.Item name="base_url" label="Base URL"><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="developer" label="开发人员"><Input placeholder="例如：张三 / 后端组" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tester" label="测试人员"><Input placeholder="例如：李四 / 测试组" /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="source_type" label="来源类型" initialValue="manual">
            <Select options={[{ label: '手工', value: 'manual' }, { label: 'Swagger', value: 'swagger' }, { label: 'YAPI', value: 'yapi' }]} />
          </Form.Item>
              {sourceTypeValue && sourceTypeValue !== 'manual' ? (
                <>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#344054' }}>来源配置</div>
              <Form.Item name={['source_config', 'source_url']} label={sourceTypeValue === 'swagger' ? 'Swagger地址' : 'YAPI接口地址'}>
                <Input placeholder={sourceTypeValue === 'swagger' ? 'Swagger/OpenAPI地址' : 'YAPI接口地址（Token自动读取系统设置）'} />
              </Form.Item>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#344054' }}>定时任务</div>
              <Form.Item name="sync_enabled" label="开启定时同步" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item
                name="sync_cron"
                label="cron表达式"
                extra={<div className="m-input-footer-msg">{cronDate || '* 默认每天凌晨0点执行，cron表达式只支持5位'}</div>}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const enabled = !!getFieldValue('sync_enabled');
                      if (!enabled) {
                        setCronDate(null);
                        return Promise.resolve();
                      }
                      if (!value) {
                        return Promise.reject(new Error('开启定时同步后，请输入cron表达式'));
                      }
                      try {
                        const date = parser.parseExpression(value);
                        setCronDate(`下次运行时间: ${moment(new Date(date.next())).format('YYYY-MM-DD HH:mm:ss')}`);
                        return Promise.resolve();
                      } catch (e) {
                        return Promise.reject(new Error('请输入正确的cron表达式'));
                      }
                    },
                  }),
                ]}
              >
                <Input placeholder={DEFAULT_SYNC_CRON} />
              </Form.Item>
            </>
          ) : null}
        </Form>
      </Modal>

    </PageContainer>
  );
};

export default connect(({ project }) => ({ project }))(InterfaceService);
