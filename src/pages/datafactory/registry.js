import SimPointTagForm from './scenes/sim-point-tag/Form';
import NotReadyForm from './TaskRunner/components/NotReadyForm';

const sceneRegistry = {
  'create-platform-user': {
    title: '创建平台用户',
    description: '该场景详情页正在建设中，接口接入后可直接执行。',
    FormComponent: NotReadyForm,
  },
  'create-db-user': {
    title: '创建数据库用户并赋权',
    description: '该场景详情页正在建设中，接口接入后可直接执行。',
    FormComponent: NotReadyForm,
  },
  'api-auto-test': {
    title: '接口自动化测试',
    description: '该场景详情页正在建设中，接口接入后可直接执行。',
    FormComponent: NotReadyForm,
  },
  'release-metrics': {
    title: '需求发布统计',
    description: '该场景详情页正在建设中，接口接入后可直接执行。',
    FormComponent: NotReadyForm,
  },
  'sim-point-tag': {
    title: '模拟发送点位和标签值',
    description: '通过配置点位/标签值模拟发送，执行结果在右侧日志面板展示。',
    FormComponent: SimPointTagForm,
  },
  'create-gp-sr-table': {
    title: '创建GP和SR指标表',
    description: '该场景详情页正在建设中，接口接入后可直接执行。',
    FormComponent: NotReadyForm,
  },
  'sync-harbor-image': {
    title: '自动同步harbor镜像并部署',
    description: '该场景详情页正在建设中，接口接入后可直接执行。',
    FormComponent: NotReadyForm,
  },
};

export default sceneRegistry;
