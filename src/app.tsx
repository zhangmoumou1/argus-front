import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { PageLoading, Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { currentUser as queryCurrentUser, LoginUser } from './services/auth';
import { queryFunctionalCaseGenerateTask } from './services/functionalCase';
import React, { useEffect, useRef } from 'react';
import NoTableData from '@/assets/NoSearch.svg';
import routesConfig from '../config/routes';

import { Breadcrumb, Button, ConfigProvider, Empty, message, notification, Spin } from 'antd';
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
    __FUNCTIONAL_CASE_TASK_POLLING__?: boolean;
    __FUNCTIONAL_CASE_RESULT_CACHE__?: Record<string, any>;
  }
}

const FUNCTIONAL_CASE_ROUTE_PATH = '/scene-design/functionalCase';
const FUNCTIONAL_CASE_RESULT_STORAGE_PREFIX = 'functional_case_skill_result_';
const FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY = 'functional_case_skill_active_tasks';

const isFunctionalCaseRoutePath = (pathname = '') => {
  const cleanPath = String(pathname || '').trim().toLowerCase();
  return cleanPath === '/scene-design/functionalcase'
    || cleanPath === '/scenario/functionalcase'
    || cleanPath === '/apitest/functionalcase';
};

const countGeneratedFunctionalCases = (data: any): number => {
  if (!data || typeof data !== 'object') return 0;
  const root = data.root && typeof data.root === 'object' ? data.root : data;
  let count = 0;
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    const text = String(node?.data?.text || '').trim();
    if (/(^|[\s_（(-])P[0-2]([\s_）)-]|$)/i.test(text)) {
      count += 1;
    }
    (Array.isArray(node.children) ? node.children : []).forEach(walk);
  };
  walk(root);
  return count;
};

const resolveGeneratedFunctionalCaseCount = (payload: any): number => {
  const explicitCount = Number(payload?.case_count || payload?.case_num || 0);
  if (explicitCount > 0) return explicitCount;
  return countGeneratedFunctionalCases(payload?.data);
};

const buildFunctionalCaseResultToken = (taskId?: string | number | null, caseId?: string | number | null) => {
  const rawTaskId = String(taskId || '').trim();
  if (rawTaskId) return rawTaskId;
  return `case_${caseId || 'unknown'}_${Date.now()}`;
};

const buildFunctionalCaseResultUrl = ({
  projectId,
  caseId,
  resultToken,
}: {
  projectId?: string | number | null;
  caseId?: string | number | null;
  resultToken?: string | number | null;
}) => {
  const query = new URLSearchParams();
  if (projectId) query.set('projectId', String(projectId));
  if (caseId) query.set('caseId', String(caseId));
  if (resultToken) query.set('resultToken', String(resultToken));
  const search = query.toString();
  return search ? `${FUNCTIONAL_CASE_ROUTE_PATH}?${search}` : FUNCTIONAL_CASE_ROUTE_PATH;
};

const getFunctionalCaseResultStorageKey = (resultToken: string) => `${FUNCTIONAL_CASE_RESULT_STORAGE_PREFIX}${resultToken}`;

const persistFunctionalCaseResult = (resultToken: string, payload: Record<string, any>) => {
  if (!resultToken || !payload) return;
  window.__FUNCTIONAL_CASE_RESULT_CACHE__ = window.__FUNCTIONAL_CASE_RESULT_CACHE__ || {};
  window.__FUNCTIONAL_CASE_RESULT_CACHE__[resultToken] = payload;
  try {
    sessionStorage.setItem(getFunctionalCaseResultStorageKey(resultToken), JSON.stringify(payload));
  } catch (error) {
    // ignore storage quota errors
  }
};

type FunctionalCaseActiveTask = {
  taskId: number | string;
  projectId?: number | string | null;
  targetCaseId?: number | string | null;
  targetCaseTitle?: string;
  requestStartedAt?: number;
  resultToken?: string;
};

const readFunctionalCaseActiveTasks = (): FunctionalCaseActiveTask[] => {
  try {
    const raw = sessionStorage.getItem(FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.taskId) : [];
  } catch (error) {
    return [];
  }
};

const writeFunctionalCaseActiveTasks = (tasks: FunctionalCaseActiveTask[]) => {
  try {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      sessionStorage.removeItem(FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(FUNCTIONAL_CASE_ACTIVE_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // ignore storage errors
  }
};

const removeFunctionalCaseActiveTask = (taskId?: number | string | null) => {
  if (!taskId && taskId !== 0) return;
  const taskIdText = String(taskId);
  const remainTasks = readFunctionalCaseActiveTasks().filter((item) => String(item?.taskId) !== taskIdText);
  writeFunctionalCaseActiveTasks(remainTasks);
};

const parseFunctionalCaseTimeToMs = (value: unknown) => {
  if (!value && value !== 0) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }
  const raw = String(value).trim();
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) {
    const numericValue = Number(raw);
    return numericValue > 1e12 ? numericValue : numericValue * 1000;
  }
  const parsed = new Date(raw.replace('T', ' ').replace(/-/g, '/')).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatFunctionalCaseElapsedText = (durationMs: number) => {
  if (!Number.isFinite(durationMs) || durationMs < 0) return '';
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}秒`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分钟${seconds}秒`;
};

const resolveFunctionalCaseElapsedText = ({
  taskLogs,
  startedAt,
  finishedAt,
  fallbackStartedAt,
  fallbackFinishedAt,
}: {
  taskLogs?: any[];
  startedAt?: unknown;
  finishedAt?: unknown;
  fallbackStartedAt?: unknown;
  fallbackFinishedAt?: unknown;
}) => {
  const logList = Array.isArray(taskLogs) ? taskLogs : [];
  const firstLogTime = parseFunctionalCaseTimeToMs(logList[0]?.time);
  const lastLogTime = parseFunctionalCaseTimeToMs(logList[logList.length - 1]?.time);
  const startMs = parseFunctionalCaseTimeToMs(startedAt) || firstLogTime || parseFunctionalCaseTimeToMs(fallbackStartedAt);
  const endMs = parseFunctionalCaseTimeToMs(finishedAt) || lastLogTime || parseFunctionalCaseTimeToMs(fallbackFinishedAt);
  if (!startMs || !endMs || endMs < startMs) return '';
  return formatFunctionalCaseElapsedText(endMs - startMs);
};

const appendFunctionalCaseElapsedText = (text = '', elapsedText = '') => {
  if (!elapsedText) return text;
  if (!text) return `耗时 ${elapsedText}`;
  if (String(text).includes('耗时')) return text;
  return `${text}，耗时 ${elapsedText}`;
};

const FunctionalCaseTaskWatcher = () => {
  const timerRef = useRef<number | null>(null);
  const pollingRef = useRef(false);
  const pollTasksRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = (delay = 2000) => {
      if (cancelled) return;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        void pollTasksRef.current?.();
      }, delay);
    };

    const pollTasks = async () => {
      if (cancelled || pollingRef.current) return;
      const currentPath = history.location?.pathname || '';
      const routeActive = isFunctionalCaseRoutePath(currentPath);
      const pagePolling = Boolean(window.__FUNCTIONAL_CASE_TASK_POLLING__);
      const activeTasks = readFunctionalCaseActiveTasks();
      if (activeTasks.length === 0) {
        scheduleNext(3000);
        return;
      }
      if (routeActive && pagePolling) {
        scheduleNext(2000);
        return;
      }

      pollingRef.current = true;
      try {
        for (const task of activeTasks) {
          const res = await queryFunctionalCaseGenerateTask({ id: task.taskId });
          if (cancelled) return;
          if (res?.code !== 0) {
            continue;
          }
          const statusData = res?.data || {};
          const generatedPayload = statusData?.result && typeof statusData.result === 'object' ? statusData.result : statusData;

          if (generatedPayload?.data && typeof generatedPayload.data === 'object') {
            const targetCaseId = Number(task.targetCaseId || statusData.case_file_id || generatedPayload.case_file_id || 0);
            const resultToken = String(task.resultToken || buildFunctionalCaseResultToken(task.taskId, targetCaseId));
            const caseCount = resolveGeneratedFunctionalCaseCount(generatedPayload);
            const elapsedText = resolveFunctionalCaseElapsedText({
              taskLogs: statusData.task_logs,
              startedAt: generatedPayload.started_at || statusData.started_at,
              finishedAt: generatedPayload.finished_at || statusData.finished_at,
              fallbackStartedAt: task.requestStartedAt,
              fallbackFinishedAt: Date.now(),
            });
            persistFunctionalCaseResult(resultToken, {
              ...task,
              resultToken,
              projectId: task.projectId || statusData.project_id || generatedPayload.project_id,
              targetCaseId,
              title: generatedPayload.title || task.targetCaseTitle || '功能用例',
              targetCaseTitle: task.targetCaseTitle || generatedPayload.title || '功能用例',
              data: generatedPayload.data,
              caseCount,
              reviewProvider: generatedPayload.review_provider || statusData.review_provider || '',
              reviewRounds: Number(generatedPayload.review_rounds || statusData.review_rounds || 0),
              elapsedText,
            });

            const shouldNotify = !routeActive || !pagePolling;
            if (shouldNotify) {
              const targetTitle = task.targetCaseTitle || generatedPayload.title || '功能用例';
              const description = appendFunctionalCaseElapsedText(
                `功能用例“${targetTitle}”已生成完成${caseCount ? `，识别到 ${caseCount} 条候选用例` : ''}`,
                elapsedText,
              );
              const notificationKey = `functional_case_generate_${resultToken}`;
              notification.success({
                key: notificationKey,
                message: '用例生成完成',
                description,
                duration: 0,
                btn: (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      notification.destroy(notificationKey);
                      history.push(buildFunctionalCaseResultUrl({
                        projectId: task.projectId || statusData.project_id || generatedPayload.project_id,
                        caseId: targetCaseId,
                        resultToken,
                      }));
                    }}
                  >
                    查看
                  </Button>
                ),
              });
            }

            removeFunctionalCaseActiveTask(task.taskId);
            continue;
          }

          const status = String(statusData.status || statusData.stage || '').toLowerCase();
          if (status === 'cancelled' || status.includes('cancel')) {
            removeFunctionalCaseActiveTask(task.taskId);
            continue;
          }
          if (status === 'failed' || status.includes('fail')) {
            notification.error({
              message: '模型生成失败',
              description: statusData.error_message || `功能用例“${task.targetCaseTitle || task.targetCaseId || ''}”生成失败`,
            });
            removeFunctionalCaseActiveTask(task.taskId);
          }
        }
        const latestTasks = readFunctionalCaseActiveTasks();
        writeFunctionalCaseActiveTasks(latestTasks);
        if (latestTasks.length === 0) {
          scheduleNext(3000);
          return;
        }
      } catch (error) {
        // keep tasks and retry later
      } finally {
        pollingRef.current = false;
        scheduleNext(2000);
      }
    };

    pollTasksRef.current = pollTasks;
    void pollTasks();
    const unlisten = history.listen(() => {
      void pollTasks();
    });
    return () => {
      cancelled = true;
      pollingRef.current = false;
      pollTasksRef.current = null;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      unlisten?.();
    };
  }, []);

  return null;
};


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

type RouteCrumb = {

  label: string;

  path?: string;

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



const isKnowledgePath = (pathname = '') => {

  const path = normalizePath(pathname);

  return path === '/knowledge' || path.startsWith('/knowledge/');

};



const isPublicKnowledgeShare = (locationLike?: { pathname?: string; search?: string }) => {

  const pathname = normalizePath(locationLike?.pathname || '');

  return pathname === '/knowledge/docs';

};



const isPublicReportShare = (locationLike?: { pathname?: string; search?: string }) => {

  const pathname = normalizePath(locationLike?.pathname || '');

  return (pathname.startsWith('/run/api-report/') && locationLike?.search?.includes('share=1'))

    || pathname.startsWith('/share/report/')

    || pathname.startsWith('/share/ui-report/');

};



const isPublicHashShare = () => {

  const hash = window.location.hash || '';

  return hash === '#/knowledge/docs'

    || hash.startsWith('#/share/report/')

    || hash.startsWith('#/share/ui-report/');

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



const fillPathParams = (pathPattern = '', pathname = '') => {

  const patternParts = normalizePath(pathPattern).split('/').filter(Boolean);

  const currentParts = normalizePath(pathname).split('/').filter(Boolean);

  const resolved = patternParts.map((part, index) => {

    if (part.startsWith(':')) {

      return currentParts[index] || part;

    }

    return part;

  });

  return `/${resolved.join('/')}`;

};



const getRouteCrumbs = (pathname = ''): RouteCrumb[] => {

  const currentPath = normalizePath(pathname);

  const matched = routeEntries

    .filter((entry) => createRouteMatcher(entry.path).test(currentPath))

    .sort((a, b) => b.path.length - a.path.length)[0];



  if (!matched) return [];



  const labels = (() => {

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

  })();



  return labels.map((label, index) => {

    const prefixLabels = labels.slice(0, index + 1);

    const prefixPathEntry = routeEntries

      .filter((entry) => {

        if (entry.labels.length !== prefixLabels.length) return false;

        return entry.labels.every((item, idx) => item === prefixLabels[idx]);

      })

      .sort((a, b) => b.path.length - a.path.length)[0];

    return {

      label,

      path: prefixPathEntry ? fillPathParams(prefixPathEntry.path, currentPath) : undefined,

    };

  });

};



const PageTopBar = ({

  crumbs,

  onOpenTheme,

}: {

  crumbs: RouteCrumb[];

  onOpenTheme: () => void;

}) => {

  const getMobileSiderSpacers = () => {

    const layout = document.querySelector('.ant-layout.ant-layout-has-sider') as HTMLElement | null;

    if (!layout) {

      return [] as HTMLElement[];

    }

    return Array.from(layout.children).filter((node) => {

      const el = node as HTMLElement;

      return el.tagName === 'DIV' && !el.classList.contains('ant-pro-layout-container') && !el.classList.contains('ant-pro-sider');

    }) as HTMLElement[];

  };

  const syncMobileSiderDom = (collapsed: boolean) => {

    if (window.innerWidth >= 992) {

      return;

    }

    const sider = document.querySelector('.ant-pro-sider') as HTMLElement | null;

    const menu = document.querySelector('.ant-pro-sider .ant-menu') as HTMLElement | null;

    const logo = document.querySelector('.ant-pro-sider .ant-pro-sider-logo') as HTMLElement | null;

    const logoLink = document.querySelector('.ant-pro-sider .ant-pro-sider-logo a') as HTMLElement | null;

    const siderSpacers = getMobileSiderSpacers();

    if (!sider) {

      return;

    }

    sider.classList.toggle('ant-layout-sider-collapsed', collapsed);

    sider.classList.toggle('ant-pro-sider-collapsed', collapsed);

    sider.style.setProperty('width', '100px');

    sider.style.setProperty('min-width', '100px');

    sider.style.setProperty('max-width', '100px');

    sider.style.setProperty('flex', '0 0 100px');

    menu?.classList.toggle('ant-pro-base-menu-vertical-collapsed', collapsed);

    logo?.classList.toggle('ant-pro-sider-logo-collapsed', collapsed);

    if (logo) {

      logo.style.setProperty('width', '100px', 'important');

      logo.style.setProperty('padding-left', '0', 'important');

      logo.style.setProperty('padding-right', '0', 'important');

      logo.style.setProperty('justify-content', 'flex-start', 'important');

      logo.style.setProperty('align-items', 'center', 'important');

    }

    if (logoLink) {

      logoLink.style.setProperty('width', '100%', 'important');

      logoLink.style.setProperty('margin-left', '0', 'important');

      logoLink.style.setProperty('margin-right', '0', 'important');

      logoLink.style.setProperty('padding-left', '6px', 'important');

      logoLink.style.setProperty('padding-right', '0', 'important');

      logoLink.style.setProperty('display', 'flex', 'important');

      logoLink.style.setProperty('justify-content', 'flex-start', 'important');

      logoLink.style.setProperty('align-items', 'center', 'important');

      logoLink.style.setProperty('gap', '0', 'important');

      logoLink.style.setProperty('transform', 'translate(9px, 14px)', 'important');

    }

    siderSpacers.forEach((siderSpacer) => {

      siderSpacer.style.setProperty('display', 'none');

      siderSpacer.style.setProperty('width', '0');

      siderSpacer.style.setProperty('min-width', '0');

      siderSpacer.style.setProperty('max-width', '0');

      siderSpacer.style.setProperty('flex', '0 0 0');

      siderSpacer.style.setProperty('margin', '0');

      siderSpacer.style.setProperty('padding', '0');

      siderSpacer.style.setProperty('overflow', 'hidden');

      siderSpacer.style.setProperty('transition', 'none');

    });

  };

  const onToggleSider = () => {

    const nextCollapsed = !document.body.classList.contains('argus-sider-collapsed');

    if (nextCollapsed) {

      document.querySelectorAll('.ant-pro-sider .ant-menu-submenu-title[aria-expanded="true"]').forEach((title) => {

        (title as HTMLElement).click();

      });

    }

    document.body.classList.toggle('argus-sider-collapsed', nextCollapsed);

    syncMobileSiderDom(nextCollapsed);

    document.querySelectorAll('.ant-pro-sider .ant-menu-inline-collapsed').forEach((menu) => {

      menu.classList.remove('ant-menu-inline-collapsed');

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

            {crumbs.map((item, index) => (

              <Breadcrumb.Item key={`${item.label}-${item.path || 'text'}`}>

                {item.path && index > 0 ? (

                  <a

                    className="argus-topbar__breadcrumb-link"

                    onClick={(e) => {

                      e.preventDefault();

                      history.push(item.path as string);

                    }}

                  >

                    {item.label}

                  </a>

                ) : (

                  item.label

                )}

              </Breadcrumb.Item>

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

  useEffect(() => {

    const getMobileSiderSpacers = () => {

      const layout = document.querySelector('.ant-layout.ant-layout-has-sider') as HTMLElement | null;

      if (!layout) {

        return [] as HTMLElement[];

      }

      return Array.from(layout.children).filter((node) => {

        const el = node as HTMLElement;

        return el.tagName === 'DIV' && !el.classList.contains('ant-pro-layout-container') && !el.classList.contains('ant-pro-sider');

      }) as HTMLElement[];

    };

    const syncMobileSiderState = (isMobile: boolean) => {

      const sider = document.querySelector('.ant-pro-sider') as HTMLElement | null;

      const menu = document.querySelector('.ant-pro-sider .ant-menu') as HTMLElement | null;

      const logo = document.querySelector('.ant-pro-sider .ant-pro-sider-logo') as HTMLElement | null;

      const siderPlaceholders = getMobileSiderSpacers();

      if (isMobile) {

        document.body.classList.add('argus-sider-collapsed');

        if (sider) {

          sider.classList.add('ant-layout-sider-collapsed', 'ant-pro-sider-collapsed');

        }

        menu?.classList.add('ant-pro-base-menu-vertical-collapsed');

        logo?.classList.add('ant-pro-sider-logo-collapsed');

        siderPlaceholders.forEach((siderPlaceholder) => {

          siderPlaceholder.style.setProperty('display', 'none');

        });

      } else {

        document.body.classList.remove('argus-sider-collapsed');

        if (sider) {

          sider.classList.remove('ant-layout-sider-collapsed', 'ant-pro-sider-collapsed');

        }

        menu?.classList.remove('ant-pro-base-menu-vertical-collapsed');

        logo?.classList.remove('ant-pro-sider-logo-collapsed');

        siderPlaceholders.forEach((siderPlaceholder) => {

          siderPlaceholder.style.removeProperty('display');

        });

      }

    };

    const mql = window.matchMedia('(max-width: 991px)');

    const handleMqlChange = (e: MediaQueryListEvent | MediaQueryList) => syncMobileSiderState(e.matches);

    handleMqlChange(mql);

    mql.addEventListener('change', handleMqlChange);

    return () => mql.removeEventListener('change', handleMqlChange);

  }, []);



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

    const userText = localStorage.getItem('argusUser');

    if (!userText) {

      return undefined;

    }

    try {

      return JSON.parse(userText) as LoginUser;

    } catch (e) {

      localStorage.removeItem('argusUser');

      return undefined;

    }

  };



  const fetchUserInfo = async () => {

    try {

      const token = localStorage.getItem('argusToken');

      if (!token) {

        const { location } = history;

        if (!isPublicKnowledgeShare(location) && !isPublicReportShare(location) && !isPublicHashShare()) {

          history.replace(loginPath);

        }

        return;

      }

      const msg = await queryCurrentUser({ token });

      if (msg.code !== 0) {

        if (msg.code === 401 && !isReadonlyReplicaError(msg.msg)) {

          localStorage.removeItem('argusToken');

          localStorage.removeItem('argusUser');

          throw new Error(msg.msg || '未登录');

        }

        const localUser = getLocalUser();

        if (localUser) {

          message.warning(`${msg.msg || '获取用户信息失败'}，已使用本地登录信息`);

          return localUser;

        }

        throw new Error(msg.msg || '获取用户信息失败');

      }

      localStorage.setItem('argusUser', JSON.stringify(msg.data));

      return msg.data;

    } catch (error) {

      const localUser = getLocalUser();

      if (localUser) {

        return localUser;

      }

      localStorage.removeItem('argusToken');

      localStorage.removeItem('argusUser');

      const { location } = history;

      if (!isPublicKnowledgeShare(location) && !isPublicReportShare(location) && !isPublicHashShare()) {

        history.replace(loginPath);

      }

    }

    return undefined;

  };

  const { location } = history;

  if (isPublicKnowledgeShare(location) || isPublicReportShare(location) || isPublicHashShare()) {

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
    disableMobile: true,

    headerRender: false,

    waterMarkProps: {

      content: initialState?.currentUser?.name,

    },

    footerRender: () => (hideAppShellForKnowledge ? false : <Footer />),

    onPageChange: () => {

      const { location } = history;

      if (!initialState?.currentUser && location.pathname !== loginPath && !isPublicKnowledgeShare(location) && !isPublicReportShare(location) && !isPublicHashShare()) {

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

export function rootContainer(container: React.ReactNode) {
  // Keep the skill-task watcher alive across route changes, including layout-less pages.
  return (
    <>
      <FunctionalCaseTaskWatcher />
      {container}
    </>
  );
}


export const request = {

  ...errorConfig,

};







