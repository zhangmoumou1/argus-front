import React, { useMemo } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';

const RichEditor = ({ editor, setEditor, value, onChange }) => {
  const editorConfig = useMemo(
    () => ({
      placeholder: '请输入知识库文档内容...',
    }),
    [],
  );

  return (
    <div className="knowledge-rich-editor">
      <Toolbar
        editor={editor}
        mode="default"
        defaultConfig={{
          toolbarKeys: [
            'headerSelect',
            'fontSize',
            'bold',
            'italic',
            'underline',
            'through',
            'color',
            'bgColor',
            '|',
            'bulletedList',
            'numberedList',
            'todo',
            '|',
            'justifyLeft',
            'justifyCenter',
            'justifyRight',
            '|',
            'insertLink',
            'insertTable',
            'emotion',
            'codeBlock',
            'blockquote',
            '|',
            'undo',
            'redo',
            'fullScreen',
          ],
        }}
      />
      <Editor
        mode="default"
        defaultConfig={editorConfig}
        value={value}
        onCreated={setEditor}
        onChange={(nextEditor) => {
          onChange(nextEditor.getHtml());
        }}
      />
    </div>
  );
};

export default RichEditor;
