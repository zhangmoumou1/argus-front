import React, { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, DatePicker, Form, Input, Select, Space, Table, Tag, message } from 'antd';
import { connect, history, useModel } from '@umijs/max';
import dayjs from 'dayjs';
import auth from '@/utils/auth';
import { listUserOperationLog, listUsers } from '@/services/user';

const { RangePicker } = DatePicker;

const OPERATION_TYPE = {
  0: '添加',
  1: '更新',
  2: '删除',
  3: '执行',
  4: '终止',
};

const normalizeUsers = (rows = []) => {
  const map = {};
  const options = [];
  rows.forEach((item) => {
    const label = item?.name || item?.username || String(item?.id || '');
    map[String(item.id)] = label;
    options.push({ label, value: item.id });
  });
  return { map, options };
};

const OperationLogPage = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser || {};
  const isSuperAdmin = Number(currentUser?.role) === 2;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [rows, setRows] = useState([]);

  const fetchUsers = async () => {
    const res = await listUsers();
    if (Array.isArray(res)) {
      const { map, options } = normalizeUsers(res);
      setUserMap(map);
      setUserOptions(options);
    }
  };

  const fetchLogs = async (values = {}) => {
    setLoading(true);
    try {
      const payload = {};
      if (values.tag) payload.tag = values.tag;
      if (values.user_id) payload.user_id = values.user_id;
      if (Array.isArray(values.operate_time) && values.operate_time.length === 2) {
        payload.start_time = values.operate_time[0].format('YYYY-MM-DD HH:mm:ss');
        payload.end_time = values.operate_time[1].format('YYYY-MM-DD HH:mm:ss');
      }
      const res = await listUserOperationLog(payload);
      if (auth.response(res)) {
        setRows(Array.isArray(res.data) ? res.data : []);
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      message.warning('仅超级管理员可查看操作日志');
      history.replace('/dashboard/workspace');
      return;
    }
    fetchUsers();
    const defaultRange = [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')];
    form.setFieldsValue({ operate_time: defaultRange });
    fetchLogs({
      operate_time: defaultRange,
    });
  }, [isSuperAdmin]);

  const tagOptions = useMemo(() => {
    const tags = new Set();
    rows.forEach((item) => {
      if (item?.tag) tags.add(item.tag);
    });
    return Array.from(tags).map((tag) => ({ label: tag, value: tag }));
  }, [rows]);

  const columns = [
    {
      title: '对象',
      dataIndex: 'tag',
      width: 160,
      render: (value) => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: '操作用户',
      dataIndex: 'user_id',
      width: 160,
      render: (value) => userMap[String(value)] || `用户${value || '-'}`,
    },
    {
      title: '操作类型',
      dataIndex: 'mode',
      width: 110,
      render: (value) => OPERATION_TYPE[value] || value || '-',
    },
    {
      title: '内容',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '操作时间',
      dataIndex: 'operate_time',
      width: 180,
      sorter: (a, b) => String(a?.operate_time || '').localeCompare(String(b?.operate_time || '')),
    },
  ];

  const onSearch = async (values) => {
    await fetchLogs(values);
  };

  const onReset = async () => {
    const defaultRange = [dayjs().subtract(6, 'day').startOf('day'), dayjs().endOf('day')];
    form.resetFields();
    form.setFieldsValue({ operate_time: defaultRange });
    await fetchLogs({
      operate_time: defaultRange,
    });
  };

  const expandedRowRender = (record) => {
    let desc = null;
    try {
      desc = JSON.parse(record.description || '[]');
    } catch (e) {
      desc = [];
    }
    return (
      <div style={{ paddingLeft: 24 }}>
        <div style={{ marginBottom: 8, color: '#64748b' }}>
          <strong>对象：</strong>
          {record.tag || '-'}{' '}
          <strong style={{ marginLeft: 16 }}>用户：</strong>
          {userMap[String(record.user_id)] || `用户${record.user_id || '-'}`}
        </div>
        {Array.isArray(desc) && desc.length > 0 ? (
          desc.map((item, index) => (
            <div key={`${record.id}-${index}`} style={{ marginBottom: 6 }}>
              <span style={{ color: '#1677ff' }}>{item.name}：</span>
              <span>{String(item.old ?? '') ? `${item.old} -> ` : ''}</span>
              <strong>{String(item.now ?? '')}</strong>
            </div>
          ))
        ) : (
          <div>未发生变动</div>
        )}
      </div>
    );
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <Card title="操作日志">
        <Form form={form} layout="inline" onFinish={onSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="tag" label="对象">
            <Select
              showSearch
              allowClear
              placeholder="请选择对象"
              style={{ width: 180 }}
              options={tagOptions}
            />
          </Form.Item>
          <Form.Item name="operate_time" label="操作时间">
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: 360 }}
            />
          </Form.Item>
          <Form.Item name="user_id" label="操作用户">
            <Select
              showSearch
              allowClear
              placeholder="请选择用户"
              style={{ width: 220 }}
              options={userOptions}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={onReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(OperationLogPage);
