import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Empty, Input, Popconfirm, Space, Spin, Tag, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import {
  PlusOutlined,
  ShareAltOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BookOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { history, useLocation, useModel } from '@umijs/max';
import { deleteKnowledge, listKnowledge } from '@/services/configure';
import './index.less';

const PAGE_SIZE = 20;

const KnowledgeBase = () => {
  const { initialState } = useModel('@@initialState');
  const location = useLocation();
  const currentUser = initialState?.currentUser;
  const isSuperAdmin = currentUser?.role === 2;

  const [docs, setDocs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
  const requestLock = useRef(false);
  const loadMoreRef = useRef(null);

  const fetchDocs = useCallback(async ({ page = 1, title = '', append = false } = {}) => {
    if (requestLock.current) return;
    requestLock.current = true;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await listKnowledge({ page, size: PAGE_SIZE, title });
      if (res?.code === 0) {
        const nextData = Array.isArray(res.data) ? res.data : [];
        setDocs((prev) => {
          if (!append) return nextData;
          const exists = new Set(prev.map((item) => item.id));
          return [...prev, ...nextData.filter((item) => !exists.has(item.id))];
        });
        setPagination({ current: page, pageSize: PAGE_SIZE, total: res.total || 0 });
      } else {
        message.error(res?.msg || '获取知识库列表失败');
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
      requestLock.current = false;
    }
  }, []);

  useEffect(() => {
    fetchDocs({ page: 1, title: '', append: false });
  }, [fetchDocs, location.search]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || loading || loadingMore || docs.length >= pagination.total) return;
        fetchDocs({ page: pagination.current + 1, title: searchTitle, append: true });
      },
      { root: null, rootMargin: '240px 0px', threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [docs.length, fetchDocs, loading, loadingMore, pagination.current, pagination.total, searchTitle]);

  const handleSearch = (value) => {
    const title = value.trim();
    setSearchTitle(title);
    fetchDocs({ page: 1, title, append: false });
  };

  const handleDelete = async (id) => {
    const res = await deleteKnowledge({ id });
    if (res?.code === 0) {
      message.success('删除成功');
      fetchDocs({ page: 1, title: searchTitle, append: false });
    } else {
      message.error(res?.msg || '删除失败');
    }
  };

  const handleShare = async (doc) => {
    const url = `${window.location.origin}${window.location.pathname}#/knowledge/view/${doc.id}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success('分享链接已复制');
    } catch (e) {
      message.warning('复制失败，请手动复制地址栏链接');
    }
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="knowledge-page">
        <div className="knowledge-toolbar">
          <Space>
            <Input.Search
              allowClear
              placeholder="搜索知识库文档"
              style={{ width: 280 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
            />
            {isSuperAdmin ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => history.push('/knowledge/create')}>
                新增文档
              </Button>
            ) : (
              <Tag color="blue">只读模式</Tag>
            )}
          </Space>
        </div>

        <Spin spinning={loading}>
          <div className="knowledge-grid">
            {docs.length === 0 ? (
              <Card className="knowledge-empty-card">
                <Empty description="暂无知识库文档" />
              </Card>
            ) : (
              docs.map((doc) => (
                <Card key={doc.id} className="knowledge-card" bordered={false}>
                  <div className="knowledge-card-head">
                    <div className="knowledge-card-icon">
                      <BookOutlined />
                    </div>
                    <div className="knowledge-card-title-wrap">
                      <div className="knowledge-card-title">{doc.title}</div>
                      <div className="knowledge-time">
                        <ClockCircleOutlined /> 更新于 {doc.updated_at || '-'}
                      </div>
                    </div>
                  </div>
                  <div className="knowledge-summary">{doc.summary || '暂无描述'}</div>
                  <div className="knowledge-meta">
                    <span>创建人：{doc.create_user_name || '-'}</span>
                    <span>创建时间：{doc.created_at || '-'}</span>
                  </div>
                  <div className="knowledge-actions">
                    <Button type="link" icon={<EyeOutlined />} onClick={() => history.push(`/knowledge/view/${doc.id}`)}>
                      查看
                    </Button>
                    <Button type="link" icon={<ShareAltOutlined />} onClick={() => handleShare(doc)}>
                      分享
                    </Button>
                    {isSuperAdmin && (
                      <>
                        <Button type="link" icon={<EditOutlined />} onClick={() => history.push(`/knowledge/edit/${doc.id}`)}>
                          编辑
                        </Button>
                        <Popconfirm
                          title="确认删除该文档吗？"
                          onConfirm={() => handleDelete(doc.id)}
                          okText="删除"
                          cancelText="取消"
                        >
                          <Button type="link" danger icon={<DeleteOutlined />}>
                            删除
                          </Button>
                        </Popconfirm>
                      </>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </Spin>

        {docs.length > 0 && (
          <div className="knowledge-scroll-footer" ref={loadMoreRef}>
            {loadingMore ? <Spin size="small" /> : docs.length >= pagination.total ? '没有更多文档了' : '向下滚动加载更多'}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default KnowledgeBase;
