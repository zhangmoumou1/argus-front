import request from "@/utils/request";
import CONFIG from "@/consts/config";
import auth from "@/utils/auth";

// ==================== 通知渠道 ====================

export async function listNotificationChannels(params) {
  return request(`${CONFIG.URL}/api/notification/channel/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getNotificationChannelDetail(params) {
  return request(`${CONFIG.URL}/api/notification/channel/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertNotificationChannel(data) {
  return request(`${CONFIG.URL}/api/notification/channel/insert`, {
    method: 'PUT',
    data,
    headers: auth.headers(),
  });
}

export async function updateNotificationChannel(data) {
  return request(`${CONFIG.URL}/api/notification/channel/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteNotificationChannel(data) {
  return request(`${CONFIG.URL}/api/notification/channel/delete`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function testNotificationChannel(data) {
  return request(`${CONFIG.URL}/api/notification/channel/test`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

// ==================== 通知模板 ====================

export async function listNotificationTemplates(params) {
  return request(`${CONFIG.URL}/api/notification/template/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getNotificationTemplateDetail(params) {
  return request(`${CONFIG.URL}/api/notification/template/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertNotificationTemplate(data) {
  return request(`${CONFIG.URL}/api/notification/template/insert`, {
    method: 'PUT',
    data,
    headers: auth.headers(),
  });
}

export async function updateNotificationTemplate(data) {
  return request(`${CONFIG.URL}/api/notification/template/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteNotificationTemplate(data) {
  return request(`${CONFIG.URL}/api/notification/template/delete`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

// ==================== 用户组 ====================

export async function listNotificationGroups(params) {
  return request(`${CONFIG.URL}/api/notification/group/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getNotificationGroupDetail(params) {
  return request(`${CONFIG.URL}/api/notification/group/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertNotificationGroup(data) {
  return request(`${CONFIG.URL}/api/notification/group/insert`, {
    method: 'PUT',
    data,
    headers: auth.headers(),
  });
}

export async function updateNotificationGroup(data) {
  return request(`${CONFIG.URL}/api/notification/group/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteNotificationGroup(data) {
  return request(`${CONFIG.URL}/api/notification/group/delete`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

// ==================== 通知配置 ====================

export async function listNotificationConfigs(params) {
  return request(`${CONFIG.URL}/api/notification/config/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getNotificationConfigDetail(params) {
  return request(`${CONFIG.URL}/api/notification/config/detail`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertNotificationConfig(data) {
  return request(`${CONFIG.URL}/api/notification/config/insert`, {
    method: 'PUT',
    data,
    headers: auth.headers(),
  });
}

export async function updateNotificationConfig(data) {
  return request(`${CONFIG.URL}/api/notification/config/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteNotificationConfig(data) {
  return request(`${CONFIG.URL}/api/notification/config/delete`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

// ==================== 对外查询（测试计划下拉） ====================

export async function listAllNotificationConfigs(params) {
  return request(`${CONFIG.URL}/api/notification/config/list_all`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listEnabledChannels(params) {
  return request(`${CONFIG.URL}/api/notification/channel/list_enabled`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listEnabledTemplates(params) {
  return request(`${CONFIG.URL}/api/notification/template/list_enabled`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}
