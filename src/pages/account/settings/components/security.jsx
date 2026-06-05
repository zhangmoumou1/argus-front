import React, { useMemo, useState } from 'react';
import { List, Modal, Input, message } from 'antd';
import { useModel } from '@umijs/max';
import { resetSelfPassword } from '@/services/user';

const passwordStrength = {
  strong: <span className="strong">强</span>,
  medium: <span className="medium">中</span>,
  weak: <span className="weak">弱</span>,
};

const maskPhone = (value) => {
  const text = String(value || '').trim();
  if (!text) return '未绑定手机号';
  if (text.length < 7) return text;
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
};

const maskEmail = (value) => {
  const text = String(value || '').trim();
  if (!text || !text.includes('@')) return '未绑定邮箱';
  const [name, domain] = text.split('@');
  const maskedName = name.length <= 3 ? `${name[0] || ''}***` : `${name.slice(0, 3)}***`;
  return `${maskedName}@${domain}`;
};

const SecurityView = ({ onSelectMenu }) => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser || {};
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const openBaseSettings = (fieldLabel) => {
    onSelectMenu?.('base');
    message.info(`请在基本设置中修改${fieldLabel}后保存`);
  };

  const handleResetPassword = async () => {
    const value = resetPasswordValue.trim();
    if (!value) {
      message.warning('请输入新密码');
      return;
    }
    setResetSubmitting(true);
    const res = await resetSelfPassword({ password: value });
    setResetSubmitting(false);
    if (res?.code === 0) {
      message.success('密码修改成功');
      setResetOpen(false);
      setResetPasswordValue('');
      return;
    }
    message.error(res?.msg || '密码修改失败');
  };

  const data = useMemo(
    () => [
      {
        title: '账户密码',
        description: (
          <>
            当前密码强度：
            {passwordStrength.strong}
          </>
        ),
        actions: [
          <a
            key="modify-password"
            onClick={() => {
              setResetPasswordValue('');
              setResetOpen(true);
            }}
          >
            修改
          </a>,
        ],
      },
      {
        title: '密保手机',
        description: `已绑定手机：${maskPhone(currentUser?.phone)}`,
        actions: [
          <a key="modify-phone" onClick={() => openBaseSettings('手机号')}>
            修改
          </a>,
        ],
      },
      {
        title: '备用邮箱',
        description: `已绑定邮箱：${maskEmail(currentUser?.email)}`,
        actions: [
          <a key="modify-email" onClick={() => openBaseSettings('邮箱')}>
            修改
          </a>,
        ],
      },
    ],
    [currentUser?.email, currentUser?.phone],
  );

  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item) => (
          <List.Item actions={item.actions}>
            <List.Item.Meta title={item.title} description={item.description} />
          </List.Item>
        )}
      />
      <Modal
        title="修改账户密码"
        open={resetOpen}
        onOk={handleResetPassword}
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

export default SecurityView;
