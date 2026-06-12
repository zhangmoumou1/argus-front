import request from "@/utils/request";
import CONFIG from "@/consts/config";
import auth from "@/utils/auth";

export async function listTestReport(params) {
  return request(`${CONFIG.URL}/testcase/report/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function queryReport(params) {
  return request(`${CONFIG.URL}/testcase/report`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function querySharedReport(params) {
  return request(`${CONFIG.URL}/share/report`, {
    method: 'GET',
    params,
  });
}

export async function stopTestReport(data) {
  return request(`${CONFIG.URL}/testcase/report/stop`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}
