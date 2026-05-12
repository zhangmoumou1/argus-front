import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Empty,
  Input,
  Modal,
  Form,
  Table,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
} from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  PlusOutlined,
  ShareAltOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  FolderOpenOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { history, useLocation, useModel } from '@umijs/max';
import {
  deleteKnowledge,
  listKnowledge,
  listKnowledgeCategory,
  insertKnowledgeCategory,
  updateKnowledgeCategory,
  deleteKnowledgeCategory,
} from '@/services/configure';
import { ensureHtml } from './store';
import './index.less';

const PAGE_SIZE = 1000;

const normalizeCategory = (doc) => {
  const explicit = doc?.category || doc?.catalog || doc?.group || doc?.module;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim();
  }
  const title = String(doc?.title || '').trim();
  if (title.includes('：')) {
    return title.split('：')[0].trim() || '未分类';
  }
  if (title.includes('-')) {
    return title.split('-')[0].trim() || '未分类';
  }
  return '未分类';
};

const getShareLink = (id) => `${window.location.origin}${window.location.pathname}#/knowledge?id=${id}`;

const KnowledgeBase = () => {
  const { initialState } = useModel('@@initialState');
  const location = useLocation();
  const currentUser = initialState?.currentUser;
  const isSuperAdmin = Number(currentUser?.role) === 2;

  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [activeId, setActiveId] = useState(null);

  // 分类管理状态
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [categoryForm] = Form.useForm();

  const fetchDocs = async (title = '') => {
    setLoading(true);
    try {
      const res = await listKnowledge({ page: 1, size: PAGE_SIZE, title });
      if (res?.code === 0) {
        const list = Array.isArray(res.data) ? res.data : [];
        setDocs(list);
        if (list.length === 0) {
          setActiveId(null);
          return;
        }
        const query = new URLSearchParams(location.search);
        const queryId = query.get('id');
        const hit = list.find((item) => String(item.id) === String(queryId));
        setActiveId((prev) => {
          if (prev && list.some((item) => String(item.id) === String(prev))) {
            return prev;
          }
          return hit ? hit.id : list[0].id;
        });
      } else {
        message.error(res?.msg || '获取知识库列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(searchTitle);
  }, [location.search]);

  const grouped = useMemo(() => {
    const map = new Map();
    docs.forEach((doc) => {
      const category = normalizeCategory(doc);
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category).push(doc);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [docs]);

  const activeDoc = useMemo(
    () => docs.find((item) => String(item.id) === String(activeId)) || null,
    [docs, activeId],
  );

  const handleSearch = (value) => {
    const title = String(value || '').trim();
    setSearchTitle(title);
    fetchDocs(title);
  };

  const handleDelete = async (id) => {
    const res = await deleteKnowledge({ id });
    if (res?.code === 0) {
      message.success('删除成功');
      await fetchDocs(searchTitle);
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const handleShare = async (doc) => {
    const link = getShareLink(doc.id);
    try {
      await navigator.clipboard.writeText(link);
      message.success('分享链接已复制');
    } catch (e) {
      message.warning('复制失败，请手动复制地址栏链接');
    }
  };

  // 分类管理方法
  const fetchCategories = async () => {
    setCategoryLoading(true);
    try {
      const res = await listKnowledgeCategory();
      if (res?.code === 0) {
        setCategories(Array.isArray(res.data) ? res.data : []);
      } else {
        message.error(res?.msg || '获取分类失败');
      }
    } finally {
      setCategoryLoading(false);
    }
  };

  const openCategoryModal = () => {
    setCategoryModalVisible(true);
    fetchCategories();
  };

  const handleDeleteCategory = async (id) => {
    const res = await deleteKnowledgeCategory({ id });
    if (res?.code === 0) {
      message.success('删除成功');
      fetchCategories();
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const openCategoryForm = (record = null) => {
    setCategoryEditing(record);
    setCategoryFormVisible(true);
    if (record) {
      categoryForm.setFieldsValue({ name: record.name, sort_order: record.sort_order });
    } else {
      categoryForm.resetFields();
    }
  };

  const handleCategoryFormSubmit = async () => {
    try {
      const values = await categoryForm.validateFields();
      setCategoryFormLoading(true);
      const payload = categoryEditing ? { ...values, id: categoryEditing.id } : values;
      const res = categoryEditing
        ? await updateKnowledgeCategory(payload)
        : await insertKnowledgeCategory(payload);
      if (res?.code === 0) {
        message.success(categoryEditing ? '修改成功' : '新增成功');
        setCategoryFormVisible(false);
        fetchCategories();
      } else {
        message.error(res?.msg || '操作失败');
      }
    } catch (e) {
      // validation error
    } finally {
      setCategoryFormLoading(false);
    }
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="knowledge-docs">
        <aside className="knowledge-docs__sidebar">
          <div className="knowledge-docs__sidebar-top">
            <Input.Search
              allowClear
              placeholder="搜索文档标题"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            {isSuperAdmin ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => history.push('/knowledge/create')} block>
                  新增文档
                </Button>
                <Button icon={<TagsOutlined />} onClick={openCategoryModal} block>
                  分类管理
                </Button>
              </Space>
            ) : (
              <Tag color="blue">只读模式</Tag>
            )}
          </div>

          <Spin spinning={loading}>
            {grouped.length === 0 ? (
              <Empty description="暂无文档" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="knowledge-docs__menu">
                {grouped.map((group) => (
                  <div key={group.category} className="knowledge-docs__group">
                    <div className="knowledge-docs__group-title">
                      <FolderOpenOutlined />
                      <span>{group.category}</span>
                    </div>
                    <div className="knowledge-docs__group-list">
                      {group.items.map((doc) => {
                        const active = String(doc.id) === String(activeId);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            className={`knowledge-docs__item ${active ? 'is-active' : ''}`}
                            onClick={() => {
                              setActiveId(doc.id);
                              history.replace(`/knowledge?id=${doc.id}`);
                            }}
                          >
                            {doc.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Spin>
        </aside>

        <section className="knowledge-docs__content">
          {!activeDoc ? (
            <Empty description="请选择文档查看内容" />
          ) : (
            <>
              <div className="knowledge-docs__content-head">
                <div>
                  <h1>{activeDoc.title}</h1>
                  <p>{activeDoc.summary || '暂无摘要'}</p>
                </div>
                <Space>
                  <Tooltip title="复制分享链接">
                    <Button icon={<ShareAltOutlined />} onClick={() => handleShare(activeDoc)}>
                      分享
                    </Button>
                  </Tooltip>
                  {isSuperAdmin && (
                    <>
                      <Button icon={<EditOutlined />} onClick={() => history.push(`/knowledge/edit/${activeDoc.id}`)}>
                        编辑
                      </Button>
                      <Popconfirm
                        title="确认删除该文档吗？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => handleDelete(activeDoc.id)}
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </>
                  )}
                </Space>
              </div>

              <div className="knowledge-docs__meta">
                <Tag icon={<BookOutlined />}>创建人：{activeDoc.create_user_name || '-'}</Tag>
                <Tag>创建时间：{activeDoc.created_at || '-'}</Tag>
                <Tag>更新时间：{activeDoc.updated_at || '-'}</Tag>
              </div>

              <article className="knowledge-viewer">
                <div
                  className="knowledge-viewer-content w-e-text"
                  dangerouslySetInnerHTML={{ __html: ensureHtml(activeDoc.content || '') }}
                />
              </article>
            </>
          )}
        </section>
      </div>

      {/* 分类管理弹窗 */}
      <Modal
        title="分类管理"
        open={categoryModalVisible}
        onCancel={() => setCategoryModalVisible(false)}
        footer={null}
        width={560}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCategoryForm()}>
            新增分类
          </Button>
        </div>
        <Table
          size="small"
          rowKey="id"
          loading={categoryLoading}
          dataSource={categories}
          pagination={false}
          columns={[
            { title: '分类名称', dataIndex: 'name' },
            { title: '排序', dataIndex: 'sort_order', width: 80 },
            {
              title: '操作',
              width: 140,
              render: (_, record) => (
                <Space>
                  <Button type="link" size="small" onClick={() => openCategoryForm(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确认删除该分类吗？" onConfirm={() => handleDeleteCategory(record.id)}>
                    <Button type="link" danger size="small">
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      {/* 分类新增/编辑弹窗 */}
      <Modal
        title={categoryEditing ? '编辑分类' : '新增分类'}
        open={categoryFormVisible}
        onCancel={() => setCategoryFormVisible(false)}
        onOk={handleCategoryFormSubmit}
        confirmLoading={categoryFormLoading}
        destroyOnClose
      >
        <Form form={categoryForm} layout="vertical" preserve={false}>
          <Form.Item
            label="分类名称"
            name="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            label="排序"
            name="sort_order"
            initialValue={0}
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="数字越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default KnowledgeBase;
