import {PageContainer} from "@ant-design/pro-components";
import {Button, Card, Col, Form, Input, InputNumber, message, Modal, Row, Select, Switch, Table, Tabs, Tag, Tooltip} from "antd";
import {PlusOutlined, DeleteOutlined, EditOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from "react";
import {
  listNotificationChannels, insertNotificationChannel, updateNotificationChannel,
  deleteNotificationChannel, testNotificationChannel, getNotificationChannelDetail,
  listNotificationTemplates, insertNotificationTemplate, updateNotificationTemplate,
  deleteNotificationTemplate, getNotificationTemplateDetail,
  listNotificationGroups, insertNotificationGroup, updateNotificationGroup,
  deleteNotificationGroup, getNotificationGroupDetail,
  listNotificationConfigs, insertNotificationConfig, updateNotificationConfig,
  deleteNotificationConfig, getNotificationConfigDetail,
  listEnabledChannels, listEnabledTemplates,
} from "@/services/notificationConfig";
import {listUsers} from "@/services/user";
import UserSelect from "@/components/User/UserSelect";

const {TextArea} = Input;
const {Option} = Select;

const CHANNEL_TYPES = {
  0: {name: '邮件', color: 'blue'},
  1: {name: '钉钉', color: 'green'},
  2: {name: '企业微信', color: 'orange'},
  3: {name: '飞书', color: 'purple'},
};

const TEMPLATE_VARS = [
  '{plan_name}', '{env}', '{executor}', '{plan_result}', '{result_color}',
  '{success}', '{failed}', '{error}', '{skipped}', '{start_time}', '{end_time}',
  '{duration}', '{pass_rate}', '{report_url}', '{notification_user}',
];

// ==================== 通知渠道 Tab ====================

const ChannelTab = ({refreshKey}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const res = await listNotificationChannels();
    if (res?.code === 0) setData(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [refreshKey]);

  const handleSave = async () => {
    const values = await form.validateFields();
    // 将配置字段打包到 config_json
    const configFields = ['webhook_url', 'secret', 'host', 'port', 'sender', 'password'];
    const config_json = {};
    configFields.forEach(f => {
      if (values[f] !== undefined) {
        config_json[f] = values[f];
      }
    });
    const payload = {name: values.name, channel_type: values.channel_type, enabled: values.enabled, description: values.description, config_json};
    if (editRecord) payload.id = editRecord.id;
    const api = editRecord ? updateNotificationChannel : insertNotificationChannel;
    const res = await api(payload);
    if (res?.code === 0) {
      message.success(editRecord ? '更新成功' : '创建成功');
      setModalVisible(false);
      fetchData();
    } else {
      message.error(res?.msg || '操作失败');
    }
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: '确认删除', content: `删除渠道「${record.name}」？`,
      onOk: async () => {
        const res = await deleteNotificationChannel({id: record.id});
        if (res?.code === 0) { message.success('已删除'); fetchData(); }
        else message.error(res?.msg || '删除失败');
      }
    });
  };

  const handleTest = async (record) => {
    const res = await testNotificationChannel({id: record.id});
    if (res?.code === 0) message.success('测试消息发送成功');
    else message.error(res?.msg || '发送失败');
  };

  const openEdit = async (record) => {
    if (record) {
      const res = await getNotificationChannelDetail({id: record.id});
      if (res?.code === 0) {
        const detail = res.data;
        form.setFieldsValue({
          name: detail.name,
          channel_type: detail.channel_type,
          description: detail.description,
          ...detail.config_json,
        });
      }
    } else {
      form.resetFields();
    }
    setEditRecord(record);
    setModalVisible(true);
  };

  const columns = [
    {title: '名称', dataIndex: 'name', key: 'name'},
    {title: '类型', dataIndex: 'channel_type', key: 'channel_type',
     render: (v) => {
       const ct = CHANNEL_TYPES[v] || {name: '未知', color: 'default'};
       return <Tag color={ct.color}>{ct.name}</Tag>;
     }
    },
    {title: '状态', dataIndex: 'enabled', key: 'enabled', render: (v) => v ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>},
    {title: '描述', dataIndex: 'description', key: 'description', ellipsis: true},
    {title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 160},
    {title: '操作', key: 'action', width: 180,
     render: (_, record) => <>
       <a onClick={() => openEdit(record)}>编辑</a>
       <span style={{margin: '0 8px', color: '#ddd'}}>|</span>
       <a onClick={() => handleTest(record)}>发送测试</a>
       <span style={{margin: '0 8px', color: '#ddd'}}>|</span>
       <a style={{color: '#ff4d4f'}} onClick={() => handleDelete(record)}>删除</a>
     </>
    },
  ];

  const channelType = Form.useWatch('channel_type', form);

  return (
    <div>
      <Button type="primary" style={{marginBottom: 16}} onClick={() => openEdit(null)}>
        <PlusOutlined /> 新增渠道
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} size="small" />

      <Modal title={editRecord ? '编辑渠道' : '新增渠道'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={640}>
        <Form form={form} layout="vertical" initialValues={{channel_type: 0, enabled: true}}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="渠道名称" rules={[{required: true}]}>
                <Input placeholder="例如：公司钉钉群" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel_type" label="渠道类型" rules={[{required: true}]}>
                <Select placeholder="选择类型" onChange={() => form.resetFields(['config_json'])}>
                  {Object.entries(CHANNEL_TYPES).map(([k, v]) => <Option key={k} value={Number(k)}>{v.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {channelType === 0 && (
            <div style={{background: '#fafafa', padding: 16, borderRadius: 6}}>
              <h4>邮件配置</h4>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="host" label="SMTP服务器" rules={[{required: true}]}><Input placeholder="smtp.example.com" /></Form.Item></Col>
                <Col span={12}><Form.Item name="port" label="端口" rules={[{required: true}]}><InputNumber style={{width: '100%'}} placeholder="465" /></Form.Item></Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="sender" label="发件人邮箱" rules={[{required: true}]}><Input placeholder="noreply@example.com" /></Form.Item></Col>
                <Col span={12}><Form.Item name="password" label="密码/授权码"><Input.Password placeholder="输入密码" /></Form.Item></Col>
              </Row>
            </div>
          )}
          {channelType === 1 && (
            <div style={{background: '#fafafa', padding: 16, borderRadius: 6}}>
              <h4>钉钉配置</h4>
              <Form.Item name="webhook_url" label="Webhook地址" rules={[{required: true}]}>
                <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=..." />
              </Form.Item>
              <Form.Item name="secret" label="加签密钥">
                <Input.Password placeholder="SEC...（如开启加签必填）" />
              </Form.Item>
            </div>
          )}
          {channelType === 2 && (
            <div style={{background: '#fafafa', padding: 16, borderRadius: 6}}>
              <h4>企业微信配置</h4>
              <Form.Item name="webhook_url" label="Webhook地址" rules={[{required: true}]}>
                <Input placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..." />
              </Form.Item>
            </div>
          )}
          {channelType === 3 && (
            <div style={{background: '#fafafa', padding: 16, borderRadius: 6}}>
              <h4>飞书配置</h4>
              <Form.Item name="webhook_url" label="Webhook地址" rules={[{required: true}]}>
                <Input placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..." />
              </Form.Item>
            </div>
          )}
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== 通知模板 Tab ====================

const TemplateTab = ({refreshKey}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const res = await listNotificationTemplates();
    if (res?.code === 0) setData(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [refreshKey]);

  const handleSave = async () => {
    const values = await form.validateFields();
    const api = editRecord ? updateNotificationTemplate : insertNotificationTemplate;
    const res = await api(editRecord ? {...values, id: editRecord.id} : values);
    if (res?.code === 0) {
      message.success(editRecord ? '更新成功' : '创建成功');
      setModalVisible(false);
      fetchData();
    } else message.error(res?.msg || '操作失败');
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除', content: `删除模板「${record.name}」？`,
      onOk: async () => {
        const res = await deleteNotificationTemplate({id: record.id});
        if (res?.code === 0) { message.success('已删除'); fetchData(); }
      }
    });
  };

  const openEdit = async (record) => {
    if (record) {
      const res = await getNotificationTemplateDetail({id: record.id});
      if (res?.code === 0) form.setFieldsValue(res.data);
    } else {
      form.resetFields();
      form.setFieldsValue({
        channel_type: 1,
        subject_template: '测试计划【{plan_name}】执行完毕 - {plan_result}',
        content_template: '## pity接口自动化测试报告\n\n> **测试计划**: {plan_name}\n> **测试环境**: {env} | **执行人**: {executor}\n> **测试结果**: **{plan_result}**\n\n### 执行概况\n- ✅ 成功: `{success}`\n- ❌ 失败: `{failed}`\n- ⚠️ 出错: `{error}`\n- 🔷 跳过: `{skipped}`\n\n⏱️ **时间周期**: {start_time} ~ {end_time} | **耗时**: `{duration}`\n\n🔗 [点击查看详细测试报告]({report_url})',
      });
    }
    setEditRecord(record);
    setModalVisible(true);
  };

  const columns = [
    {title: '名称', dataIndex: 'name', key: 'name'},
    {title: '适配渠道', dataIndex: 'channel_type', key: 'channel_type',
     render: (v) => {
       const ct = CHANNEL_TYPES[v] || {};
       return <Tag color={ct.color || 'default'}>{ct.name || '未知'}</Tag>;
     }
    },
    {title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 160},
    {title: '操作', key: 'action', width: 120,
     render: (_, record) => <>
       <a onClick={() => openEdit(record)}>编辑</a>
       <span style={{margin: '0 8px', color: '#ddd'}}>|</span>
       <a style={{color: '#ff4d4f'}} onClick={() => handleDelete(record)}>删除</a>
     </>
    },
  ];

  return (
    <div>
      <Button type="primary" style={{marginBottom: 16}} onClick={() => openEdit(null)}>
        <PlusOutlined /> 新增模板
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} size="small" />

      <Modal title={editRecord ? '编辑模板' : '新增模板'} open={modalVisible} onOk={handleSave} onCancel={() => setModalVisible(false)} width={800}>
        <Form form={form} layout="vertical" initialValues={{channel_type: 1, enabled: true}}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="模板名称" rules={[{required: true}]}><Input placeholder="例如：钉钉默认模板" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="channel_type" label="适配渠道" rules={[{required: true}]}>
                <Select placeholder="选择类型">
                  {Object.entries(CHANNEL_TYPES).map(([k, v]) => <Option key={k} value={Number(k)}>{v.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="subject_template" label="主题模板">
            <Input placeholder="可选，例如：测试计划【{plan_name}】执行完毕" />
          </Form.Item>
          <Form.Item name="content_template" label="内容模板" rules={[{required: true}]}>
            <TextArea rows={8} placeholder="输入模板内容，支持变量..." />
          </Form.Item>
          <div style={{background: '#fafafa', padding: '8px 12px', borderRadius: 4, marginBottom: 16}}>
            <span style={{fontWeight: 500, marginRight: 8}}>可用变量：</span>
            {TEMPLATE_VARS.map(v => <Tag key={v} style={{cursor: 'pointer', marginBottom: 4}}
                                         onClick={() => {
                                           const cur = form.getFieldValue('content_template') || '';
                                           form.setFieldsValue({content_template: cur + v});
                                         }}>{v}</Tag>)}
          </div>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== 通知配置 Tab ====================

const ConfigTab = ({refreshKey}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [channels, setChannels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [userList, setUserList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const [res, chRes, tplRes, grpRes] = await Promise.all([
      listNotificationConfigs(),
      listEnabledChannels(),
      listEnabledTemplates(),
      listNotificationGroups(),
    ]);
    if (res?.code === 0) setData(res.data || []);
    if (chRes?.code === 0) setChannels(chRes.data || []);
    if (tplRes?.code === 0) setTemplates(tplRes.data || []);
    if (grpRes?.code === 0) setGroups(grpRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    (async () => {
      const userRes = await listUsers({page: 1, size: 1000});
      if (Array.isArray(userRes)) setUserList(userRes);
    })();
  }, [refreshKey]);

  const handleSave = async () => {
    await form.validateFields();
    // 使用 getFieldsValue 读取所有字段，避免 validateFields 返回值可能不准确的问题
    const values = form.getFieldsValue(true);
    const api = editRecord ? updateNotificationConfig : insertNotificationConfig;
    const res = await api(editRecord ? {...values, id: editRecord.id} : values);
    if (res?.code === 0) {
      message.success(editRecord ? '更新成功' : '创建成功');
      setModalVisible(false);
      fetchData();
    } else message.error(res?.msg || '操作失败');
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除', content: `删除通知配置「${record.name}」？`,
      onOk: async () => {
        const res = await deleteNotificationConfig({id: record.id});
        if (res?.code === 0) { message.success('已删除'); fetchData(); }
      }
    });
  };

  const openEdit = async (record) => {
    if (record) {
      const res = await getNotificationConfigDetail({id: record.id});
      if (res?.code === 0) {
        const d = res.data;
        form.setFieldsValue({
          name: d.name,
          channel_ids: d.channels?.map(c => c.id) || [],
          template_id: d.template?.id || null,
          receiver: d.receiver ? d.receiver.split(',').map(v => Number(v)).filter(v => v > 0) : [],
          group_ids: d.group_ids ? d.group_ids.split(',').map(v => Number(v)).filter(v => v > 0) : [],
          pass_rate: d.pass_rate != null ? d.pass_rate : 80,
        });
      }
    } else {
      form.resetFields();
    }
    setEditRecord(record);
    setModalVisible(true);
  };

  const columns = [
    {title: '配置名称', dataIndex: 'name', key: 'name'},
    {title: '渠道数', dataIndex: 'channel_count', key: 'channel_count', width: 80, align: 'center'},
    {title: '接收人数', dataIndex: 'receiver_count', key: 'receiver_count', width: 80, align: 'center'},
    {title: '用户组数', dataIndex: 'group_count', key: 'group_count', width: 80, align: 'center'},
    {title: '合格率阈值', dataIndex: 'pass_rate', key: 'pass_rate', width: 100, align: 'center', render: v => `${v}%`},
    {title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 160},
    {title: '操作', key: 'action', width: 120,
     render: (_, record) => <>
       <a onClick={() => openEdit(record)}>编辑</a>
       <span style={{margin: '0 8px', color: '#ddd'}}>|</span>
       <a style={{color: '#ff4d4f'}} onClick={() => handleDelete(record)}>删除</a>
     </>
    },
  ];

  return (
    <div>
      <Button type="primary" style={{marginBottom: 16}} onClick={() => openEdit(null)}>
        <PlusOutlined /> 新增通知配置
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} size="small" />

      <Modal title={editRecord ? '编辑通知配置' : '新增通知配置'} open={modalVisible} onOk={handleSave}
             onCancel={() => setModalVisible(false)} width={700}>
        <Form form={form} layout="vertical" initialValues={{pass_rate: 80, channel_ids: [], receiver: [], group_ids: []}}>
          <Form.Item name="name" label="配置名称" rules={[{required: true}]}>
            <Input placeholder="例如：项目组通知" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="channel_ids" label="通知渠道" rules={[{required: true, message: '至少选一个渠道'}]}>
                <Select mode="multiple" placeholder="选择通知渠道">
                  {channels.map(c => <Option key={c.id} value={c.id}>
                    {c.name} (<Tag color={CHANNEL_TYPES[c.channel_type]?.color} style={{fontSize: 10}}>{c.channel_type_name}</Tag>)
                  </Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="template_id" label="通知模板">
                <Select allowClear placeholder="选择模板（可选）">
                  {templates.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="receiver" label="接收人">
                <UserSelect users={userList} mode="multiple" placeholder="选择接收人（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="group_ids" label="用户组">
                <Select mode="multiple" allowClear placeholder="选择用户组（可选）">
                  {groups.map(g => <Option key={g.id} value={g.id}>{g.name}({g.member_count}人)</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="pass_rate" label={<span>合格率阈值 <Tooltip title="低于此阈值时标记为失败"><QuestionCircleOutlined /></Tooltip></span>}>
            <InputNumber min={1} max={100} style={{width: 120}} addonAfter="%" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== 用户组 Tab ====================

const GroupTab = ({refreshKey}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [userList, setUserList] = useState([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    const res = await listNotificationGroups();
    if (res?.code === 0) setData(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    (async () => {
      const userRes = await listUsers({page: 1, size: 1000});
      if (Array.isArray(userRes)) setUserList(userRes);
    })();
  }, [refreshKey]);

  const handleSave = async () => {
    const values = await form.validateFields();
    const api = editRecord ? updateNotificationGroup : insertNotificationGroup;
    const res = await api(editRecord ? {...values, id: editRecord.id} : values);
    if (res?.code === 0) {
      message.success(editRecord ? '更新成功' : '创建成功');
      setModalVisible(false);
      fetchData();
    } else message.error(res?.msg || '操作失败');
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除', content: `删除用户组「${record.name}」？`,
      onOk: async () => {
        const res = await deleteNotificationGroup({id: record.id});
        if (res?.code === 0) { message.success('已删除'); fetchData(); }
      }
    });
  };

  const openEdit = async (record) => {
    if (record) {
      const res = await getNotificationGroupDetail({id: record.id});
      if (res?.code === 0) {
        form.setFieldsValue({
          name: res.data.name,
          description: res.data.description,
          members: res.data.members || [],
        });
      }
    } else {
      form.resetFields();
    }
    setEditRecord(record);
    setModalVisible(true);
  };

  const columns = [
    {title: '组名称', dataIndex: 'name', key: 'name'},
    {title: '描述', dataIndex: 'description', key: 'description', ellipsis: true},
    {title: '成员数', dataIndex: 'member_count', key: 'member_count', width: 80, align: 'center'},
    {title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160},
    {title: '操作', key: 'action', width: 120,
     render: (_, record) => <>
       <a onClick={() => openEdit(record)}>编辑</a>
       <span style={{margin: '0 8px', color: '#ddd'}}>|</span>
       <a style={{color: '#ff4d4f'}} onClick={() => handleDelete(record)}>删除</a>
     </>
    },
  ];

  return (
    <div>
      <Button type="primary" style={{marginBottom: 16}} onClick={() => openEdit(null)}>
        <PlusOutlined /> 新增用户组
      </Button>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={false} size="small" />

      <Modal title={editRecord ? '编辑用户组' : '新增用户组'} open={modalVisible} onOk={handleSave}
             onCancel={() => setModalVisible(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="组名称" rules={[{required: true}]}>
            <Input placeholder="例如：测试组" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
          <Form.Item name="members" label="成员">
            <UserSelect users={userList} mode="multiple" placeholder="选择组成员" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ==================== 主页面 ====================

const NotificationConfig = () => {
  const [activeTab, setActiveTab] = useState("channel");
  const [refreshKey, setRefreshKey] = useState(0);

  const onTabChange = (key) => {
    setActiveTab(key);
    setRefreshKey(k => k + 1);
  };

  return (
    <PageContainer title="通知配置" breadcrumb={null}>
      <Card>
        <Tabs activeKey={activeTab} onChange={onTabChange}>
          <Tabs.TabPane tab="通知渠道" key="channel">
            <ChannelTab refreshKey={refreshKey} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="通知模板" key="template">
            <TemplateTab refreshKey={refreshKey} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="通知配置" key="config">
            <ConfigTab refreshKey={refreshKey} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="用户组" key="group">
            <GroupTab refreshKey={refreshKey} />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </PageContainer>
  );
};

export default NotificationConfig;
