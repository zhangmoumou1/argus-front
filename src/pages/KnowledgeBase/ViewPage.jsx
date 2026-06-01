import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Drawer, Empty, Modal, Space, Spin, Tag, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { ArrowLeftOutlined, EditOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { history, useModel, useParams } from '@umijs/max';
import { listKnowledge } from '@/services/configure';
import { highlightKnowledgeHtml } from './store';
import { renderMermaidInElement } from './mermaidRender';
import './index.less';

const ViewPage = () => {
  const { initialState } = useModel('@@initialState');
  const isSuperAdmin = initialState?.currentUser?.role === 2;
  const params = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [outlineItems, setOutlineItems] = useState([]);
  const articleRef = useRef(null);
  const activeHighlightTimerRef = useRef(null);
  const contentHtml = useMemo(() => highlightKnowledgeHtml(doc?.content || ''), [doc?.content]);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await listKnowledge({ page: 1, size: 10000 });
        if (res?.code === 0) {
          const list = Array.isArray(res.data) ? res.data : [];
          setDoc(list.find((item) => String(item.id) === String(params?.id)) || null);
        } else {
          message.error(res?.msg || '获取文档失败');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [params?.id]);

  useEffect(() => {
    renderMermaidInElement(articleRef.current);
  }, [doc?.content]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) {
      setOutlineItems([]);
      return;
    }
    const headings = Array.from(root.querySelectorAll('h1, h2, h3, h4'));
    const items = headings
      .map((el, index) => {
        const text = String(el.textContent || '').trim();
        if (!text) return null;
        const level = Number(el.tagName.replace('H', '')) || 1;
        const id = `kb-outline-heading-${index + 1}`;
        el.id = id;
        return { id, text, level };
      })
      .filter(Boolean);
    setOutlineItems(items);
  }, [contentHtml]);

  const handleOutlineJump = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const container = articleRef.current;
    if (container) {
      if (activeHighlightTimerRef.current) {
        clearTimeout(activeHighlightTimerRef.current);
        activeHighlightTimerRef.current = null;
      }
      container.querySelectorAll('.knowledge-jump-highlight').forEach((el) => {
        el.classList.remove('knowledge-jump-highlight');
      });
      target.classList.add('knowledge-jump-highlight');
      activeHighlightTimerRef.current = setTimeout(() => {
        target.classList.remove('knowledge-jump-highlight');
        activeHighlightTimerRef.current = null;
      }, 1800);
    }
  };

  useEffect(
    () => () => {
      if (activeHighlightTimerRef.current) {
        clearTimeout(activeHighlightTimerRef.current);
      }
    },
    [],
  );

  if (!loading && !doc) {
    return (
      <PageContainer title={false} breadcrumb={null}>
        <div className="knowledge-view-page">
          <Card>
            <Empty description="文档不存在或已删除" />
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className="knowledge-view-page">
        <Spin spinning={loading}>
          <Card
            title={doc?.title}
            extra={
              <Space>
                <Tag color="blue">更新于 {doc?.updated_at || '-'}</Tag>
                <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/dashboard/workspace')}>
                  返回
                </Button>
                {isSuperAdmin && (
                  <Button type="primary" icon={<EditOutlined />} onClick={() => history.push(`/knowledge/edit/${doc.id}`)}>
                    编辑
                  </Button>
                )}
              </Space>
            }
          >
            <div className="knowledge-viewer">
              <div
                ref={articleRef}
                className="knowledge-viewer-content w-e-text"
                onClick={(event) => {
                  const target = event.target;
                  if (target && target.tagName === 'IMG') {
                    const src = target.getAttribute('src') || '';
                    if (src) setPreviewImage(src);
                  }
                }}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          </Card>
        </Spin>
      </div>
      {outlineItems.length ? (
        <>
          <Button
            type="primary"
            shape="circle"
            size="large"
            className="knowledge-outline-fab"
            icon={<UnorderedListOutlined />}
            onClick={() => setOutlineOpen(true)}
          />
          <Drawer
            title="文章大纲"
            placement="right"
            width={320}
            open={outlineOpen}
            onClose={() => setOutlineOpen(false)}
          >
            <div className="knowledge-outline-list">
              {outlineItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`knowledge-outline-item level-${item.level}`}
                  onClick={() => handleOutlineJump(item.id)}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </Drawer>
        </>
      ) : null}
      <Modal
        open={Boolean(previewImage)}
        footer={null}
        onCancel={() => setPreviewImage('')}
        width={960}
        centered
        destroyOnClose
      >
        <img src={previewImage} alt="preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </Modal>
    </PageContainer>
  );
};

export default ViewPage;
