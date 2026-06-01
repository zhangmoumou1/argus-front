import React, { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { Boot } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';
import attachmentModule from '@wangeditor/plugin-upload-attachment';
import { uploadKnowledgeFile } from '@/services/configure';
import CONFIG from '@/consts/config';

if (!window.__WANG_EDITOR_ATTACHMENT_REGISTERED__) {
  Boot.registerModule(attachmentModule);
  window.__WANG_EDITOR_ATTACHMENT_REGISTERED__ = true;
}

class MermaidMenu {
  constructor() {
    this.title = '流程图(Mermaid)';
    this.tag = 'button';
  }

  getValue() {
    return '';
  }

  isActive() {
    return false;
  }

  isDisabled() {
    return false;
  }

  exec(editor) {
    editor.dangerouslyInsertHtml(
      '<pre><code class="language-mermaid">flowchart TD\n  A[开始] --> B[处理]\n  B --> C[结束]</code></pre><p><br></p>',
    );
  }
}

if (!window.__WANG_EDITOR_MERMAID_MENU_REGISTERED__) {
  Boot.registerMenu({
    key: 'insertMermaidTemplate',
    factory() {
      return new MermaidMenu();
    },
  });
  window.__WANG_EDITOR_MERMAID_MENU_REGISTERED__ = true;
}

const RichEditor = ({ value, onChange }) => {
  const [editor, setEditor] = useState(null);

  const normalizeAssetUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    const base = String(CONFIG.URL || window.location.origin).replace(/\/$/, '');
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${base}${path}`;
  };

  const normalizeHtmlAssets = (html) => {
    const raw = String(html || '');
    if (!raw) return raw;
    return raw
      .replace(/src=(['"])(\/[^'"]+)\1/gi, (m, q, p) => `src=${q}${normalizeAssetUrl(p)}${q}`)
      .replace(/href=(['"])(\/[^'"]+)\1/gi, (m, q, p) => `href=${q}${normalizeAssetUrl(p)}${q}`);
  };

  const normalizedValue = normalizeHtmlAssets(value || '');
  const toolbarConfig = useMemo(
    () => ({
      insertKeys: {
        index: 34,
        keys: ['insertMermaidTemplate'],
      },
    }),
    [],
  );

  const editorConfig = useMemo(
    () => ({
      placeholder: '请输入知识库文档内容...',
      MENU_CONF: {
        uploadImage: {
          async customUpload(file, insertFn) {
            const res = await uploadKnowledgeFile({ file, kind: 'image' });
            if (res?.code !== 0 || !res?.data?.url) {
              message.error(res?.msg || '图片上传失败');
              return;
            }
            const finalUrl = normalizeAssetUrl(res.data.url);
            insertFn(finalUrl, file.name, finalUrl);
            message.success('图片上传成功');
          },
        },
        uploadAttachment: {
          async customUpload(file, insertFn) {
            const res = await uploadKnowledgeFile({ file, kind: 'file' });
            if (res?.code !== 0 || !res?.data?.url) {
              message.error(res?.msg || '附件上传失败');
              return;
            }
            insertFn(file.name || '附件', normalizeAssetUrl(res.data.url));
            message.success('附件上传成功');
          },
        },
      },
    }),
    [],
  );

  useEffect(
    () => () => {
      if (editor) editor.destroy();
    },
    [editor],
  );

  return (
    <div className="knowledge-rich-editor">
      <div className="knowledge-rich-editor__toolbar">
        <Toolbar editor={editor} mode="default" defaultConfig={toolbarConfig} />
      </div>
      <Editor
        mode="default"
        defaultConfig={editorConfig}
        value={normalizedValue}
        onCreated={setEditor}
        onChange={(nextEditor) => {
          onChange(nextEditor.getHtml());
        }}
      />
    </div>
  );
};

export default RichEditor;
