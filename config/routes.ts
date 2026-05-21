/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    title: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },
  {
    path: '/',
    redirect: '/dashboard/workspace',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    routes: [
      {
        path: '/dashboard/workspace',
        name: '工作台',
        component: './Dashboard/Workspace',
      },
      {
        path: '/dashboard/statistics',
        name: '统计大盘',
        component: './Statistics',
      },
    ],
  },
  {
    path: '/account/settings',
    name: '个人设置',
    component: './account/settings',
    hideInMenu: true,
  },
  {
    path: '/member/:user_id',
    name: '用户资料',
    component: './UserInfo',
    hideInMenu: true,
  },
  {
    path: '/project',
    name: '项目管理',
    icon: 'Porject',
    component: './ApiTest/Project',
  },
  {
    path: '/project/:id',
    hideInMenu: true,
    name: '项目详情',
    component: './ApiTest/ProjectDetail',
  },
  {
    path: '/asset',
    name: '接口资产',
    icon: 'api',
    routes: [
      {
        path: '/asset/interface',
        name: '接口管理',
        component: './ApiTest/InterfaceService',
      },
      {
        path: '/asset/interface/:service_id',
        name: '接口列表',
        hideInMenu: true,
        component: './ApiTest/InterfaceEndpoint',
      },
      {
        path: '/asset/record',
        name: '接口录制',
        component: './ApiTest/TestCaseRecorder',
      },
      {
        path: '/asset/mock',
        name: 'Mock服务',
        component: './ApiTest/MockConfig',
      },
    ],
  },
  {
    path: '/scenario',
    name: '场景测试',
    icon: 'macCommand',
    routes: [
      {
        path: '/scenario/testcase',
        name: '接口用例',
        component: './ApiTest/TestCaseDirectory',
      },
      {
        path: '/scenario/testcase/:directory/add',
        name: '添加用例',
        hideInMenu: true,
        keepAlive: false,
        component: './ApiTest/TestCaseComponent',
      },
      {
        path: '/scenario/testcase/:directory/:case_id',
        name: '编辑用例',
        hideInMenu: true,
        keepAlive: false,
        component: './ApiTest/TestCaseComponent',
      },
      {
        path: '/scenario/functionalCase',
        name: '功能用例',
        component: './ApiTest/FunctionalCase',
      },
      {
        path: '/scenario/functionalSkill',
        name: '用例技能',
        component: './ApiTest/FunctionalSkill',
      },
    ],
  },
  {
    path: '/run',
    icon: 'history',
    name: '测试运行',
    routes: [
      {
        path: '/run/testplan',
        name: '测试计划',
        component: './ApiTest/TestPlan',
      },
      {
        path: '/run/api-report',
        name: '接口报告',
        component: './BuildHistory/ApiReportList',
      },
      {
        path: '/run/api-report/:id',
        hideInMenu: true,
        name: '接口报告详情',
        component: './BuildHistory/ReportDetail',
      },
    ],
  },
  {
    path: '/performance',
    icon: 'areaChart',
    name: '性能测试',
    routes: [
      {
        path: '/performance/plan',
        name: '测试计划',
        component: './Performance/PlanList',
      },
        {
          path: '/performance/run',
          name: '执行记录',
          component: './Performance/ActivityHub',
        },
        {
          path: '/performance/report',
          name: '性能报告',
          component: './Performance/ActivityHub',
        },
      {
        path: '/performance/report/:id',
        hideInMenu: true,
        name: '性能报告详情',
        component: './Performance/ReportDetail',
      },
    ],
  },
  {
    path: '/apiTest/interface',
    hideInMenu: true,
    redirect: '/asset/interface',
  },
  {
    path: '/apiTest/interface/:service_id',
    hideInMenu: true,
    redirect: '/asset/interface/:service_id',
  },
  {
    path: '/apiTest/record',
    hideInMenu: true,
    redirect: '/asset/record',
  },
  {
    path: '/mock',
    hideInMenu: true,
    redirect: '/asset/mock',
  },
  {
    path: '/apiTest/testcase',
    hideInMenu: true,
    redirect: '/scenario/testcase',
  },
  {
    path: '/apiTest/testcase/:directory/add',
    hideInMenu: true,
    redirect: '/scenario/testcase/:directory/add',
  },
  {
    path: '/apiTest/testcase/:directory/:case_id',
    hideInMenu: true,
    redirect: '/scenario/testcase/:directory/:case_id',
  },
  {
    path: '/apiTest/functionalCase',
    hideInMenu: true,
    redirect: '/scenario/functionalCase',
  },
  {
    path: '/apiTest/functionalSkill',
    hideInMenu: true,
    redirect: '/scenario/functionalSkill',
  },
  {
    path: '/apiTest/testplan',
    hideInMenu: true,
    redirect: '/run/testplan',
  },
  {
    path: '/record/list',
    hideInMenu: true,
    redirect: '/run/api-report',
  },
  {
    path: '/record/report/:id',
    hideInMenu: true,
    redirect: '/run/api-report/:id',
  },
  {
    path: '/run/report',
    hideInMenu: true,
    redirect: '/run/api-report',
  },
  {
    path: '/run/report/:id',
    hideInMenu: true,
    redirect: '/run/api-report/:id',
  },
  {
    path: '/notification',
    name: '消息中心',
    hideInMenu: true,
    component: './Notification',
  },
  {
    path: '/config',
    icon: 'icon-config',
    name: '测试配置',
    routes: [
      {
        path: '/config/environment',
        name: '环境管理',
        component: './Config/Environment',
      },
      {
        path: '/config/address',
        name: '地址管理',
        component: './Config/Address',
      },
      {
        path: '/config/gconfig',
        name: '全局变量',
        component: './Config/GConfig',
      },
      {
        path: '/config/database',
        name: '数据库配置',
        component: './Config/Database',
      },
      {
        path: '/config/redis',
        name: 'Redis配置',
        component: './Config/Redis',
      },
      {
        path: '/config/mq',
        name: '消息中间件',
        component: './Config/MessageBroker',
      },
      {
        path: '/config/oss',
        name: 'oss文件',
        component: './Config/Oss',
      },
    ],
  },
  {
    path: '/system',
    icon: 'bank',
    name: '后台管理',
    routes: [
      {
        path: '/system/configure',
        name: '系统设置',
        component: './Config/SystemConfig',
      },
      {
        path: '/system/user',
        name: '用户管理',
        component: './Manager/UserList',
      },
      {
        path: '/system/operation-log',
        name: '操作日志',
        component: './Manager/OperationLog',
      },
    ],
  },
  {
    path: '/tool',
    name: '实用工具',
    icon: 'tool',
    routes: [
      {
        path: '/tool/request',
        name: 'HTTP测试',
        icon: 'icon-yunhang',
        component: './Tool/Request',
      },
      {
        path: '/tool/sql',
        name: 'SQL客户端',
        icon: 'database',
        component: './Tool/SqlOnline',
      },
      {
        path: '/tool/redis',
        name: 'Redis客户端',
        icon: 'redis',
        component: './Tool/RedisOnline',
      },
      {
        path: '/tool/kafka',
        name: 'Kafka Tools',
        component: './Tool/KafkaTools',
      },
      {
        path: '/tool/rabbitmq',
        name: 'RabbitMQ Tools',
        component: './Tool/RabbitMQTools',
      },
    ],
  },
  {
    path: '/ci',
    icon: 'icon-CI',
    name: '持续集成',
    hideInMenu: true,
    component: './Building',
  },
  {
    path: '/precise',
    icon: 'icon-jingzhun',
    name: '精准测试',
    hideInMenu: true,
    component: './Building',
  },
  {
    path: '/datafactory',
    icon: 'icon-hebingxingzhuang',
    name: '数据工厂',
    component: './datafactory',
  },
  {
    path: '/datafactory/run/:sceneId',
    hideInMenu: true,
    name: '执行场景',
    component: './datafactory/TaskRunner',
  },
  {
    path: '/knowledge',
    icon: 'book',
    name: '帮助文档',
    hideInMenu: true,
    component: './KnowledgeBase',
  },
  {
    path: '/knowledge/docs',
    hideInMenu: true,
    layout: false,
    component: './KnowledgeBase',
  },
  {
    path: '/knowledge/create',
    hideInMenu: true,
    name: '新增文档',
    component: './KnowledgeBase/EditorPage',
  },
  {
    path: '/knowledge/edit/:id',
    hideInMenu: true,
    name: '编辑文档',
    component: './KnowledgeBase/EditorPage',
  },
  {
    path: '/knowledge/view/:id',
    hideInMenu: true,
    name: '查看文档',
    component: './KnowledgeBase/ViewPage',
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];

