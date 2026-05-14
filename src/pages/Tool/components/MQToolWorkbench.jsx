import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Menu,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  Tree,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { connect } from '@umijs/max';
import {
  ApiOutlined,
  ClusterOutlined,
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';
import {
  consumeMQMessage,
  getKafkaConsumerGroupDetail,
  listKafkaConsumerGroups,
  listKafkaTopicPartitions,
  listKafkaTopicMessages,
  listKafkaTopics,
  listMQConfig,
  listRabbitQueues,
  publishMQMessage,
  rabbitDeleteQueue,
  rabbitGetMessages,
  rabbitPurgeQueue,
  testMQConnect,
} from '@/services/configure';

const { Option } = Select;

const typeTag = (type) => (
  type === 'rabbitmq' ? <Tag color="orange">RabbitMQ</Tag> : <Tag color="blue">Kafka</Tag>
);

const pretty = (value) => JSON.stringify(value || {}, null, 2);

const MQToolWorkbench = ({ gconfig, dispatch, loading: modelLoading, mqType, pageTitle }) => {
  const { envList, envMap } = gconfig;
  const [queryForm] = Form.useForm();
  const [publishForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const [rabbitGetForm] = Form.useForm();

  const [rows, setRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [activeResource, setActiveResource] = useState('overview');
  const [resultOpen, setResultOpen] = useState(false);
  const [resultTitle, setResultTitle] = useState('执行结果');
  const [resultText, setResultText] = useState('');
  const [kafkaTopics, setKafkaTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [topicVisibleCount, setTopicVisibleCount] = useState(50);
  const [topicMessages, setTopicMessages] = useState([]);
  const [topicKeyword, setTopicKeyword] = useState('');
  const [messageKeyword, setMessageKeyword] = useState('');
  const [topicPartitions, setTopicPartitions] = useState([]);
  const [selectedPartition, setSelectedPartition] = useState(null);
  const [topicNextBeforeOffset, setTopicNextBeforeOffset] = useState(null);
  const [topicHasMore, setTopicHasMore] = useState(false);
  const [topicLoadingMore, setTopicLoadingMore] = useState(false);
  const [kafkaConsumerGroups, setKafkaConsumerGroups] = useState([]);
  const [selectedConsumerGroup, setSelectedConsumerGroup] = useState('');
  const [consumerGroupVisibleCount, setConsumerGroupVisibleCount] = useState(50);
  const [consumerGroupDetail, setConsumerGroupDetail] = useState(null);
  const [brokers, setBrokers] = useState([]);
  const [rabbitQueues, setRabbitQueues] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [messageDetailOpen, setMessageDetailOpen] = useState(false);
  const [messageDetail, setMessageDetail] = useState(null);
  const [selectedConfigId, setSelectedConfigId] = useState(null);

  const isKafka = mqType === 'kafka';
  const endpoint = current ? `${current.host}:${current.port}` : '-';
  const selectedConfig = rows.find((item) => item.id === selectedConfigId) || null;

  const menuItems = useMemo(() => {
    if (isKafka) {
      return [
        { key: 'overview', icon: <ClusterOutlined />, label: 'Overview' },
        { key: 'topics', icon: <ApiOutlined />, label: 'Topics' },
        { key: 'consumers', icon: <InboxOutlined />, label: 'Consumers' },
        { key: 'publish', icon: <SendOutlined />, label: 'Publish' },
        { key: 'consume', icon: <EyeOutlined />, label: 'Consume' },
      ];
    }
    return [
      { key: 'overview', icon: <ClusterOutlined />, label: 'Overview' },
      { key: 'queues', icon: <InboxOutlined />, label: 'Queues' },
      { key: 'publish', icon: <SendOutlined />, label: 'Publish' },
      { key: 'getMessages', icon: <EyeOutlined />, label: 'Get messages' },
    ];
  }, [isKafka]);

  const fetchEnv = () => {
    dispatch({
      type: 'gconfig/fetchEnvList',
      payload: { page: 1, size: 1000, exactly: true },
    });
  };

  const fetchList = async () => {
    setTableLoading(true);
    const res = await listMQConfig({ ...queryForm.getFieldsValue(), mq_type: mqType });
    setTableLoading(false);
    if (auth.response(res)) setRows(res.data || []);
  };

  useEffect(() => {
    fetchEnv();
    fetchList();
  }, [mqType]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedConfigId(null);
      return;
    }
    if (!selectedConfigId || !rows.some((item) => item.id === selectedConfigId)) {
      setSelectedConfigId(rows[0].id);
    }
  }, [rows]);

  useEffect(() => {
    if (!isKafka) return;
    if (!selectedConfigId || current?.id === selectedConfigId) return;
    const target = rows.find((item) => item.id === selectedConfigId);
    if (target) {
      onConnect(target);
    }
  }, [isKafka, selectedConfigId, rows]);

  const initWorkspaceForms = (record) => {
    publishForm.resetFields();
    consumeForm.resetFields();
    rabbitGetForm.resetFields();
    publishForm.setFieldsValue({ destination: '', key: '', headers: '{}', body: '' });
    consumeForm.setFieldsValue({ destination: '', limit: 5, timeout_ms: 3000, group_id: 'argus-mq-preview' });
    rabbitGetForm.setFieldsValue({ destination: '', limit: 5, auto_ack: false });
    setKafkaTopics([]);
    setSelectedTopic('');
    setTopicVisibleCount(50);
    setTopicMessages([]);
    setTopicKeyword('');
    setMessageKeyword('');
    setTopicPartitions([]);
    setSelectedPartition(null);
    setTopicNextBeforeOffset(null);
    setTopicHasMore(false);
    setKafkaConsumerGroups([]);
    setSelectedConsumerGroup('');
    setConsumerGroupVisibleCount(50);
    setConsumerGroupDetail(null);
    setBrokers([]);
    setRabbitQueues([]);
    setActiveResource('overview');
    setCurrent(record);
  };

  const showResult = (title, data) => {
    setResultTitle(title);
    setResultText(typeof data === 'string' ? data : pretty(data));
    setResultOpen(true);
  };

  const onConnect = async (record) => {
    const res = await testMQConnect({ id: record.id });
    if (!auth.response(res, true)) {
      setWorkspaceOpen(false);
      return;
    }
    initWorkspaceForms(record);
    if (isKafka) {
      setWorkspaceOpen(false);
      return;
    }
    setWorkspaceOpen(true);
    if (mqType === 'rabbitmq') {
      setTimeout(() => onLoadRabbitQueues(record), 0);
    }
  };

  const onLoadKafkaTopics = async (record = current) => {
    if (!record) return;
    setResourceLoading(true);
    const res = await listKafkaTopics({ id: record.id });
    setResourceLoading(false);
    if (auth.response(res)) {
      const data = res.data || [];
      setKafkaTopics(data);
      if (data.length > 0) {
        const nextTopic = selectedTopic && data.some((item) => item.topic === selectedTopic) ? selectedTopic : data[0].topic;
        setSelectedTopic(nextTopic);
        await onLoadKafkaTopicPartitions(nextTopic, record);
        await onLoadKafkaTopicMessages(nextTopic, record);
      } else {
        setSelectedTopic('');
        setTopicMessages([]);
        setTopicPartitions([]);
        setSelectedPartition(null);
        setTopicNextBeforeOffset(null);
        setTopicHasMore(false);
      }
    }
  };

  const onLoadKafkaTopicPartitions = async (topic = selectedTopic, record = current) => {
    if (!record || !topic) return;
    const res = await listKafkaTopicPartitions({ id: record.id, topic });
    if (auth.response(res)) {
      const data = res.data || [];
      setTopicPartitions(data);
      if (data.length > 0) {
        const nextPartition = selectedPartition !== null && data.some((item) => item.partition === selectedPartition)
          ? selectedPartition
          : data[0].partition;
        setSelectedPartition(nextPartition);
      } else {
        setSelectedPartition(null);
      }
    }
  };

  const onLoadKafkaTopicMessages = async (topic = selectedTopic, record = current, beforeOffset = null) => {
    if (!record || !topic) return;
    setResourceLoading(true);
    const res = await listKafkaTopicMessages({
      id: record.id,
      topic,
      partition: selectedPartition,
      limit: 100,
      before_offset: beforeOffset,
    });
    setResourceLoading(false);
    if (auth.response(res)) {
      const data = res.data || {};
      const newRows = data.messages || [];
      if (beforeOffset === null || beforeOffset === undefined) {
        setTopicMessages(newRows);
      } else {
        setTopicMessages((prev) => [...prev, ...newRows]);
      }
      setTopicNextBeforeOffset(data.next_before_offset);
      setTopicHasMore(Boolean(data.has_more));
      if (data.partition !== null && data.partition !== undefined) {
        setSelectedPartition(data.partition);
      }
    }
  };

  const onLoadMoreKafkaTopicMessages = async (topic = selectedTopic, record = current) => {
    if (topicLoadingMore || !topicHasMore || topicNextBeforeOffset === null || topicNextBeforeOffset === undefined) return;
    setTopicLoadingMore(true);
    await onLoadKafkaTopicMessages(topic, record, topicNextBeforeOffset);
    setTopicLoadingMore(false);
  };

  const onMessageTableScroll = (event) => {
    const target = event?.currentTarget;
    if (!target || topicLoadingMore || !topicHasMore) return;
    const remain = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remain < 24) {
      onLoadMoreKafkaTopicMessages(selectedTopic);
    }
  };

  const onLoadKafkaConsumerGroups = async (record = current) => {
    if (!record) return;
    setResourceLoading(true);
    const res = await listKafkaConsumerGroups({ id: record.id });
    setResourceLoading(false);
    if (auth.response(res)) {
      const data = res.data || [];
      setKafkaConsumerGroups(data);
      if (data.length > 0) {
        const nextGroup = selectedConsumerGroup && data.some((item) => item.group_id === selectedConsumerGroup)
          ? selectedConsumerGroup
          : data[0].group_id;
        setSelectedConsumerGroup(nextGroup);
        onLoadConsumerGroupDetail(nextGroup, record);
      } else {
        setSelectedConsumerGroup('');
        setConsumerGroupDetail(null);
        setBrokers([]);
      }
    }
  };

  const onLoadConsumerGroupDetail = async (groupId = selectedConsumerGroup, record = current) => {
    if (!record || !groupId) return;
    setResourceLoading(true);
    const res = await getKafkaConsumerGroupDetail({ id: record.id, group_id: groupId });
    setResourceLoading(false);
    if (auth.response(res)) {
      setConsumerGroupDetail(res.data || null);
      setBrokers(res.data?.brokers || []);
    }
  };

  const onLoadRabbitQueues = async (record = current) => {
    if (!record) return;
    setResourceLoading(true);
    const res = await listRabbitQueues({ id: record.id });
    setResourceLoading(false);
    if (auth.response(res)) setRabbitQueues(res.data || []);
  };

  const onPublish = async () => {
    const values = await publishForm.validateFields();
    const res = await publishMQMessage({ ...values, id: current.id });
    if (auth.response(res, true)) showResult('发送结果', res.data);
  };

  const onConsume = async () => {
    const values = await consumeForm.validateFields();
    const res = await consumeMQMessage({ ...values, id: current.id });
    if (auth.response(res, true)) showResult('消费预览', res.data);
  };

  const onRabbitGet = async () => {
    const values = await rabbitGetForm.validateFields();
    const res = await rabbitGetMessages({
      id: current.id,
      queue: values.destination,
      count: values.limit,
      auto_ack: values.auto_ack,
      requeue: true,
    });
    if (auth.response(res, true)) showResult('Get messages', res.data);
  };

  const onPurgeQueue = async (queue) => {
    const res = await rabbitPurgeQueue({ id: current.id, queue });
    if (auth.response(res, true)) onLoadRabbitQueues();
  };

  const onDeleteQueue = async (queue) => {
    const res = await rabbitDeleteQueue({ id: current.id, queue });
    if (auth.response(res, true)) onLoadRabbitQueues();
  };

  const refreshActiveResource = async () => {
    if (!current) return;
    if (activeResource === 'topics') {
      await onLoadKafkaTopics();
      return;
    }
    if (activeResource === 'queues') {
      await onLoadRabbitQueues();
      return;
    }
    if (activeResource === 'consumers') {
      await onLoadKafkaConsumerGroups();
    }
  };

  const onSwitchResource = async (key) => {
    setActiveResource(key);
    if (key === 'topics') {
      await onLoadKafkaTopics();
      return;
    }
    if (key === 'consumers') {
      await onLoadKafkaConsumerGroups();
      return;
    }
    if (key === 'queues') {
      await onLoadRabbitQueues();
    }
  };

  const openMessageDetail = (record) => {
    setMessageDetail(record);
    setMessageDetailOpen(true);
  };

  const onTopicListScroll = (event) => {
    const target = event?.currentTarget;
    if (!target) return;
    const remain = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remain < 24 && topicVisibleCount < filteredTopics.length) {
      setTopicVisibleCount((count) => Math.min(count + 50, filteredTopics.length));
    }
  };

  const filteredTopics = (kafkaTopics || []).filter((item) => {
    if (!topicKeyword) return true;
    return String(item.topic || '').toLowerCase().includes(topicKeyword.toLowerCase());
  });

  const filteredMessages = (topicMessages || []).filter((item) => {
    if (!messageKeyword) return true;
    const text = `${item.message || ''} ${item.message_preview || ''} ${item.key || ''} ${item.offset || ''} ${item.timestamp || ''}`;
    return text.toLowerCase().includes(messageKeyword.toLowerCase());
  });

  const columns = [
    { title: '环境', key: 'env', dataIndex: 'env', width: 120, render: (env) => envMap[env] || env },
    { title: '名称', key: 'name', dataIndex: 'name', width: 180 },
    { title: '地址', key: 'endpoint', width: 220, render: (_, record) => `${record.host}:${record.port}` },
    { title: '用户名', key: 'username', dataIndex: 'username', width: 140, render: (value) => value || '-' },
    { title: 'Virtual Host', key: 'virtual_host', dataIndex: 'virtual_host', width: 130, render: (value) => value || '-' },
    {
      title: '操作',
      key: 'ops',
      width: 140,
      render: (_, record) => (
        <Button size="small" type="primary" icon={<ThunderboltOutlined />} onClick={() => onConnect(record)}>连接</Button>
      ),
    },
  ];

  const kafkaTreeData = useMemo(() => {
    const envGroup = {};
    (rows || []).forEach((item) => {
      const envKey = `env-${item.env}`;
      if (!envGroup[envKey]) {
        envGroup[envKey] = {
          title: envMap[item.env] || `环境${item.env}`,
          key: envKey,
          selectable: false,
          children: [],
        };
      }
      envGroup[envKey].children.push({
        title: `${item.name} (${item.host}:${item.port})`,
        key: `cfg-${item.id}`,
        isLeaf: true,
      });
    });
    return Object.values(envGroup);
  }, [rows, envMap]);

  const renderKafkaHome = () => (
    <Row gutter={12}>
      <Col flex="0 0 20%" style={{ display: 'table-cell' }}>
        <Card
          size="small"
          title="Kafka连接列表"
          bodyStyle={{ height: 676, overflowY: 'auto', padding: 8 }}
        >
          <Tree
            showLine
            blockNode
            defaultExpandAll
            treeData={kafkaTreeData}
            selectedKeys={selectedConfigId ? [`cfg-${selectedConfigId}`] : []}
            onSelect={(keys) => {
              const key = (keys && keys[0]) || '';
              if (typeof key === 'string' && key.startsWith('cfg-')) {
                const configId = parseInt(key.replace('cfg-', ''), 10);
                setSelectedConfigId(configId);
                const target = rows.find((item) => item.id === configId);
                if (target) {
                  onConnect(target);
                }
              }
            }}
          />
        </Card>
      </Col>
      <Col flex="0 0 80%" style={{ display: 'table-cell' }}>
        {current ? (
          <Layout style={{ minHeight: 676, background: '#fff' }}>
            <Layout.Content style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Tabs
                  activeKey={activeResource}
                  onChange={onSwitchResource}
                  items={menuItems.map((item) => ({ key: item.key, label: item.label }))}
                  size="small"
                  style={{ marginBottom: 0 }}
                />
                <Button
                  icon={<ReloadOutlined />}
                  loading={resourceLoading}
                  onClick={refreshActiveResource}
                  size="small"
                >
                  Refresh
                </Button>
              </div>
              {renderResource()}
            </Layout.Content>
          </Layout>
        ) : (
          <Card size="small" bodyStyle={{ height: 676, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="点击左侧连接节点后将自动连接并展示工具区" />
          </Card>
        )}
      </Col>
    </Row>
  );

  const renderOverview = () => (
    <Card size="small" title="连接信息" bordered={false}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="名称">{current?.name}</Descriptions.Item>
        <Descriptions.Item label="类型">{typeTag(current?.mq_type)}</Descriptions.Item>
        <Descriptions.Item label="环境">{envMap[current?.env] || current?.env}</Descriptions.Item>
        <Descriptions.Item label="地址">{endpoint}</Descriptions.Item>
        <Descriptions.Item label="用户名">{current?.username || '-'}</Descriptions.Item>
        <Descriptions.Item label="Virtual Host">{current?.virtual_host || '-'}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{current?.description || '-'}</Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const renderKafkaTopics = () => (
    <Card size="small" bordered={false}>
      <Row gutter={12}>
        <Col span={6}>
          <div
            style={{ height: 620, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}
            onScroll={onTopicListScroll}
          >
            <div style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
              <Input
                allowClear
                size="small"
                placeholder="搜索 Topic"
                value={topicKeyword}
                onChange={(event) => {
                  setTopicKeyword(event.target.value || '');
                  setTopicVisibleCount(50);
                }}
              />
            </div>
            <List
              size="small"
              dataSource={filteredTopics.slice(0, topicVisibleCount)}
              renderItem={(item) => (
                <List.Item
                  onClick={() => {
                    setSelectedTopic(item.topic);
                    onLoadKafkaTopicPartitions(item.topic).then(() => onLoadKafkaTopicMessages(item.topic));
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: '10px 12px',
                    background: selectedTopic === item.topic ? '#eef6ff' : '#fff',
                    borderLeft: selectedTopic === item.topic ? '3px solid #1677ff' : '3px solid transparent',
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{item.topic}</div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </Col>
        <Col span={18}>
          {selectedTopic ? (
            <Card
              size="small"
              title={selectedTopic}
              extra={(
                <Space>
                  <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => {
                    publishForm.setFieldsValue({ destination: selectedTopic });
                    setActiveResource('publish');
                  }}>发送消息</Button>
                </Space>
              )}
            >
              <Space style={{ marginBottom: 12 }}>
                <span>分页游标: {topicNextBeforeOffset ?? '-'}</span>
                <span>分区</span>
                <Select
                  style={{ width: 220 }}
                  value={selectedPartition}
                  options={(topicPartitions || []).map((item) => ({
                    label: `P${item.partition} (latest: ${item.latest_offset})`,
                    value: item.partition,
                  }))}
                  onChange={(value) => {
                    setSelectedPartition(value);
                    setTopicNextBeforeOffset(null);
                    setTopicHasMore(false);
                    onLoadKafkaTopicMessages(selectedTopic, current, null);
                  }}
                />
                <Input
                  allowClear
                  style={{ width: 260 }}
                  placeholder="搜索消息/offset/key/timestamp"
                  value={messageKeyword}
                  onChange={(event) => setMessageKeyword(event.target.value || '')}
                />
              </Space>
              <Table
                size="small"
                loading={resourceLoading}
                rowKey={(row) => `${row.partition}-${row.offset}-${row.timestamp_ms}`}
                dataSource={filteredMessages}
                pagination={false}
                scroll={{ y: 500 }}
                onScroll={onMessageTableScroll}
                columns={[
                  { title: 'Partition', dataIndex: 'partition', key: 'partition', width: 90 },
                  { title: 'Offset', dataIndex: 'offset', key: 'offset', width: 120, sorter: (a, b) => Number(a.offset || 0) - Number(b.offset || 0), defaultSortOrder: 'descend' },
                  {
                    title: 'Message',
                    dataIndex: 'message_preview',
                    key: 'message_preview',
                    ellipsis: true,
                    render: (value, row) => (
                      <a onClick={() => openMessageDetail(row)}>{value || row.message || '-'}</a>
                    ),
                  },
                  { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 180, sorter: (a, b) => Number(a.timestamp_ms || 0) - Number(b.timestamp_ms || 0) },
                ]}
              />
            </Card>
          ) : <Empty description="请选择Topic" />}
        </Col>
      </Row>
    </Card>
  );

  const renderConsumers = () => (
    <Card size="small" title="Consumers" bordered={false}>
      <Row gutter={12}>
        <Col span={6}>
          <div style={{ height: 620, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 6 }}>
            <List
              size="small"
              dataSource={kafkaConsumerGroups.slice(0, consumerGroupVisibleCount)}
              renderItem={(item) => (
                <List.Item
                  onClick={() => {
                    setSelectedConsumerGroup(item.group_id);
                    onLoadConsumerGroupDetail(item.group_id);
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: '10px 12px',
                    background: selectedConsumerGroup === item.group_id ? '#eef6ff' : '#fff',
                    borderLeft: selectedConsumerGroup === item.group_id ? '3px solid #1677ff' : '3px solid transparent',
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{item.group_id}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                      {item.state} / {item.members} members
                    </div>
                  </div>
                </List.Item>
              )}
            />
            {consumerGroupVisibleCount < kafkaConsumerGroups.length ? (
              <div style={{ padding: 12, textAlign: 'center' }}>
                <Button size="small" onClick={() => setConsumerGroupVisibleCount((count) => count + 50)}>加载更多 50 条</Button>
              </div>
            ) : null}
          </div>
        </Col>
        <Col span={18}>
          {selectedConsumerGroup ? (
            <>
              <Descriptions size="small" bordered column={2} style={{ marginBottom: 12 }}>
                <Descriptions.Item label="Group">{selectedConsumerGroup}</Descriptions.Item>
                <Descriptions.Item label="State">{consumerGroupDetail?.state || '-'}</Descriptions.Item>
                <Descriptions.Item label="Protocol">{consumerGroupDetail?.protocol_type || '-'}</Descriptions.Item>
                <Descriptions.Item label="Members">{(consumerGroupDetail?.members || []).length}</Descriptions.Item>
              </Descriptions>
              <Row gutter={12} style={{ marginBottom: 12 }}>
                <Col span={8}><Card size="small"><Descriptions size="small" column={1}><Descriptions.Item label="Brokers">{brokers.length}</Descriptions.Item></Descriptions></Card></Col>
                <Col span={8}><Card size="small"><Descriptions size="small" column={1}><Descriptions.Item label="Partitions">{(consumerGroupDetail?.rows || []).length}</Descriptions.Item></Descriptions></Card></Col>
                <Col span={8}><Card size="small"><Descriptions size="small" column={1}><Descriptions.Item label="Total Lag">{(consumerGroupDetail?.rows || []).reduce((sum, item) => sum + Number(item.lag || 0), 0)}</Descriptions.Item></Descriptions></Card></Col>
              </Row>
                <Table
                  size="small"
                  loading={resourceLoading}
                  rowKey={(r) => `${r.topic}-${r.partition}`}
                  dataSource={consumerGroupDetail?.rows || []}
                  pagination={false}
                  scroll={{ x: 1200 }}
                  columns={[
                  { title: 'Topic', dataIndex: 'topic', key: 'topic', ellipsis: true, width: 280 },
                  { title: 'Partition', dataIndex: 'partition', key: 'partition', width: 88 },
                  { title: 'Start', dataIndex: 'start', key: 'start', width: 96 },
                  { title: 'End', dataIndex: 'end', key: 'end', width: 96 },
                  { title: 'Offset', dataIndex: 'offset', key: 'offset', width: 96 },
                  { title: 'Lag', dataIndex: 'lag', key: 'lag', width: 88, sorter: (a, b) => Number(a.lag || 0) - Number(b.lag || 0) },
                  { title: 'Last Commit Time', dataIndex: 'last_commit_time', key: 'last_commit_time', width: 168 },
                  {
                    title: '操作',
                    key: 'ops',
                    width: 100,
                    render: (_, row) => (
                      <a onClick={() => {
                        setActiveResource('topics');
                        setSelectedTopic(row.topic);
                        onLoadKafkaTopicPartitions(row.topic).then(() => onLoadKafkaTopicMessages(row.topic, current, null));
                      }}>看消息</a>
                    ),
                  },
                ]}
              />
            </>
          ) : <Empty description="暂无消费组" />}
        </Col>
      </Row>
    </Card>
  );

  const renderRabbitQueues = () => (
    <Card size="small" title="Queues" bordered={false}>
      <Table
        size="small"
        loading={resourceLoading}
        rowKey={(r) => `${r.vhost}-${r.name}`}
        dataSource={rabbitQueues}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Queue', dataIndex: 'name', key: 'name', ellipsis: true },
          { title: 'Consumers', dataIndex: 'consumers', key: 'consumers', width: 100 },
          { title: 'Ready', dataIndex: 'messages_ready', key: 'messages_ready', width: 100, sorter: (a, b) => Number(a.messages_ready || 0) - Number(b.messages_ready || 0) },
          { title: 'Unacked', dataIndex: 'messages_unacknowledged', key: 'messages_unacknowledged', width: 110 },
          { title: 'Total', dataIndex: 'messages', key: 'messages', width: 100 },
          {
            title: '操作',
            key: 'ops',
            width: 210,
            render: (_, row) => (
              <Space>
                <a onClick={() => {
                  rabbitGetForm.setFieldsValue({ destination: row.name, limit: 5, auto_ack: false });
                  setActiveResource('getMessages');
                }}>Get</a>
                <a onClick={() => {
                  publishForm.setFieldsValue({ destination: row.name });
                  setActiveResource('publish');
                }}>Publish</a>
                <a onClick={() => onPurgeQueue(row.name)}>Purge</a>
                <a onClick={() => onDeleteQueue(row.name)}>Delete</a>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );

  const renderPublish = () => (
    <Card size="small" title="Publish" bordered={false}>
      <Form form={publishForm} layout="vertical">
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label={isKafka ? 'Topic' : 'Queue'} name="destination" rules={[{ required: true, message: '请输入目标' }]}>
              <Input placeholder={isKafka ? 'topic_name' : 'queue_name'} />
            </Form.Item>
          </Col>
          {isKafka ? (
            <Col span={12}>
              <Form.Item label="Key" name="key">
                <Input placeholder="可选" />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
        {isKafka ? (
          <Form.Item label="Headers(JSON)" name="headers">
            <Input.TextArea rows={3} placeholder='{"trace_id":"xxx"}' />
          </Form.Item>
        ) : null}
        <Form.Item label="Body" name="body" rules={[{ required: true, message: '请输入消息体' }]}>
          <Input.TextArea rows={10} placeholder="支持JSON或纯文本" />
        </Form.Item>
        <Button type="primary" icon={<SendOutlined />} onClick={onPublish}>发送</Button>
      </Form>
    </Card>
  );

  const renderConsume = () => (
    <Card size="small" title="Consume" bordered={false}>
      <Form form={consumeForm} layout="vertical">
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Topic" name="destination" rules={[{ required: true, message: '请输入Topic' }]}>
              <Input placeholder="topic_name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Consumer Group" name="group_id">
              <Input placeholder="argus-mq-preview" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Limit" name="limit">
              <InputNumber min={1} max={50} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Timeout(ms)" name="timeout_ms">
              <InputNumber min={1000} max={10000} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" icon={<EyeOutlined />} onClick={onConsume}>消费预览</Button>
      </Form>
    </Card>
  );

  const renderRabbitGet = () => (
    <Card size="small" title="Get messages" bordered={false}>
      <Form form={rabbitGetForm} layout="vertical">
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Queue" name="destination" rules={[{ required: true, message: '请输入Queue' }]}>
              <Input placeholder="queue_name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Count" name="limit">
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" icon={<EyeOutlined />} onClick={onRabbitGet}>Get messages</Button>
      </Form>
    </Card>
  );

  const renderResource = () => {
    if (activeResource === 'overview') return renderOverview();
    if (activeResource === 'topics') return renderKafkaTopics();
    if (activeResource === 'consumers') return renderConsumers();
    if (activeResource === 'queues') return renderRabbitQueues();
    if (activeResource === 'publish') return renderPublish();
    if (activeResource === 'consume') return renderConsume();
    if (activeResource === 'getMessages') return renderRabbitGet();
    return <Empty />;
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <Card>
        {isKafka ? renderKafkaHome() : (
          <>
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
                  <Form.Item label="主机" name="host">
                    <Input placeholder="输入主机地址" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          <Table
            rowKey={(record) => record.id}
            columns={columns}
            dataSource={rows}
            loading={tableLoading || modelLoading.effects['gconfig/fetchEnvList']}
            scroll={{ x: 900 }}
          />
          </>
        )}
      </Card>

      {!isKafka && <Drawer
        title={current ? `${current.name} (${endpoint})` : '连接会话'}
        width={1680}
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        extra={current ? <Space>{typeTag(current.mq_type)}</Space> : null}
      >
        {!current ? <Empty /> : (
          <Layout style={{ minHeight: 620, background: '#fff' }}>
            <Layout.Content style={{ paddingRight: 16 }}>
              {renderResource()}
            </Layout.Content>
            <Layout.Sider width={260} theme="light" style={{ borderLeft: '1px solid #f0f0f0' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
                <Button
                  block
                  icon={<ReloadOutlined />}
                  loading={resourceLoading}
                  onClick={refreshActiveResource}
                >
                  Refresh
                </Button>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[activeResource]}
                items={menuItems}
                onClick={({ key }) => {
                  onSwitchResource(key);
                }}
              />
              </Layout.Sider>
          </Layout>
        )}
      </Drawer>
      }

      <Modal title={resultTitle} width={780} open={resultOpen} footer={null} onCancel={() => setResultOpen(false)}>
        <pre style={{ margin: 0, maxHeight: 540, overflow: 'auto' }}>{resultText || '暂无结果'}</pre>
      </Modal>

      <Modal
        title={messageDetail ? `消息详情 - ${messageDetail.topic || selectedTopic}` : '消息详情'}
        width={860}
        open={messageDetailOpen}
        footer={null}
        onCancel={() => setMessageDetailOpen(false)}
      >
        {!messageDetail ? <Empty description="暂无消息" /> : (
          <>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Partition">{messageDetail.partition ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Offset">{messageDetail.offset ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Timestamp">{messageDetail.timestamp || '-'}</Descriptions.Item>
              <Descriptions.Item label="Key">{messageDetail.key || '-'}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="Headers" style={{ marginBottom: 12 }}>
              <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto' }}>{pretty(messageDetail.headers || {})}</pre>
            </Card>
            <Card size="small" title="Message">
              <pre style={{ margin: 0, maxHeight: 360, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {messageDetail.message || '-'}
              </pre>
            </Card>
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default connect(({ gconfig, loading }) => ({ gconfig, loading }))(MQToolWorkbench);
