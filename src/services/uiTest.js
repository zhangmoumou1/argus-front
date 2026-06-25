import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

const buildSseUrl = (path, params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return `${CONFIG.URL}${path}${query ? `?${query}` : ''}`;
};

const parseSseBlock = (block) => {
  const lines = String(block || '').split(/\r?\n/);
  let event = 'message';
  const dataLines = [];
  lines.forEach((line) => {
    if (!line || line.startsWith(':')) return;
    if (line.startsWith('event:')) {
      event = line.slice(6).trim() || 'message';
      return;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  });
  if (!dataLines.length) return null;
  const raw = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
};

const subscribeUiTestSse = (path, params = {}, handlers = {}) => {
  let closed = false;
  let reconnectTimer = null;
  let activeController = null;

  const clearReconnect = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const close = () => {
    closed = true;
    clearReconnect();
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  };

  const connect = async () => {
    if (closed) return;
    clearReconnect();
    const controller = new AbortController();
    activeController = controller;
    try {
      const response = await fetch(buildSseUrl(path, params), {
        method: 'GET',
        headers: auth.headers(false),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`SSE request failed: ${response.status}`);
      }
      handlers.onOpen?.();
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';
        blocks.forEach((block) => {
          const parsed = parseSseBlock(block);
          if (parsed) {
            handlers.onMessage?.(parsed.event, parsed.data);
          }
        });
      }
      buffer += decoder.decode();
      if (buffer.trim()) {
        const parsed = parseSseBlock(buffer);
        if (parsed) {
          handlers.onMessage?.(parsed.event, parsed.data);
        }
      }
      if (!closed) {
        reconnectTimer = window.setTimeout(connect, 1500);
      }
    } catch (error) {
      if (closed || error?.name === 'AbortError') return;
      handlers.onError?.(error);
      reconnectTimer = window.setTimeout(connect, 1500);
    }
  };

  connect();
  return { close };
};

export async function listUiTestCases(params) {
  return request(`${CONFIG.URL}/ui-test/case/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listUiTestCaseNodes(params) {
  return request(`${CONFIG.URL}/ui-test/case/nodes`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getUiTestCaseDetail(params) {
  return request(`${CONFIG.URL}/ui-test/case/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function validateUiTestCase(data) {
  return request(`${CONFIG.URL}/ui-test/case/validate`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function previewUiTestDsl(data) {
  return request(`${CONFIG.URL}/ui-test/case/preview-dsl`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function trialRunUiTestCase(data) {
  return request(`${CONFIG.URL}/ui-test/case/trial-run`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function trialRunUiTestCases(data) {
  return request(`${CONFIG.URL}/ui-test/case/trial-run-batch`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function listUiTestPlanCandidates(params) {
  return request(`${CONFIG.URL}/ui-test/plan/candidates`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listUiTestPlans(params) {
  return request(`${CONFIG.URL}/ui-test/plan/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getUiTestPlanDetail(params) {
  return request(`${CONFIG.URL}/ui-test/plan/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function saveUiTestPlan(data) {
  return request(`${CONFIG.URL}/ui-test/plan/save`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function runUiTestPlan(data) {
  return request(`${CONFIG.URL}/ui-test/plan/run`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function switchUiTestPlan(params) {
  return request(`${CONFIG.URL}/ui-test/plan/switch`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function deleteUiTestPlan(params) {
  return request(`${CONFIG.URL}/ui-test/plan/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listUiTestRuns(params) {
  return request(`${CONFIG.URL}/ui-test/run/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getUiTestRunDetail(params) {
  return request(`${CONFIG.URL}/ui-test/run/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function querySharedUiTestRunDetail(params) {
  return request(`${CONFIG.URL}/ui-test/run/share-detail`, {
    method: 'GET',
    params,
  });
}

export function subscribeUiTestRunStream(params, handlers) {
  return subscribeUiTestSse('/ui-test/run/stream', params, handlers);
}

export function subscribeSharedUiTestRunStream(params, handlers) {
  return subscribeUiTestSse('/ui-test/run/share-stream', params, handlers);
}

export function subscribeUiTestDebugStream(params, handlers) {
  return subscribeUiTestSse('/ui-test/run/debug-stream', params, handlers);
}

export async function getUiTestRunStepDetail(params) {
  return request(`${CONFIG.URL}/ui-test/run/step-detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function retryUiTestRun(data) {
  return request(`${CONFIG.URL}/ui-test/run/retry`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function stopUiTestRun(data) {
  return request(`${CONFIG.URL}/ui-test/run/stop`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}
