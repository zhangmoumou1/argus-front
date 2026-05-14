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
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  LinkOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import 'highlight.js/styles/atom-one-dark.css';
import { history, useLocation, useModel } from '@umijs/max';
import {
  deleteKnowledge,
  listKnowledge,
  listPublicKnowledge,
  listKnowledgeCategory,
  listPublicKnowledgeCategory,
  insertKnowledgeCategory,
  updateKnowledgeCategory,
  deleteKnowledgeCategory,
} from '@/services/configure';
import { highlightKnowledgeHtml } from './store';
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

const KnowledgeBase = () => {
  const { initialState } = useModel('@@initialState');
  const location = useLocation();
  const currentUser = initialState?.currentUser;
  const isSuperAdmin = Number(currentUser?.role) === 2;
  const query = new URLSearchParams(location.search);
  const isPublicSharePage = location.pathname === '/knowledge/docs';
  const isPublicShare = isPublicSharePage;
  const routeBasePath = isPublicSharePage ? '/knowledge/docs' : '/knowledge';

  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
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
      const res = isPublicShare
        ? await listPublicKnowledge({ page: 1, size: PAGE_SIZE, title })
        : await listKnowledge({ page: 1, size: PAGE_SIZE, title });
      if (res?.code === 0) {
        const list = Array.isArray(res.data) ? res.data : [];
        setDocs(list);
        if (list.length === 0) {
          setActiveId(null);
          return;
        }
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

  const fetchCategories = async (silent = false) => {
    setCategoryLoading(true);
    try {
      const res = isPublicShare ? await listPublicKnowledgeCategory() : await listKnowledgeCategory();
      if (res?.code === 0) {
        setCategories(Array.isArray(res.data) ? res.data : []);
      } else if (!silent) {
        message.error(res?.msg || '获取分类失败');
      }
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [location.search]);

  useEffect(() => {
    fetchCategories(true);
  }, []);

  const grouped = useMemo(() => {
    const categoryMeta = new Map(
      categories.map((item, index) => [
        String(item?.name || '').trim(),
        {
          sortOrder: Number(item?.sort_order ?? Number.MAX_SAFE_INTEGER),
          index,
        },
      ]),
    );
    const map = new Map();
    docs.forEach((doc) => {
      const category = normalizeCategory(doc);
      if (!map.has(category)) {
        map.set(category, []);
      }
      map.get(category).push(doc);
    });
    return Array.from(map.entries())
      .map(([category, items]) => {
        const meta = categoryMeta.get(category) || {};
        return {
          category,
          items: items.slice().sort((a, b) => String(a?.title || '').localeCompare(String(b?.title || ''), 'zh-Hans-CN')),
          sortOrder: meta.sortOrder ?? Number.MAX_SAFE_INTEGER,
          index: meta.index ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.index - b.index ||
          a.category.localeCompare(b.category, 'zh-Hans-CN'),
      );
  }, [docs, categories]);

  const activeDoc = useMemo(
    () => docs.find((item) => String(item.id) === String(activeId)) || null,
    [docs, activeId],
  );

  const highlightedContent = useMemo(() => {
    return highlightKnowledgeHtml(activeDoc?.content || '');
  }, [activeDoc?.content]);

  const activeDocAuthor = activeDoc?.create_user_name || activeDoc?.author || '-';
  const getPageShareLink = () => {
    const selectedId = activeDoc?.id || docs?.[0]?.id;
    const suffix = selectedId ? `?id=${selectedId}` : '';
    return `${window.location.origin}${window.location.pathname}#/knowledge/docs${suffix}`;
  };

  const handleDelete = async (id) => {
    const res = await deleteKnowledge({ id });
    if (res?.code === 0) {
      message.success('删除成功');
      await fetchDocs();
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const handleShare = async () => {
    const link = getPageShareLink();
    try {
      await navigator.clipboard.writeText(link);
      message.success('分享链接已复制');
    } catch (e) {
      message.warning('复制失败，请手动复制地址栏链接');
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
    <>
      <div className="knowledge-hub-page">
        <header className="knowledge-hub-topbar">
          <div className="knowledge-hub-topbar__brand">
            <span className="knowledge-hub-topbar__title">Argus Docs</span>
            <span className="knowledge-hub-topbar__label">帮助文档</span>
          </div>
          <div className="knowledge-hub-topbar__actions">
            {!isPublicSharePage && (
              <Button icon={<ArrowLeftOutlined />} onClick={() => history.back()}>
                返回
              </Button>
            )}
            <Button icon={<LinkOutlined />} onClick={() => handleShare()}>
              分享
            </Button>
            {isSuperAdmin && (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => history.push('/knowledge/create')}>
                  新增文档
                </Button>
                <Button icon={<TagsOutlined />} onClick={openCategoryModal}>
                  分类管理
                </Button>
              </>
            )}
          </div>
        </header>

        <div className="knowledge-hub">
          <aside className="knowledge-hub__sidebar">
            <div className="knowledge-hub__nav-head">
              <span>Docs</span>
              <span>{loading ? '加载中...' : `${docs.length} 篇`}</span>
            </div>

            <Spin spinning={loading}>
              {grouped.length === 0 ? (
                <div className="knowledge-hub__empty">
                  <Empty description="暂无文档" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              ) : (
                <div className="knowledge-hub__menu">
                  {grouped.map((group) => (
                    <div key={group.category} className="knowledge-hub__group">
                      <div className="knowledge-hub__group-title">
                        <span className="knowledge-hub__group-icon">
                          <FolderOpenOutlined />
                        </span>
                        <span>{group.category}</span>
                        <em>{group.items.length}</em>
                      </div>
                      <div className="knowledge-hub__group-list">
                        {group.items.map((doc) => {
                          const active = String(doc.id) === String(activeId);
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              className={`knowledge-hub__item ${active ? 'is-active' : ''}`}
                              onClick={() => {
                                setActiveId(doc.id);
                                history.replace(`${routeBasePath}?id=${doc.id}`);
                            }}
                          >
                            <span className="knowledge-hub__item-title">{doc.title}</span>
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

          <section className="knowledge-hub__main">
            {!activeDoc ? (
              <div className="knowledge-hub__article-shell knowledge-hub__article-shell--empty">
                <Empty description="请选择左侧文档查看内容" />
              </div>
            ) : (
              <div className="knowledge-hub__article-shell">
                <div className="knowledge-hub__article-topbar">
                  <div className="knowledge-hub__article-intro">
                    <h2>{activeDoc.title}</h2>
                    <div className="knowledge-hub__article-meta-inline">
                      <span>创建人：{activeDocAuthor}</span>
                      <span>创建时间：{activeDoc.created_at || '-'}</span>
                      <span>更新时间：{activeDoc.updated_at || '-'}</span>
                    </div>
                    <p className="knowledge-hub__article-summary">摘要：{activeDoc.summary || '暂无摘要'}</p>
                  </div>
                  <div className="knowledge-hub__article-actions">
                    <Space wrap>
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
                </div>

                <article className="knowledge-viewer knowledge-hub__article-body">
                  <div
                    className="knowledge-viewer-content w-e-text"
                    dangerouslySetInnerHTML={{ __html: highlightedContent }}
                  />
                </article>
              </div>
            )}
          </section>
        </div>
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
    </>
  );
};

export default KnowledgeBase;
