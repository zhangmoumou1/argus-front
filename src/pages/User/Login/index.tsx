import Footer from '@/components/Footer';
import loginIllustration from '@/assets/login.png';
import registerIllustration from '@/assets/register.png';
import { LockOutlined, MailOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, useModel } from '@umijs/max';
import Settings from '../../../../config/defaultSettings';
import { Input, Modal, message } from 'antd';
import { generateResetLink } from '@/services/auth';
import React, { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import './index.less';

const LOGIN_BACKGROUND_IMAGE = '';

const Login: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const [shellPhase, setShellPhase] = useState<'idle' | 'leave' | 'enter'>('idle');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { loginPity, registerPity } = useModel('auth');

  const pageStyle = useMemo(
    () => ({
      backgroundImage: LOGIN_BACKGROUND_IMAGE.trim()
        ? `linear-gradient(135deg, rgba(31, 41, 70, 0.26), rgba(123, 92, 210, 0.16)), url(${LOGIN_BACKGROUND_IMAGE})`
        : 'radial-gradient(circle at 18% 20%, rgba(255, 177, 164, 0.36), transparent 24%), radial-gradient(circle at 82% 18%, rgba(167, 179, 255, 0.32), transparent 26%), linear-gradient(135deg, #f4f1ff 0%, #f8efff 48%, #fff5f0 100%)',
    }),
    [],
  );

  const currentIllustration = type === 'register' ? registerIllustration : loginIllustration;

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    let resp;
    if (type === 'register') {
      resp = await registerPity({
        name: values?.name,
        password: values.password,
        email: values?.email,
        username: values.username,
      });
    } else {
      resp = await loginPity({ username: values.username, password: values.password });
    }
    if (resp.code === 0) {
      message.success(type === 'register' ? '注册成功，已自动登录' : '登录成功');
      await fetchUserInfo();
      const urlParams = new URL(window.location.href).searchParams;
      history.push(urlParams.get('redirect') || '/');
      return;
    }
    message.error(resp.msg);
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim();
    if (!email) {
      message.warning('请输入邮箱');
      return;
    }
    setForgotSubmitting(true);
    try {
      await generateResetLink(email);
      message.success('重置链接已发送，请检查邮箱');
      setForgotOpen(false);
      setForgotEmail('');
    } catch (error) {
      message.error('发送重置链接失败');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const triggerTypeChange = (nextType: string) => {
    if (nextType === type || shellPhase !== 'idle') {
      return;
    }
    setShellPhase('leave');
    window.setTimeout(() => {
      setType(nextType);
      setShellPhase('enter');
      window.setTimeout(() => {
        setShellPhase('idle');
      }, 360);
    }, 260);
  };

  return (
    <div className="argux-auth-page" style={pageStyle}>
      <Helmet>
        <title>{Settings.title}</title>
      </Helmet>
      <div className={`argux-auth-shell ${shellPhase === 'leave' ? 'is-leaving' : ''} ${shellPhase === 'enter' ? 'is-entering' : ''}`}>
        <div className="argux-auth-visual">
          <div className="argux-auth-visual-glow" />
          <img
            src={currentIllustration}
            alt={type === 'register' ? 'register visual' : 'login visual'}
            className={`argux-auth-illustration ${type === 'register' ? 'register' : 'login'}`}
          />
        </div>
        <div className="argux-auth-content">
          <h1 className="argux-auth-title">hello !</h1>
          <div key={type} className="argux-auth-stage">
            <p className="argux-auth-subtitle">
              {type === 'register' ? '欢迎注册 Argux 测试工作台' : '欢迎回到 Argus 测试工作台'}
            </p>
            <div className="argux-auth-form-wrap">
              <div className="argux-auth-form">
              <LoginForm
                submitter={false}
                initialValues={{ autoLogin: true }}
                onFinish={async (values) => {
                  await handleSubmit(values as API.LoginParams);
                }}
              >
                {type === 'account' && (
                  <>
                    <ProFormText
                      name="username"
                      fieldProps={{
                        size: 'large',
                        prefix: <UserOutlined />,
                      }}
                      placeholder="请输入用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    />
                    <ProFormText.Password
                      name="password"
                      fieldProps={{
                        size: 'large',
                        prefix: <LockOutlined />,
                      }}
                      placeholder="请输入密码"
                      rules={[{ required: true, message: '请输入密码' }]}
                    />
                  </>
                )}

                {type === 'register' && (
                  <>
                    <ProFormText
                      name="username"
                      fieldProps={{
                        size: 'large',
                        prefix: <UserOutlined />,
                      }}
                      placeholder="请输入用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    />
                    <ProFormText
                      name="name"
                      fieldProps={{
                        size: 'large',
                        prefix: <MobileOutlined />,
                      }}
                      placeholder="请输入姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    />
                    <ProFormText
                      name="email"
                      fieldProps={{
                        size: 'large',
                        prefix: <MailOutlined />,
                      }}
                      placeholder="请输入用户邮箱"
                      rules={[{ type: 'email', required: true, message: '请输入合法的邮箱' }]}
                    />
                    <ProFormText.Password
                      name="password"
                      fieldProps={{
                        size: 'large',
                        prefix: <LockOutlined />,
                      }}
                      placeholder="请输入用户密码"
                      rules={[{ required: true, message: '请输入用户密码' }]}
                    />
                  </>
                )}

                <div className="argux-auth-meta">
                  {type === 'register' ? (
                    <>
                      <span className="argux-auth-hint">创建账号后即可进入测试工作台</span>
                      <button
                        type="button"
                        className="argux-auth-switch-link"
                        onClick={() => triggerTypeChange('account')}
                      >
                        返回登录
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="argux-auth-meta-left">
                        <ProFormCheckbox noStyle name="autoLogin">
                          自动登录
                        </ProFormCheckbox>
                      </div>
                      <button
                        type="button"
                        className="argux-auth-switch-link argux-auth-meta-link"
                        onClick={() => setForgotOpen(true)}
                      >
                        忘记密码
                      </button>
                    </>
                  )}
                </div>

                <button type="submit" className="ant-btn ant-btn-primary ant-btn-lg ant-btn-block">
                  <span>{type === 'register' ? '注 册' : '登 录'}</span>
                </button>

                {type === 'account' ? (
                  <div className="argux-auth-register-row">
                    <span className="argux-auth-register-hint">还没有账号？</span>
                    <button
                      type="button"
                      className="argux-auth-switch-link argux-auth-register-link"
                      onClick={() => triggerTypeChange('register')}
                    >
                      立即注册
                    </button>
                  </div>
                ) : null}
              </LoginForm>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        title="忘记密码"
        open={forgotOpen}
        okText="发送重置链接"
        cancelText="取消"
        confirmLoading={forgotSubmitting}
        onOk={handleForgotPassword}
        onCancel={() => {
          if (forgotSubmitting) return;
          setForgotOpen(false);
        }}
      >
        <Input
          value={forgotEmail}
          placeholder="请输入注册邮箱"
          prefix={<MailOutlined />}
          onChange={(event) => setForgotEmail(event.target.value)}
          onPressEnter={handleForgotPassword}
        />
      </Modal>
      <Footer />
    </div>
  );
};

export default Login;
