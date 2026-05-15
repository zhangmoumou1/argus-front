import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { PageLoading, Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { currentUser as queryCurrentUser, LoginUser } from './services/auth';
import React, { useEffect } from 'react';
import NoTableData from '@/assets/NoSearch.svg';
import routesConfig from '../config/routes';

import { Breadcrumb, ConfigProvider, Empty, message, Spin } from 'antd';
import {
  BankOutlined,
  AreaChartOutlined,
  HistoryOutlined,
  MacCommandOutlined,
  MenuOutlined,
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

const hexToRgba = (color = '#1677ff', alpha = 1) => {
  const normalized = String(color).trim().replace('#', '');
  const full = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return `rgba(22, 119, 255, ${alpha})`;
  }

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

const isKnowledgePath = (pathname = '') => normalizePath(pathname) === '/knowledge';

const isPublicKnowledgeShare = (locationLike?: { pathname?: string; search?: string }) => {
  const pathname = normalizePath(locationLike?.pathname || '');
  return pathname === '/knowledge/docs';
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

const PageTopBar = ({
  crumbs,
  onOpenTheme,
}: {
  crumbs: string[];
  onOpenTheme: () => void;
}) => {
  const onToggleSider = () => {
    const nextCollapsed = !document.body.classList.contains('argus-sider-collapsed');
    document.body.classList.toggle('argus-sider-collapsed', nextCollapsed);
    document.querySelectorAll('.ant-pro-sider .ant-menu-inline-collapsed').forEach((menu) => {
      menu.classList.remove('ant-menu-inline-collapsed');
    });
    document.querySelectorAll('.ant-menu-submenu-popup').forEach((popup) => {
      popup.parentElement?.removeChild(popup);
    });
  };

  return (
    <header className="argus-topbar">
      <div className="argus-topbar__left">
        <button className="argus-topbar__toggle" type="button" aria-label="Toggle Sidebar" onClick={onToggleSider}>
          <MenuOutlined />
        </button>
        {crumbs.length > 0 && (
          <Breadcrumb className="argus-topbar__breadcrumb" separator=">">
            {crumbs.map((item) => (
              <Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
        )}
      </div>
      <div className="argus-topbar__right">
        <RightContent onOpenTheme={onOpenTheme} />
      </div>
    </header>
  );
};

const GlobalPageShell = ({
  children,
  toolbar,
  accentColor,
}: {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  accentColor?: string;
}) => {
  const accent = accentColor || '#1677ff';
  const accentSoft = hexToRgba(accent, 0.12);
  const shellStyle = {
    ['--argus-accent' as const]: accent,
    ['--argus-accent-soft' as const]: accentSoft,
  } as React.CSSProperties;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--argus-accent', accent);
    root.style.setProperty('--argus-accent-soft', accentSoft);
  }, [accent, accentSoft]);

  return (
    <main className="argus-page-shell" style={shellStyle}>
      {toolbar}
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
  if (isPublicKnowledgeShare(location)) {
    return {
      fetchUserInfo,
      settings: defaultSettings,
    };
  }
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
  const currentLocation = history.location;
  const hideAppShellForKnowledge = isKnowledgePath(currentLocation.pathname);

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
    if (icon === 'areaChart' || icon === 'AreaChart' || icon === 'barChart' || icon === 'BarChart') return <AreaChartOutlined />;
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
    siderWidth: 290,
    headerRender: false,
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => (hideAppShellForKnowledge ? false : <Footer />),
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath && !isPublicKnowledgeShare(location)) {
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
    menuFooterRender: false,
    menuRender: (props, defaultDom) => (hideAppShellForKnowledge ? false : defaultDom),
    menuDataRender: (menuData) => normalizeMenuData(menuData as any[]),
    childrenRender: (children) => {
      if (initialState?.loading) return <PageLoading />;
      if (hideAppShellForKnowledge) {
        return (
          <ConfigProvider
            renderEmpty={() => <Empty image={NoTableData} imageStyle={{ height: 160 }} description="暂无数据" />}
          >
            {children}
          </ConfigProvider>
        );
      }
      return (
        <ConfigProvider
          renderEmpty={() => <Empty image={NoTableData} imageStyle={{ height: 160 }} description="暂无数据" />}
        >
          <GlobalPageShell
            accentColor={initialState?.settings?.colorPrimary}
            toolbar={(
              <PageTopBar
                crumbs={getRouteCrumbs(history.location.pathname)}
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
