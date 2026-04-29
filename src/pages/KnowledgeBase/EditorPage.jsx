import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Space, Spin, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { history, useModel, useParams } from '@umijs/max';
import { insertKnowledge, listKnowledge, updateKnowledge } from '@/services/configure';
import { ensureHtml, getPlainText } from './store';
import './index.less';

const RichEditor = lazy(() => import('./RichEditor'));

const EditorPage = () => {
  const { initialState } = useModel('@@initialState');
  const isSuperAdmin = initialState?.currentUser?.role === 2;
  const params = useParams();
  const docId = params?.id;
  const isEdit = Boolean(docId);
  const [editor, setEditor] = useState(null);
  const [docs, setDocs] = useState([]);
  const [draft, setDraft] = useState({ title: '', summary: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentDoc = useMemo(() => docs.find((item) => String(item.id) === String(docId)), [docId, docs]);

  useEffect(() => {
    if (!isSuperAdmin) {
      message.warning('仅超级管理员可编辑知识库');
      history.replace('/knowledge');
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (currentDoc) {
      setDraft({
        title: currentDoc.title || '',
        summary: currentDoc.summary || '',
        content: ensureHtml(currentDoc.content || ''),
      });
    }
  }, [isEdit, currentDoc]);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!isEdit) return;
      setLoading(true);
      try {
        const res = await listKnowledge({ page: 1, size: 10000 });
        if (res?.code === 0) {
          const list = Array.isArray(res.data) ? res.data : [];
          const found = list.find((item) => String(item.id) === String(docId));
          if (!found) {
            message.warning('文档不存在');
            history.replace('/knowledge');
            return;
          }
          setDocs(list);
        } else {
          message.error(res?.msg || '获取文档失败');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docId, isEdit]);

  useEffect(
    () => () => {
      if (editor) editor.destroy();
    },
    [editor],
  );

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
    <PageContainer title={false} breadcrumb={null}>
      <div className="knowledge-editor-page">
        <Card className="knowledge-editor-layout" title={isEdit ? '编辑知识库文档' : '新增知识库文档'}>
          <Spin spinning={loading}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Input
                placeholder="请输入文档标题"
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
              <Input
                placeholder="请输入文档摘要（可选）"
                value={draft.summary}
                onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
              />
              <Suspense fallback={<Spin tip="编辑器加载中..." />}>
                <RichEditor
                  editor={editor}
                  setEditor={setEditor}
                  value={draft.content}
                  onChange={(content) => setDraft((prev) => ({ ...prev, content }))}
                />
              </Suspense>
              <div className="knowledge-page-actions">
                <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/knowledge')}>
                  返回
                </Button>
                <Button type="primary" loading={saving} onClick={handleSave}>
                  保存
                </Button>
              </div>
            </Space>
          </Spin>
        </Card>
      </div>
    </PageContainer>
  );
};

export default EditorPage;
