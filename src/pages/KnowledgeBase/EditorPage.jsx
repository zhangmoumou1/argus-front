import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select, Space, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { history, useLocation, useModel, useParams } from '@umijs/max';
import { insertKnowledge, listKnowledge, listKnowledgeCategory, updateKnowledge } from '@/services/configure';
import { ensureHtml, getPlainText, highlightKnowledgeHtml } from './store';
import { renderMermaidInElement } from './mermaidRender';
import './index.less';

const RichEditor = lazy(() => import('./RichEditor'));

const EditorPage = () => {
  const { initialState } = useModel('@@initialState');
  const location = useLocation();
  const isSuperAdmin = initialState?.currentUser?.role === 2;
  const params = useParams();
  const docId = params?.id;
  const isEdit = Boolean(docId);
  const [docs, setDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [draft, setDraft] = useState({ title: '', summary: '', content: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef(null);

  const currentDoc = useMemo(() => docs.find((item) => String(item.id) === String(docId)), [docId, docs]);

  useEffect(() => {
    if (!isSuperAdmin) {
      message.warning('仅超级管理员可编辑知识库');
      history.replace('/knowledge');
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const res = await listKnowledgeCategory();
        if (res?.code === 0) {
          setCategories(Array.isArray(res.data) ? res.data : []);
        }
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (currentDoc) {
      setDraft({
        title: currentDoc.title || '',
        summary: currentDoc.summary || '',
        content: ensureHtml(currentDoc.content || ''),
        category: currentDoc.category || '',
      });
    }
  }, [isEdit, currentDoc]);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await listKnowledge({ page: 1, size: 10000 });
        if (res?.code === 0) {
          const list = Array.isArray(res.data) ? res.data : [];
          setDocs(list);
          if (isEdit) {
            const found = list.find((item) => String(item.id) === String(docId));
            if (!found) {
              message.warning('文档不存在');
              history.replace('/knowledge');
              return;
            }
          }
        } else {
          message.error(res?.msg || '获取文档失败');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docId, isEdit, location.search]);

  useEffect(() => {
    renderMermaidInElement(previewRef.current);
  }, [draft.content]);

  const handleSave = async () => {
    if (!draft.title.trim()) {
      message.warning('请输入文档标题');
      return;
    }
    const normalizedContent = ensureHtml(draft.content);
    if (!getPlainText(normalizedContent)) {
      message.warning('请输入文档内容');
      return;
    }
    const summary = draft.summary.trim() || getPlainText(normalizedContent).slice(0, 80);
    const payload = {
      title: draft.title.trim(),
      summary,
      content: normalizedContent,
      category: draft.category || '',
    };
    setSaving(true);
    try {
      const res = isEdit ? await updateKnowledge({ ...payload, id: Number(docId) }) : await insertKnowledge(payload);
      if (res?.code === 0) {
        message.success('保存成功');
        history.push(`/knowledge?refresh=${Date.now()}`);
      } else {
        message.error(res?.msg || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="knowledge-hub-page">
      <header className="knowledge-hub-topbar">
        <div className="knowledge-hub-topbar__brand">
          <span className="knowledge-hub-topbar__title">Argus Docs</span>
          <span className="knowledge-hub-topbar__label">{isEdit ? '编辑文档' : '新增文档'}</span>
        </div>
        <div className="knowledge-hub-topbar__actions">
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/knowledge')}>
            返回文档页
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </div>
      </header>

      <div className="knowledge-editor-page">
        <div className="knowledge-editor-layout">
          <Spin spinning={loading}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Input
                placeholder="请输入文档标题"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Select
                loading={categoryLoading}
                placeholder="请选择文档分类"
                value={draft.category || undefined}
                onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
                allowClear
                style={{ width: '100%' }}
              >
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.name}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
              <Input
                placeholder="请输入文档摘要（可选）"
                value={draft.summary}
                onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
              />
              <Suspense fallback={<Spin tip="编辑器加载中..." />}>
                <RichEditor
                  value={draft.content}
                  onChange={(content) => setDraft((prev) => ({ ...prev, content }))}
                />
              </Suspense>
              <div className="knowledge-editor-preview">
                <div className="knowledge-editor-preview__title">实时预览</div>
                <article className="knowledge-viewer knowledge-hub__article-body">
                  <div
                    ref={previewRef}
                    className="knowledge-viewer-content w-e-text"
                    dangerouslySetInnerHTML={{ __html: highlightKnowledgeHtml(draft.content || '') }}
                  />
                </article>
              </div>
            </Space>
          </Spin>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
