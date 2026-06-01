let mermaidLoader = null;
let mermaidInitialized = false;

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeMermaidSource = (raw = '') => {
  const text = String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ') // nbsp
    .replace(/\u3000/g, ' ') // full-width space
    .replace(/\u200b/g, '') // zero width space
    .replace(/\u200c/g, '')
    .replace(/\u200d/g, '')
    .replace(/\ufeff/g, '') // bom
    .trim();
  if (!text) return '';
  // 兼容用户直接粘贴 markdown 围栏
  const fenced = text.match(/^```(?:\s*mermaid)?\s*\n([\s\S]*?)\n```$/i);
  const body = (fenced ? fenced[1] : text)
    .split('\n')
    .map((line) => line.replace(/^\s*\d+[\.\)]\s+/, '').replace(/\t/g, '    '))
    .join('\n')
    .trim();
  // 兼容粘贴后被压成同一行的 subgraph 语句：
  // subgraph XXX[中文]    A --> B
  // =>
  // subgraph XXX[中文]
  //    A --> B
  return body
    .replace(
      /(subgraph\s+[^\n]+?)\s{2,}([A-Za-z_][A-Za-z0-9_-]*\s*(?:-->|---|==>|-.->))/g,
      '$1\n    $2',
    )
    .replace(
      /(subgraph\s+[^\n\]]+\[[^\]]+\])\s+([A-Za-z_][A-Za-z0-9_-]*\s*(?:-->|---|==>|-.->)[^\n]*)/g,
      '$1\n    $2',
    );
};

const getMermaid = async () => {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid')
      .then((mod) => mod.default || mod)
      .catch(() => null);
  }
  const mermaid = await mermaidLoader;
  if (!mermaid) return null;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
    });
    mermaidInitialized = true;
  }
  return mermaid;
};

export const renderMermaidInElement = async (container) => {
  if (!container) return;
  const codeBlocks = Array.from(container.querySelectorAll('pre > code')).filter((codeEl) => {
    const cls = String(codeEl.className || '');
    const text = String(codeEl.textContent || '').trim();
    if (cls.includes('language-mermaid')) return true;
    if (!text) return false;
    // 兼容部分编辑器未正确写入 language-mermaid 的场景
    return /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)\b/i.test(
      text,
    );
  });
  if (!codeBlocks.length) return;
  const mermaid = await getMermaid();
  if (!mermaid) return;

  for (let i = 0; i < codeBlocks.length; i += 1) {
    const codeEl = codeBlocks[i];
    const preEl = codeEl.parentElement;
    if (!preEl || preEl.dataset.mermaidRendered === '1') continue;
    const source = normalizeMermaidSource(codeEl.textContent || '');
    const mount = document.createElement('div');
    mount.className = 'knowledge-mermaid';
    preEl.dataset.mermaidRendered = '1';
    preEl.replaceWith(mount);
    try {
      const renderId = `knowledge-mermaid-${Date.now()}-${i}`;
      const result = await mermaid.render(renderId, source);
      mount.innerHTML = result.svg;
      if (typeof result.bindFunctions === 'function') {
        result.bindFunctions(mount);
      }
    } catch (e) {
      // 第一种渲染方式失败时，尝试使用 mermaid.run 兜底
      try {
        mount.innerHTML = '';
        const fallbackEl = document.createElement('div');
        fallbackEl.className = 'mermaid';
        fallbackEl.textContent = source;
        mount.appendChild(fallbackEl);
        await mermaid.run({ nodes: [fallbackEl] });
      } catch (e2) {
        // 彻底失败时保留可读文本，并输出控制台日志便于排查
        console.warn('[knowledge-mermaid] render failed:', e);
        console.warn('[knowledge-mermaid] run fallback failed:', e2);
        console.warn(
          '[knowledge-mermaid] final source:\\n' +
            source
              .split('\\n')
              .map((line, idx) => `${String(idx + 1).padStart(3, '0')}: ${line}`)
              .join('\\n'),
        );
        mount.innerHTML = `<pre><code class="hljs language-mermaid" style="color:#d7e3ff;">${escapeHtml(source)}</code></pre>`;
      }
    }
  }
};
