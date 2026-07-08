import {message, notification} from 'antd';

let messageApi: any = message;
import type {ArgusResponse} from '@/services/user';
import {NotificationPlacement} from "antd/es/notification/interface";
import {listUsers} from "@/services/user";
import {RequestOptions} from "@@/plugin-request/request";

interface headers {
  token: string;
  "Content-Type"?: string;
}

const auth = {
  setMessageApi: (api?: any) => {
    messageApi = api || message;
  },
  getMessageApi: () => messageApi,
  isReadonlyReplicaError: (msg?: string) => {
    return typeof msg === 'string' && msg.toLowerCase().includes('read only replica');
  },
  headers: (json = true): RequestOptions => {
    const token = localStorage.getItem('argusToken') || '';
    const header: headers = {token};
    if (json) {
      header['Content-Type'] = 'application/json';
    }
    return header;
  },
  notificationResponse: (res: ArgusResponse, info = false, position: NotificationPlacement = 'topRight') => {
    if (!res || res.code === undefined) {
      notification.error({message: "网络开小差了，请稍后重试", placement: position})
      return false;
    }
    if (res.code === 0) {
      if (info) {
        notification.success({
          message: res.msg,
          placement: position,
        });
      }
      return true;
    }
    if (res.code === 401) {
      if (auth.isReadonlyReplicaError(res.msg)) {
        notification.error({
          message: res.msg,
          placement: position,
        });
        return false;
      }
      // 说明用户未认证
      // messageApi.info(res.msg);
      localStorage.removeItem('argusToken');
      localStorage.removeItem('argusUser');
      const href = window.location.href;
      if (href.indexOf("/user/login") === -1) {
        const uri = href.split("redirect=")
        window.location.href = `/#/user/login?redirect=${uri[uri.length - 1]}`
        // window.open(`/#/user/login?redirect=${href}`)
      }
      notification.info({
        message: res.msg,
        placement: position,
      });
      return false;
    }
    notification.error({message: res.msg, placement: position})
    return false;
  },
  response: (res: ArgusResponse, info = false) => {
    if (!res || res.code === undefined) {
      messageApi.error("网络开小差了，请稍后重试")
      return false;
    }
    if (res.code === 0) {
      if (info) {
        messageApi.success(res.msg);
      }
      return true;
    }
    if (res.code === 401) {
      if (auth.isReadonlyReplicaError(res.msg)) {
        messageApi.error(res.msg);
        return false;
      }
      // 说明用户未认证
      // messageApi.info(res.msg);
      localStorage.removeItem('argusToken');
      localStorage.removeItem('argusUser');
      const href = window.location.href;
      if (href.indexOf("/user/login") === -1) {
        const uri = href.split("redirect=")
        window.location.href = `/#/user/login?redirect=${uri[uri.length - 1]}`
        // window.open(`/#/user/login?redirect=${href}`)
      }
      messageApi.info(res.msg);
      return false;
    }
    messageApi.error(res.msg);
    return false;
  },
  getUserMap: async () => {
    const user = await listUsers();
    const temp: Record<any, any> = {};
    user.forEach((item: any) => {
      temp[item?.id] = item;
    });
    return temp;
  }
};

export default auth;
