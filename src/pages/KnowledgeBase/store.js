import moment from 'moment';
import hljs from 'highlight.js';

export const STORAGE_KEY = 'argux_knowledge_docs_v1';
export const STYLE_DEMO_DOC_ID = 'kb-style-demo';

export const STYLE_DEMO_CONTENT = `
<h1>知识库样式验收 Demo</h1>
<p>这是一份用于验收富文本样式的示例文档 😀 🎯 ✅</p>
<h2>1. 基础文本</h2>
<p>普通文本、<strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>、<s>删除线</s></p>
<p>颜色示例：<span style="color:#1677ff;">蓝色文字</span>、<span style="color:#f5222d;">红色文字</span></p>
<p>背景色示例：<span style="background-color:#fff1b8;">黄色高亮</span>、<span style="background-color:#d9f7be;">绿色高亮</span></p>
<h2>2. 链接与引用</h2>
<p>平台官网：<a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">备案查询入口</a></p>
<blockquote>用于测试 blockquote 样式展示是否正常。</blockquote>
<h2>3. 列表</h2>
<ul><li>无序项 A</li><li>无序项 B</li><li>无序项 C</li></ul>
<ol><li>有序项 1</li><li>有序项 2</li><li>有序项 3</li></ol>
<h2>4. 表格</h2>
<table>
  <thead><tr><th>功能</th><th>示例值</th><th>结果</th></tr></thead>
  <tbody>
    <tr><td>文字颜色</td><td><span style="color:#722ed1;">紫色文本</span></td><td>应显示紫色</td></tr>
    <tr><td>背景色</td><td><span style="background-color:#e6f7ff;">浅蓝背景</span></td><td>应有背景底色</td></tr>
    <tr><td>删除线</td><td><s>已废弃字段</s></td><td>应显示删除线</td></tr>
  </tbody>
</table>
<h2>5. 代码块</h2>
<pre><code class="language-json">{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "demo": true
  }
}</code></pre>
`;

export const ensureHtml = (content = '') => {
  const text = String(content || '').trim();
  if (!text) return '<p></p>';
  if (text.includes('<') && text.includes('>')) return text;
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
  return `<p>${escaped}</p>`;
};

export const getPlainText = (html = '') =>
  String(html)
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getCodeBlockLanguage = (block) => {
  if (!block) return '';

  const classLanguage = Array.from(block.classList || []).find((item) => item.startsWith('language-'));
  if (classLanguage) {
    return classLanguage.replace('language-', '').trim();
  }

  const dataLanguage =
    block.getAttribute('data-language') ||
    block.getAttribute('data-code-language') ||
    block.getAttribute('data-codeblock-language') ||
    block.parentElement?.getAttribute('data-language') ||
    block.parentElement?.getAttribute('data-code-language') ||
    block.parentElement?.getAttribute('data-codeblock-language');

  return String(dataLanguage || '').trim();
};

export const highlightCodeBlocksInElement = (root) => {
  if (!root?.querySelectorAll) return;

  root.querySelectorAll('pre code').forEach((block) => {
    const source = block.textContent || '';
    const language = getCodeBlockLanguage(block);

    try {
      let highlighted = language && hljs.getLanguage(language)
        ? hljs.highlight(source, { language })
        : hljs.highlightAuto(source);

      // Some legacy docs were saved with a wrong language class (for example
      // `language-html` on Python code). If explicit highlighting produces no
      // token markup, fall back to auto-detection so the viewer still renders
      // a readable colored code block.
      if (
        language &&
        hljs.getLanguage(language) &&
        !/<span class="hljs-/.test(highlighted.value) &&
        source.trim()
      ) {
        highlighted = hljs.highlightAuto(source);
      }

      block.innerHTML = highlighted.value;
      block.className = 'hljs';
      block.removeAttribute('style');
      block.querySelectorAll('*').forEach((node) => node.removeAttribute('style'));

      if (language) {
        block.classList.add(`language-${language}`);
      } else if (highlighted.language) {
        block.classList.add(`language-${highlighted.language}`);
      }

      const pre = block.closest('pre');
      if (pre) {
        pre.removeAttribute('style');
      }
    } catch (error) {
      block.textContent = source;
    }
  });
};

export const highlightKnowledgeHtml = (html = '') => {
  const normalizedHtml = ensureHtml(html);
  if (typeof document === 'undefined') {
    return normalizedHtml;
  }

  const container = document.createElement('div');
  container.innerHTML = normalizedHtml;
  highlightCodeBlocksInElement(container);
  return container.innerHTML;
};

const defaultDocs = [
  {
    id: 'kb-quickstart',
    title: '测试平台快速上手',
    summary: '介绍登录、项目管理、接口用例、测试计划和构建历史的核心流程。',
    content:
      '<h1>测试平台快速上手</h1><h2>1. 新建项目</h2><p>进入项目管理，点击“创建项目”。</p><h2>2. 维护接口用例</h2><p>进入接口测试 &gt; 接口用例，在目录下新增或编辑用例。</p><h2>3. 执行与查看报告</h2><p>在用例列表点击执行，到测试报告查看构建结果。</p>',
    createdAt: '2026-04-21 10:00:00',
    updatedAt: '2026-04-21 10:00:00',
    author: 'system',
  },
];

const builtinDocs = [
  {
    id: STYLE_DEMO_DOC_ID,
    title: '知识库样式验收 Demo',
    summary: '用于验收表情、链接、删除线、颜色、背景色、表格等富文本展示效果。',
    content: STYLE_DEMO_CONTENT,
  },
  {
    id: 'kb-api-case-guide',
    title: '接口用例编写规范',
    summary: '覆盖目录规划、命名规则、断言建议、前后置步骤和维护策略。',
    content:
      '<h2>接口用例编写规范</h2><ul><li>目录按业务域划分</li><li>名称建议“业务动作（输入场景）”</li><li>至少包含状态码与关键字段断言</li></ul>',
  },
  {
    id: 'kb-test-plan-guide',
    title: '测试计划执行说明',
    summary: '介绍如何创建计划、选择执行环境、调度执行与结果追踪。',
    content:
      '<h2>测试计划执行说明</h2><p>从接口用例筛选需要纳入计划的场景，绑定执行环境后可手动执行或按计划触发。</p>',
  },
  {
    id: 'kb-report-readme',
    title: '构建历史与报告解读',
    summary: '包含成功/失败统计、日志定位技巧和常见异常处理建议。',
    content:
      '<h2>构建历史与报告解读</h2><p>建议先看失败用例，再看执行日志中的 request/response 与断言对比。</p>',
  },
  {
    id: 'kb-env-convention',
    title: '环境与变量配置约定',
    summary: '统一环境命名、变量命名和跨项目复用规则，降低维护成本。',
    content:
      '<h2>环境与变量配置约定</h2><p>环境命名建议使用“区域-系统-阶段”，变量 key 建议下划线命名。</p>',
  },
  {
    id: 'kb-datafactory-guide',
    title: '数据工厂场景使用手册',
    summary: '介绍卡片入口、执行参数填写、日志查看和批量导入模板。',
    content:
      '<h2>数据工厂场景使用手册</h2><p>执行场景前请确认时间范围、发送频率和点位标签配置。</p>',
  },
  {
    id: 'kb-release-checklist',
    title: '提测发布前检查清单',
    summary: '从接口变更、回归范围、环境健康、报告归档四方面进行发布前确认。',
    content:
      '<h2>提测发布前检查清单</h2><ol><li>接口变更确认</li><li>回归用例通过率</li><li>环境健康检查</li><li>报告归档</li></ol>',
  },
];

export const readDocs = () => {
  const text = localStorage.getItem(STORAGE_KEY);
  if (!text) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDocs));
    return defaultDocs;
  }
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : defaultDocs;
  } catch (e) {
    return defaultDocs;
  }
};

export const persistDocs = (docs) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
};

export const ensureStyleDemoDoc = (docs) => {
  const exists = new Set(docs.map((item) => item.id));
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  const appendDocs = builtinDocs
    .filter((item) => !exists.has(item.id))
    .map((item) => ({
      ...item,
      createdAt: now,
      updatedAt: now,
      author: 'system',
    }));

  if (appendDocs.length === 0) {
    return docs;
  }

  const next = [...appendDocs, ...docs];
  persistDocs(next);
  return next;
};
