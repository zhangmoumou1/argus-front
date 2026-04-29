import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  deleteFunctionalCaseSkillDoc,
  insertFunctionalCaseSkillDoc,
  listFunctionalCaseSkillDocs,
  updateFunctionalCaseSkillDoc,
} from '@/services/functionalCase';

const DOC_TYPE_OPTIONS = [
  { label: '技能文档', value: 'skill_md' },
  { label: '普通文档', value: 'normal_md' },
];

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('pityUser') || '{}');
  } catch (error) {
    return {};
  }
};

const FunctionalSkill = () => {
  const currentUser = useMemo(() => readCurrentUser(), []);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [form] = Form.useForm();

  const loadDocs = async (title = keyword) => {
    setLoading(true);
    try {
      const res = await listFunctionalCaseSkillDocs({ title });
      if (res?.code !== 0) {
        throw new Error(res?.msg || '获取用例技能失败');
      }
      setDocs(res?.data || []);
    } catch (error) {
      message.error(error?.message || '获取用例技能失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs('');
  }, []);

  const openCreateModal = () => {
    setEditingRecord(null);
    setModalMode('create');
    form.setFieldsValue({
      title: '',
      description: '',
      doc_type: 'skill_md',
      is_shared: true,
      content: '',
    });
    setModalOpen(true);
  };

  const openViewModal = (record) => {
    setEditingRecord(record);
    setModalMode('view');
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      doc_type: record.doc_type,
      is_shared: Boolean(record.is_shared),
      content: record.content,
    });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setModalMode('edit');
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      doc_type: record.doc_type,
      is_shared: Boolean(record.is_shared),
      content: record.content,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (modalMode === 'view') {
      setModalOpen(false);
      return;
    }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        is_shared: values.is_shared ? 1 : 0,
      };
      const res = editingRecord
        ? await updateFunctionalCaseSkillDoc({ ...payload, id: editingRecord.id })
        : await insertFunctionalCaseSkillDoc(payload);
      if (res?.code !== 0) {
        throw new Error(res?.msg || '保存失败');
      }
      message.success(editingRecord ? '更新成功' : '创建成功');
      setModalOpen(false);
      await loadDocs();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      message.error(error?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      const res = await deleteFunctionalCaseSkillDoc({ id: record.id });
      if (res?.code !== 0) {
        throw new Error(res?.msg || '删除失败');
      }
      message.success('删除成功');
      await loadDocs();
    } catch (error) {
      message.error(error?.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'doc_type',
      key: 'doc_type',
      width: 120,
      render: (value) => (
        <Tag color={value === 'skill_md' ? 'blue' : 'green'}>
          {value === 'skill_md' ? '技能文档' : '普通文档'}
        </Tag>
      ),
    },
    {
      title: '可见性',
      dataIndex: 'is_shared',
      key: 'is_shared',
      width: 100,
      render: (value) => (value ? <Tag color="gold">公共</Tag> : <Tag>私有</Tag>),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: '创建人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => {
        const editable = Number(record.create_user) === Number(currentUser?.id);
        return (
          <Space>
            <Button size="small" onClick={() => openViewModal(record)}>
              查看
            </Button>
            {editable ? (
              <Button size="small" type="primary" ghost onClick={() => openEditModal(record)}>
                编辑
              </Button>
            ) : null}
            {editable ? (
              <Popconfirm title="确认删除该文档吗？" onConfirm={() => handleDelete(record)}>
                <Button size="small" danger>
                  删除
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: '用例技能',
        ghost: true,
      }}
    >
      <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }} wrap>
          <Space wrap>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="按文档名称搜索"
              style={{ width: 260 }}
              allowClear
            />
            <Button onClick={() => loadDocs(keyword)}>搜索</Button>
          </Space>
          <Button type="primary" onClick={openCreateModal}>
            新增文档
          </Button>
        </Space>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={docs} pagination={{ pageSize: 10 }} />
      </div>

      <Modal
        title={modalMode === 'create' ? '新增文档' : modalMode === 'edit' ? '编辑文档' : '查看文档'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={900}
        okText={modalMode === 'view' ? '关闭' : '保存'}
        okButtonProps={{ disabled: modalMode !== 'view' && editingRecord && Number(editingRecord.create_user) !== Number(currentUser?.id) }}
      >
        <Form form={form} layout="vertical" disabled={modalMode === 'view'}>
          <Form.Item name="title" label="文档名称" rules={[{ required: true, message: '请输入文档名称' }]}>
            <Input placeholder="请输入文档名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入备注说明，便于区分文档用途" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="doc_type" label="文档类型" rules={[{ required: true, message: '请选择文档类型' }]}>
            <Select options={DOC_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="is_shared" label="可见性" valuePropName="checked">
            <Switch checkedChildren="公共" unCheckedChildren="私有" />
          </Form.Item>
          <Form.Item name="content" label="文档内容" rules={[{ required: true, message: '请输入文档内容' }]}>
            <Input.TextArea rows={20} placeholder="请输入 Markdown 内容" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default FunctionalSkill;
