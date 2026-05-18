import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

export async function listPerformancePlan(params) {
  return request(`${CONFIG.URL}/performance/plan/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertPerformancePlan(data) {
  return request(`${CONFIG.URL}/performance/plan/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updatePerformancePlan(data) {
  return request(`${CONFIG.URL}/performance/plan/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deletePerformancePlan(params) {
  return request(`${CONFIG.URL}/performance/plan/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function executePerformancePlan(params) {
  return request(`${CONFIG.URL}/performance/plan/execute`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listPerformanceReport(params) {
  return request(`${CONFIG.URL}/performance/report/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function queryPerformanceReport(params) {
  return request(`${CONFIG.URL}/performance/report`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function queryPerformancePlanSource(params) {
  return request(`${CONFIG.URL}/performance/plan/source`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listPerformanceParameterFiles(params) {
  return request(`${CONFIG.URL}/performance/parameter-files`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function uploadPerformanceParameterFile(data) {
  return request(`${CONFIG.URL}/performance/parameter-files/upload`, {
    method: 'POST',
    data,
    headers: auth.headers(false),
  });
}

export async function previewPerformanceParameterFile(params) {
  return request(`${CONFIG.URL}/performance/parameter-files/preview`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function deletePerformanceParameterFile(params) {
  return request(`${CONFIG.URL}/performance/parameter-files/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function validatePerformancePlanParameters(data) {
  return request(`${CONFIG.URL}/performance/plan/validate-parameters`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function queryPerformanceCasePreview(params) {
  return request(`${CONFIG.URL}/performance/plan/case-preview`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function queryPerformanceRunLogs(params) {
  return request(`${CONFIG.URL}/performance/run/logs`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function queryPerformanceMonitorConfig() {
  return request(`${CONFIG.URL}/performance/monitor/config`, {
    method: 'GET',
    headers: auth.headers(),
  });
}
