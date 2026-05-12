import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import AvatarDropdown from '@/components/RightContent/AvatarDropdown';
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

import { Breadcrumb, ConfigProvider, Empty, message, Spin } from 'antd';
import {
  BankOutlined,
  HistoryOutlined,
  MacCommandOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
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

type RouteEntry = {
  path: string;
  name?: string;
  hideInMenu?: boolean;
  labels: string[];
};

const routeNameText: Record<string, string> = {
  dashboard: '仪表盘',
};

const getRouteLabel = (name?: string) => {
  if (!name) return '';
  return routeNameText[name] || name;
};

const normalizePath = (path = '') => {
  const cleanPath = path.split('?')[0].replace(/\/+$/, '');
  return cleanPath || '/';
};

const createRouteMatcher = (path = '') => {
  const pattern = normalizePath(path)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([^/]+)/g, '[^/]+');
  return new RegExp(`^${pattern}$`, 'i');
};

const buildRouteEntries = (routes: any[] = []) => {
  const entries: RouteEntry[] = [];

  const walk = (items: any[] = [], parentPath = '', labels: string[] = []) => {
    items.forEach((item) => {
      if (!item?.path || item.path === '*') return;
      const fullPath = normalizePath(getFullPath(String(item.path), parentPath));
      const label = getRouteLabel(item.name);
      const currentLabels = label ? [...labels, label] : labels;
      if (label) {
        entries.push({
          path: fullPath,
          name: item.name,
          hideInMenu: item.hideInMenu,
          labels: currentLabels,
        });
      }
      if (Array.isArray(item.routes)) {
        walk(item.routes, fullPath, currentLabels);
      }
      if (Array.isArray(item.children)) {
        walk(item.children, fullPath, currentLabels);
      }
    });
  };

  walk(routes);
  return entries;
};

const routeEntries = buildRouteEntries(routesConfig as any[]);

const getRouteCrumbs = (pathname = '') => {
  const currentPath = normalizePath(pathname);
  const matched = routeEntries
    .filter((entry) => createRouteMatcher(entry.path).test(currentPath))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (!matched) return [];

  if (matched.labels.length === 1 && matched.hideInMenu) {
    const parent = routeEntries
      .filter((entry) => {
        if (entry.hideInMenu || entry.path === matched.path) return false;
        return currentPath === entry.path || currentPath.startsWith(`${entry.path}/`);
      })
      .sort((a, b) => b.path.length - a.path.length)[0];

    if (parent?.labels?.length) {
      return [...parent.labels, ...matched.labels.filter((label) => !parent.labels.includes(label))];
    }
  }

  return matched.labels;
};

const PageTopBar = ({ onOpenTheme }: { onOpenTheme: () => void }) => (
  <div className="argus-topbar">
    <RightContent onOpenTheme={onOpenTheme} />
  </div>
);

const GlobalPageShell = ({ children, toolbar }: { children: React.ReactNode; toolbar?: React.ReactNode }) => {
  const crumbs = getRouteCrumbs(history.location.pathname);

  return (
    <main className="argus-page-shell">
      {toolbar}
      {crumbs.length > 0 && (
        <div className="argus-page-shell__header">
          <Breadcrumb separator=">">
            {crumbs.map((item) => (
              <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
      )}
      <div className="argus-page-shell__content">{children}</div>
    </main>
  );
};

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
  const currentRole = Number(initialState?.currentUser?.role ?? 0);
  const isSuperAdmin = currentRole === 2;

  const canAccessMenu = (path: string) => {
    const currentPath = String(path || '');
    if (currentPath.startsWith('/system')) {
      return isSuperAdmin;
    }
    return true;
  };

  const normalizeMenuIcon = (icon: any) => {
    if (icon === 'project' || icon === 'Project' || icon === 'Porject') return <ProjectOutlined />;
    if (icon === 'macCommand' || icon === 'MacCommand') return <MacCommandOutlined />;
    if (icon === 'history' || icon === 'History') return <HistoryOutlined />;
    if (icon === 'bank' || icon === 'Bank') return <BankOutlined />;
    return icon;
  };

  const normalizeMenuData = (menuData: any[] = []): any[] =>
    menuData
      .filter((item) => canAccessMenu(String(item?.path || '')))
      .map((item) => {
        const children = Array.isArray(item?.children) ? normalizeMenuData(item.children) : item?.children;
        return {
          ...item,
          icon: normalizeMenuIcon(item?.icon),
          children,
        };
      });

  return {
    siderWidth: 260,
    headerRender: false,
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
    menuFooterRender: (props) => (props?.collapsed ? null : <AvatarDropdown variant="sider" />),
    menuDataRender: (menuData) => normalizeMenuData(menuData as any[]),
    childrenRender: (children) => {
      if (initialState?.loading) return <PageLoading />;
      return (
        <ConfigProvider
          renderEmpty={() => <Empty image={NoTableData} imageStyle={{ height: 160 }} description="暂无数据" />}
        >
          <GlobalPageShell
            toolbar={(
              <PageTopBar
                onOpenTheme={() => {
                  const handle = document.querySelector('[class*="pro-setting-drawer-handle"]') as HTMLElement | null;
                  handle?.click();
                }}
              />
            )}
          >
            {children}
            <IndexPage />
          </GlobalPageShell>
          <SettingDrawer
            disableUrlParams
            enableDarkTheme
            hideHintAlert
            hideCopyButton
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
