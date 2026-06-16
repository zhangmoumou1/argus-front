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
  title: 'Argus Testplatform',
  pwa: false,
  logo: '/logo.ico',
  iconfontUrl: '//at.alicdn.com/t/font_915840_kom9s5w2t6k.js',
  apiUrl: 'zhangyanc.club:7777/argus',
  https: false,
  backend: false,
};

export default Settings;
