import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

export async function listApiServices(params) {
  return request(`${CONFIG.URL}/interface-management/service/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertApiService(data) {
  return request(`${CONFIG.URL}/interface-management/service/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updateApiService(data) {
  return request(`${CONFIG.URL}/interface-management/service/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteApiService(params) {
  return request(`${CONFIG.URL}/interface-management/service/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function syncApiService(data) {
  return request(`${CONFIG.URL}/interface-management/service/sync`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function importSwagger(data) {
  return request(`${CONFIG.URL}/interface-management/import/swagger`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function importYapi(data) {
  return request(`${CONFIG.URL}/interface-management/import/yapi`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function listApiEndpoints(params) {
  return request(`${CONFIG.URL}/interface-management/endpoint/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function deprecateApiEndpoint(data) {
  return request(`${CONFIG.URL}/interface-management/endpoint/deprecate`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function listApiEndpointVersions(params) {
  return request(`${CONFIG.URL}/interface-management/endpoint/version/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getApiEndpointSample(params) {
  return request(`${CONFIG.URL}/interface-management/endpoint/sample/query`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function associateApiEndpointSample(data) {
  return request(`${CONFIG.URL}/interface-management/endpoint/sample/associate`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function clearApiEndpointSample(data) {
  return request(`${CONFIG.URL}/interface-management/endpoint/sample/clear`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function manualInputApiEndpointSample(data) {
  return request(`${CONFIG.URL}/interface-management/endpoint/sample/manual-input`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function getApiEndpointVersionDetail(params) {
  return request(`${CONFIG.URL}/interface-management/endpoint/version/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function compareApiEndpointVersion(params) {
  return request(`${CONFIG.URL}/interface-management/endpoint/version/compare`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}
