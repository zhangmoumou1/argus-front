import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

export async function listFunctionalCaseDirectory(params) {
  return request(`${CONFIG.URL}/functional-case/directory`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertFunctionalCaseDirectory(data) {
  return request(`${CONFIG.URL}/functional-case/directory/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updateFunctionalCaseDirectory(data) {
  return request(`${CONFIG.URL}/functional-case/directory/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteFunctionalCaseDirectory(params) {
  return request(`${CONFIG.URL}/functional-case/directory/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function moveFunctionalCaseDirectory(data) {
  return request(`${CONFIG.URL}/functional-case/directory/move`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function listFunctionalCaseFiles(params) {
  return request(`${CONFIG.URL}/functional-case/file/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function queryFunctionalCaseFile(params) {
  return request(`${CONFIG.URL}/functional-case/file/query`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertFunctionalCaseFile(data) {
  return request(`${CONFIG.URL}/functional-case/file/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updateFunctionalCaseFile(data) {
  return request(`${CONFIG.URL}/functional-case/file/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteFunctionalCaseFile(params) {
  return request(`${CONFIG.URL}/functional-case/file/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function moveFunctionalCaseFile(data) {
  return request(`${CONFIG.URL}/functional-case/file/move`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function aiGenerateFunctionalCase(data) {
  return request(`${CONFIG.URL}/functional-case/file/ai-generate`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function listFunctionalCaseSkillDocs(params) {
  return request(`${CONFIG.URL}/functional-case/skill-doc/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertFunctionalCaseSkillDoc(data) {
  return request(`${CONFIG.URL}/functional-case/skill-doc/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updateFunctionalCaseSkillDoc(data) {
  return request(`${CONFIG.URL}/functional-case/skill-doc/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteFunctionalCaseSkillDoc(params) {
  return request(`${CONFIG.URL}/functional-case/skill-doc/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function createFunctionalCaseSkillTask(data) {
  return request(`${CONFIG.URL}/functional-case/skill-task/create`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function queryFunctionalCaseSkillTask(params) {
  return request(`${CONFIG.URL}/functional-case/skill-task/status`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function uploadFunctionalCaseNodeImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request(`${CONFIG.URL}/functional-case/file/image/upload`, {
    method: 'POST',
    data: formData,
    requestType: 'form',
    headers: auth.headers(false),
  });
}
