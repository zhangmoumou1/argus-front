import CONFIG from '@/consts/config';
import {listProject} from '@/services/project';
import {listPendingReviewCases} from '@/services/testcase';
import auth from '@/utils/auth';
import {history, useLocation, useModel} from '@umijs/max';
import React, {useEffect} from 'react';
import {Modal, notification} from "antd";
import {BellOutlined} from '@ant-design/icons';


// @ts-ignore
const IndexPage: React.FC = () => {
  const {initialState} = useModel('@@initialState');
  const {noticeCount, setNoticeCount, refreshUnreadCount, pushLocalSystemNotice} = useModel("notice");
  const { currentUser } = initialState ?? {};
  const location = useLocation();
  const getDailyNoticeKey = (userId: number | string) => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `argus_pending_review_popup_${userId}_${y}-${m}-${d}`;
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      const ws = new WebSocket(`${CONFIG.WS_URL}/ws/${currentUser.id}`);
      ws.onmessage = function (event) {
        event.preventDefault()
        const messages = event.data;
        const msg = JSON.parse(messages)
        if (msg.type === 0) {
          setNoticeCount(msg.total ? msg.count : msg.count + noticeCount)
        } else if (msg.type === 1) {
          notification.info({
            message: msg.title,
            description: msg.content
          })
        } else if (msg.type === 3) {
          // 心跳包，忽略
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    refreshUnreadCount();
  }, [currentUser?.id]);

  useEffect(() => {
    const run = async () => {
      if (!currentUser?.id) return;
      if (location.pathname === '/user/login') return;

      const res = await listPendingReviewCases({});
      if (!auth.response(res, false)) return;
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) return;
      const dailyKey = getDailyNoticeKey(currentUser.id);
      const hasRemindedToday = localStorage.getItem(dailyKey) === '1';

      const myRows = rows.filter((item: any) => {
        const uid = Number(currentUser.id);
        const creators = [item.create_user, item.creator, item.create_user_id].map((v) => Number(v));
        const updaters = [item.update_user, item.updater, item.update_user_id].map((v) => Number(v));
        if (creators.includes(uid) || updaters.includes(uid)) {
          return true;
        }
        return false;
      });
      const targetRows = myRows.length > 0 ? myRows : rows;
      if (targetRows.length === 0) return;

      const projectRes = await listProject({page: 1, size: 10000});
      const projectMap: Record<string, string> = {};
      if (auth.response(projectRes, false)) {
        (projectRes.data || []).forEach((item: any) => {
          projectMap[String(item.id)] = item.name;
        });
      }

      const projectNameSet = new Set<string>();
      targetRows.forEach((item: any) => {
        const projectName = item.project_name || projectMap[String(item.project_id)] || `项目${item.project_id}`;
        if (projectName) {
          projectNameSet.add(projectName);
        }
      });

      const projectNames = Array.from(projectNameSet).join('、');
      const total = targetRows.length;
      const content = `项目${projectNames}下，共有${total}条接口用例的关联资产有新版本上线，请进入 接口测试>接口用例 下及时审查用例`;
      const bizKey = `pending-review-${currentUser.id}-${Array.from(projectNameSet).sort().join(',')}-${total}`;

      const inserted = pushLocalSystemNotice({
        title: '接口用例变更提醒',
        content,
        link: '/#/scenario/testcase',
        biz_key: bizKey,
      });
      if (!inserted && hasRemindedToday) return;
      if (hasRemindedToday) return;

      Modal.confirm({
        title: (
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 10}}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #e8f1ff 0%, #f0f7ff 100%)',
              }}
            >
              <BellOutlined style={{color: '#1677ff', fontSize: 15}}/>
            </span>
            <span style={{fontSize: 17, fontWeight: 600, color: '#1f2937'}}>接口用例变更提醒</span>
          </span>
        ),
        icon: null,
        centered: true,
        width: 660,
        closable: true,
        maskClosable: true,
        content: (
          <div
            style={{
              marginTop: 12,
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1.8,
              color: '#344054',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 560,
                padding: '16px 18px',
                background: 'linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%)',
                border: '1px solid #dbeafe',
                borderLeft: '4px solid #3b82f6',
                borderRadius: 10,
                textAlign: 'left',
                boxShadow: '0 6px 16px rgba(59,130,246,0.08)',
                fontSize: 14,
              }}
            >
              {content}
            </div>
          </div>
        ),
        okText: '去处理',
        cancelText: '关闭',
        onOk: () => {
          history.push('/scenario/testcase');
        },
        onCancel: () => {
        },
      });
      localStorage.setItem(dailyKey, '1');
    };
    run();
  }, [currentUser?.id]);

  return (
    <></>
  );
};

export default IndexPage;
