import React, { useEffect, useState } from 'react';
import { Button, Card, Empty, Modal, Space, Spin, Tag, message } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { history, useModel, useParams } from '@umijs/max';
import { listKnowledge } from '@/services/configure';
import { highlightKnowledgeHtml } from './store';
import './index.less';

const ViewPage = () => {
  const { initialState } = useModel('@@initialState');
  const isSuperAdmin = initialState?.currentUser?.role === 2;
  const params = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

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
                <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/knowledge')}>
                  返回列表
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
                className="knowledge-viewer-content w-e-text"
                onClick={(event) => {
                  const target = event.target;
                  if (target && target.tagName === 'IMG') {
                    const src = target.getAttribute('src') || '';
                    if (src) setPreviewImage(src);
                  }
                }}
                dangerouslySetInnerHTML={{ __html: highlightKnowledgeHtml(doc?.content || '') }}
              />
            </div>
          </Card>
        </Spin>
      </div>
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
