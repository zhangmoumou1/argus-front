import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { history, useModel } from '@umijs/max';
import { Avatar, Input, Modal, Spin, message } from 'antd';
import { setAlpha } from '@ant-design/pro-components';
import { stringify } from 'querystring';
import type { MenuInfo } from 'rc-menu/lib/interface';
import React, { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import HeaderDropdown from '../HeaderDropdown';
import { getAvatarByUser } from '@/utils/avatar';
import { resetSelfPassword } from '@/services/user';

export type GlobalHeaderRightProps = {
  variant?: 'header' | 'sider';
};

const Name = ({ variant = 'header' }: { variant?: 'header' | 'sider' }) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  const nameClassName = useEmotionCss(({ token }) => {
    if (variant === 'sider') {
      return {
        display: 'flex',
        minWidth: 0,
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: 1.25,
        [`@media only screen and (max-width: ${token.screenMD}px)`]: {
          display: 'none',
        },
      };
    }

    return {
      width: '70px',
      height: '40px',
      overflow: 'hidden',
      lineHeight: '40px',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      [`@media only screen and (max-width: ${token.screenMD}px)`]: {
        display: 'none',
      },
    };
  });

  if (variant === 'sider') {
    return (
      <span className={nameClassName}>
        <span style={{ color: '#111827', fontSize: 14, fontWeight: 600 }}>{currentUser?.name}</span>
        <span style={{ color: '#667085', fontSize: 12 }}>{currentUser?.username}</span>
      </span>
    );
  }

  return <span className={`${nameClassName} anticon`}>{currentUser?.name}</span>;
};

const AvatarLogo = ({ variant = 'header' }: { variant?: 'header' | 'sider' }) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  const avatarClassName = useEmotionCss(({ token }) => {
    if (variant === 'sider') {
      return {
        marginRight: '10px',
        color: token.colorPrimary,
        flex: 'none',
        background: '#eef2ff',
        [`@media only screen and (max-width: ${token.screenMD}px)`]: {
          marginRight: 0,
        },
      };
    }

    return {
      marginRight: '8px',
      color: token.colorPrimary,
      verticalAlign: 'top',
      background: setAlpha(token.colorBgContainer, 0.85),
      [`@media only screen and (max-width: ${token.screenMD}px)`]: {
        margin: 0,
      },
    };
  });

  return (
    <Avatar
      size={variant === 'sider' ? 36 : 28}
      className={avatarClassName}
      src={getAvatarByUser(currentUser)}
      alt="avatar"
    />
  );
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ variant = 'header' }) => {
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  /**
   * 退出登录，并且将当前的 url 保存
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('pityToken');
    localStorage.removeItem('pityUser');
    const urlParams = new URL(window.location.href).searchParams;
    const redirect = urlParams.get('redirect');
    if (window.location.pathname !== '/#/user/login' && !redirect) {
      history.replace({
        pathname: '/user/login',
        search: stringify({
          redirect: window.location.href,
        }),
      });
    }
  }, []);
  const actionClassName = useEmotionCss(({ token }) => {
    if (variant === 'sider') {
      return {
        display: 'flex',
        width: '100%',
        minWidth: 0,
        alignItems: 'center',
        padding: '0',
        cursor: 'pointer',
        borderRadius: 12,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f3f4f6',
        },
      };
    }

    return {
      display: 'flex',
      height: '40px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 6px',
      cursor: 'pointer',
      borderRadius: 8,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    };
  });
  const { initialState, setInitialState } = useModel('@@initialState');

  const onMenuClick = useCallback(
    (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        flushSync(() => {
          setInitialState((s) => ({ ...s, currentUser: undefined }));
        });
        handleLogout();
        return;
      }
      if (key === 'reset-password') {
        setResetPasswordValue('');
        setResetOpen(true);
        return;
      }
      if (key === 'profile') {
        const userId = initialState?.currentUser?.id;
        if (userId) {
          history.push(`/member/${userId}`);
        }
        return;
      }
      history.push(`/account/${key}`);
    },
    [handleLogout, initialState?.currentUser?.id, setInitialState],
  );

  const loading = (
    <span className={actionClassName}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'reset-password',
      icon: <SettingOutlined />,
      label: '重置密码',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const onSubmitResetSelfPassword = async () => {
    const value = resetPasswordValue.trim();
    if (!value) {
      message.warning('请输入新密码');
      return;
    }
    setResetSubmitting(true);
    const res = await resetSelfPassword({ password: value });
    setResetSubmitting(false);
    if (res?.code === 0) {
      message.success('密码重置成功');
      setResetOpen(false);
      setResetPasswordValue('');
    } else {
      message.error(res?.msg || '密码重置失败');
    }
  };

  return (
    <>
      {variant === 'sider' ? (
        <div className="argus-sider-user">
          <span className={actionClassName}>
            <AvatarLogo variant={variant} />
            <Name variant={variant} />
          </span>
          <button
            type="button"
            className="argus-sider-user__logout"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              flushSync(() => {
                setInitialState((s) => ({ ...s, currentUser: undefined }));
              });
              handleLogout();
            }}
            aria-label="退出登录"
          >
            <LogoutOutlined />
          </button>
        </div>
      ) : (
        <HeaderDropdown
          menu={{
            selectedKeys: [],
            onClick: onMenuClick,
            items: menuItems,
          }}
        >
          <span className={actionClassName}>
            <AvatarLogo variant={variant} />
            <Name variant={variant} />
          </span>
        </HeaderDropdown>
      )}
      <Modal
        title="重置密码"
        open={resetOpen}
        onOk={onSubmitResetSelfPassword}
        onCancel={() => setResetOpen(false)}
        confirmLoading={resetSubmitting}
        okText="确定"
        cancelText="取消"
      >
        <Input.Password
          value={resetPasswordValue}
          onChange={(event) => setResetPasswordValue(event.target.value)}
          placeholder="请输入新密码"
        />
      </Modal>
    </>
  );
};

export default AvatarDropdown;
