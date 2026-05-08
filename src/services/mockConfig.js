import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

export async function listMockConfig(params) {
  return request(`${CONFIG.URL}/mock-config/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function saveMockConfig(data) {
  return request(`${CONFIG.URL}/mock-config/save`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function toggleMockConfig(data) {
  return request(`${CONFIG.URL}/mock-config/toggle`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteMockConfig(params) {
  return request(`${CONFIG.URL}/mock-config/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}
