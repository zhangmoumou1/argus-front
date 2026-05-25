import {deleteNotice, queryNotices, updateNotices} from '@/services/user';
import auth from "@/utils/auth";
import {useState} from 'react';

const LOCAL_NOTICE_KEY = 'argus_local_system_notices_v1';
const LOCAL_NOTICE_ID_PREFIX = 'local-notice-';

const readLocalNotices = () => {
  try {
    const text = localStorage.getItem(LOCAL_NOTICE_KEY);
    if (!text) return [];
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
};

const saveLocalNotices = (items: any[]) => {
  localStorage.setItem(LOCAL_NOTICE_KEY, JSON.stringify(items || []));
};

const isLocalNotice = (id: any) => String(id || '').startsWith(LOCAL_NOTICE_ID_PREFIX);

export default () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [ws, setWs] = useState(null);
  const [noticeCount, setNoticeCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const saveNotices = (payload: any[]) => {
    setNotices(payload)
  }

  const clearNotices = (payload: string) => {
    const count = notices.length;
    const unreadCount = notices.filter((item) => !item.read).length || 0;
    setNotices(notices.filter((item) => item.type !== payload))
    setTotalCount(count)
    setUnreadCount(unreadCount)
  }

  const normalizeLocalNotice = (item: any) => ({
    id: item.id,
    msg_title: item.msg_title,
    msg_content: item.msg_content,
    msg_type: 1,
    sender: 0,
    created_at: item.created_at,
    link: item.link || '/#/scenario/testcase',
    read: !!item.read,
    local: true,
    biz_key: item.biz_key,
  });

  const filterLocalNotices = (items: any[], params: Record<string, string | number>) => {
    const msgType = String(params?.msg_type ?? '0');
    const msgStatus = String(params?.msg_status ?? '1');
    return items.filter((item) => {
      if (msgType === '1' || msgType === '0') {
        const unreadMatch = msgStatus === '1' ? !item.read : !!item.read;
        return unreadMatch;
      }
      return false;
    });
  };

  const refreshUnreadCount = async () => {
    const remoteUnread = await queryNotices({msg_status: '1', msg_type: '0'});
    const localUnread = readLocalNotices().filter((item: any) => !item.read);
    setNoticeCount((remoteUnread?.length || 0) + localUnread.length);
  };

  const fetchNotices = async (params: Record<string, string | number>) => {
    const remote = await queryNotices(params);
    const local = filterLocalNotices(readLocalNotices().map(normalizeLocalNotice), params);
    const merged = [...local, ...(remote || [])].sort((a, b) => {
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });
    saveNotices(merged);
    return merged;
  }

  const deleteNotices = async (idList: number[]) => {
    const ids = Array.isArray(idList) ? idList : [];
    const localIds = ids.filter((id: any) => isLocalNotice(id));
    const remoteIds = ids.filter((id: any) => !isLocalNotice(id));

    if (localIds.length > 0) {
      const next = readLocalNotices().filter((item: any) => !localIds.includes(item.id));
      saveLocalNotices(next);
    }
    if (remoteIds.length > 0) {
      const resp = await deleteNotice(remoteIds as any);
      auth.response(resp);
    }
    await refreshUnreadCount();
  }

  const readNotices = async (data: any[]) => {
    const localReadIds = data?.filter(item => item.local && isLocalNotice(item.id)).map(item => item.id) || [];
    if (localReadIds.length > 0) {
      const next = readLocalNotices().map((item: any) => (
        localReadIds.includes(item.id) ? {...item, read: true} : item
      ));
      saveLocalNotices(next);
    }

    const remoteRows = data?.filter(item => !item.local) || [];
    const broadcast = remoteRows.filter(item => item.msg_type === 1).map(item => item.id) || [];
    const personal = remoteRows.filter(item => item.msg_type === 2).map(item => item.id) || [];
    if (broadcast.length > 0 || personal.length > 0) {
      const resp = await updateNotices({broadcast, personal})
      auth.response(resp)
    }
    await refreshUnreadCount();
  }

  const pushLocalSystemNotice = (notice: {
    title: string,
    content: string,
    link?: string,
    biz_key?: string,
  }) => {
    const current = readLocalNotices();
    if (notice.biz_key && current.some((item: any) => item.biz_key === notice.biz_key)) {
      return false;
    }
    const item = {
      id: `${LOCAL_NOTICE_ID_PREFIX}${Date.now()}`,
      msg_title: notice.title,
      msg_content: notice.content,
      link: notice.link || '/#/scenario/testcase',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      read: false,
      biz_key: notice.biz_key,
    };
    saveLocalNotices([item, ...current]);
    setNoticeCount((count) => count + 1);
    return true;
  }

  return {
    clearNotices,
    fetchNotices,
    notices,
    totalCount,
    noticeCount,
    ws,
    setWs,
    unreadCount,
    deleteNotices,
    setNoticeCount,
    readNotices,
    setTotalCount,
    refreshUnreadCount,
    pushLocalSystemNotice,
  }
}
