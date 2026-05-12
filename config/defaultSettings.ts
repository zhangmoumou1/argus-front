import { Settings as LayoutSettings } from '@ant-design/pro-components';
/**
 * @name
 */
const Settings: LayoutSettings & {
  pwa?: boolean;
  https?: boolean;
  logo?: string;
  apiUrl?: string;
  backend?: boolean;
} = {
  navTheme: 'light',
  // 拂晓蓝
  colorPrimary: '#1677ff',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Argus测试平台',
  pwa: false,
  logo: '/logo.ico',
  iconfontUrl: '//at.alicdn.com/t/font_915840_kom9s5w2t6k.js',
  apiUrl: '127.0.0.1:7777',
  https: false,
  backend: false,
};

export default Settings;

