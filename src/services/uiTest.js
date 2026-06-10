import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

export async function scanUiTestCases(data) {
  return request(`${CONFIG.URL}/ui-test/case/scan`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

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
