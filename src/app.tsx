import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { PageLoading, Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { currentUser as queryCurrentUser, LoginUser } from './services/auth';
import React from 'react';
import NoTableData from '@/assets/NoSearch.svg';
import routesConfig from '../config/routes';
import { keepaliveEmitter } from '@@/plugin-keepalive/context';

import { ConfigProvider, Empty, message, Modal, Spin } from 'antd';
import IndexPage from '@/pages/IndexPage';
import { Loading } from '@icon-park/react';

const loginPath = '/user/login';
Spin.setDefaultIndicator(<Loading spin={true} theme="outline" size="36" fill="#4a90e2" strokeLinecap="butt" />);

declare global {
  interface Window {
    __FUNCTIONAL_CASE_UNSAVED__?: {
      dirty?: boolean;
      path?: string;
    };
  }
}

const getFullPath = (currPath = '', parentPath = '') => {
  if (!currPath) return parentPath;
  if (currPath.startsWith('/')) return currPath;
  return `${parentPath.replace(/\/$/, '')}/${currPath}`;
};

const buildTabsLocalConfig = (routes: any[] = []) => {
  const config = {
    local: {},
    icon: {},
  } as { local: Record<string, string>; icon: Record<string, string> };

  const walk = (items: any[] = [], parentPath = '') => {
    items.forEach((item) => {
      const fullPath = getFullPath(String(item?.path || '').toLowerCase(), parentPath.toLowerCase());
      if (item?.name && fullPath && item.path !== '*') {
        config.local[fullPath] = item.name;
        if (item?.icon) {
          config.icon[fullPath] = item.icon;
        }
      }
      if (Array.isArray(item?.routes)) {
        walk(item.routes, fullPath);
      }
      if (Array.isArray(item?.children)) {
        walk(item.children, fullPath);
      }
    });
  };

  walk(routes);
  return config;
};

const tabsLocalConfig = buildTabsLocalConfig(routesConfig as any[]);

export const tabsLayout = ({ initialState }: { initialState?: any }) => ({
  ...tabsLocalConfig,
  initialState,
  onEdit: (targetKey: string | { key?: string }, action?: string) => {
    const actionType = typeof action === 'string' ? action : 'remove';
    if (actionType !== 'remove') return;
    const rawKey = typeof targetKey === 'string' ? targetKey : targetKey?.key || '';
    const path = String(rawKey || '').split('::')[0]?.toLowerCase();
    if (!path) return;

    const closeTab = () => {
      keepaliveEmitter?.emit?.({
        type: 'closeTab',
        payload: { path },
      });
    };

    const unsavedState = window.__FUNCTIONAL_CASE_UNSAVED__ || {};
    const dirtyPath = String(unsavedState?.path || '').toLowerCase();
    if (unsavedState?.dirty && dirtyPath && dirtyPath === path) {
      Modal.confirm({
        title: '未保存提醒',
        content: '你有未保存用例，是否关闭窗口',
        okText: '关闭',
        cancelText: '取消',
        onOk: closeTab,
      });
      return;
    }

    closeTab();
  },
});

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: LoginUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<LoginUser | undefined>;
}> {
  const isReadonlyReplicaError = (msg?: string): boolean =>
    typeof msg === 'string' && msg.toLowerCase().includes('read only replica');

  const getLocalUser = (): LoginUser | undefined => {
    const userText = localStorage.getItem('pityUser');
    if (!userText) {
      return undefined;
    }
    try {
      return JSON.parse(userText) as LoginUser;
    } catch (e) {
      localStorage.removeItem('pityUser');
      return undefined;
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('pityToken');
      if (!token) {
        history.push(loginPath);
        return;
      }
      const msg = await queryCurrentUser({ token });
      if (msg.code !== 0) {
        if (msg.code === 401 && !isReadonlyReplicaError(msg.msg)) {
          localStorage.removeItem('pityToken');
          localStorage.removeItem('pityUser');
          throw new Error(msg.msg || '未登录');
        }
        const localUser = getLocalUser();
        if (localUser) {
          message.warning(`${msg.msg || '获取用户信息失败'}，已使用本地登录信息`);
          return localUser;
        }
        throw new Error(msg.msg || '获取用户信息失败');
      }
      localStorage.setItem('pityUser', JSON.stringify(msg.data));
      return msg.data;
    } catch (error) {
      const localUser = getLocalUser();
      if (localUser) {
        return localUser;
      }
      history.push(loginPath);
    }
    return undefined;
  };
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings,
    };
  }

  return {
    fetchUserInfo,
    settings: defaultSettings,
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    siderWidth: 216,
    rightContentRender: () => <RightContent />,
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    layoutBgImgList: [
      {
        src: 'https://img.alicdn.com/imgextra/i2/O1CN01O4etvp1DvpFLKfuWq_!!6000000000279-2-tps-609-606.png',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://img.alicdn.com/imgextra/i2/O1CN01O4etvp1DvpFLKfuWq_!!6000000000279-2-tps-609-606.png',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://img.alicdn.com/imgextra/i3/O1CN018NxReL1shX85Yz6Cx_!!6000000005798-2-tps-884-496.png',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: [],
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      if (initialState?.loading) return <PageLoading />;
      return (
        <ConfigProvider
          renderEmpty={() => <Empty image={NoTableData} imageStyle={{ height: 160 }} description="暂无数据" />}
        >
          <div style={{ paddingBottom: 40 }}>
            {children}
            <IndexPage />
          </div>
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            settings={initialState?.settings}
            onSettingChange={(settings) => {
              setInitialState((preInitialState) => ({
                ...preInitialState,
                settings,
              }));
            }}
          />
        </ConfigProvider>
      );
    },
    ...initialState?.settings,
  };
};

export const request = {
  ...errorConfig,
};
