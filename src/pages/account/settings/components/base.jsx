import React, { useEffect } from 'react';
import ProForm, { ProFormText } from '@ant-design/pro-form';
import { connect } from '@umijs/max';
import { Form } from 'antd';
import styles from './BaseView.less';
import { getAvatarByUser } from '@/utils/avatar';

const validatorPhone = (rule, value, callback) => {
  callback();
};

const AvatarView = ({ avatar }) => (
  <>
    <div className={styles.avatar_title}>头像</div>
    <div className={styles.avatar}>
      <img src={avatar} alt="avatar" />
    </div>
    <div className={styles.button_view} style={{ color: '#999', fontSize: 12 }}>
      头像由系统自动生成
    </div>
  </>
);

const BaseView = ({ user, loading, dispatch }) => {
  const { currentUser } = user;
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch({
      type: 'user/fetchCurrent',
    });
  }, [dispatch]);

  useEffect(() => {
    form.setFieldsValue({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
    });
  }, [currentUser?.name, currentUser?.email, currentUser?.phone, form]);

  const getAvatarURL = () => {
    if (currentUser) {
      return getAvatarByUser(currentUser);
    }
    return getAvatarByUser({ id: 0 });
  };

  const handleFinish = async () => {
    const values = form.getFieldsValue();
    await dispatch({
      type: 'user/updateUser',
      payload: {
        ...values,
        id: currentUser.id,
      },
    });
    await dispatch({
      type: 'user/fetchCurrent',
    });
    return true;
  };

  return (
    <div className={styles.baseView}>
      {loading ? null : (
        <>
          <div className={styles.left}>
            <ProForm
              key={`${currentUser?.id || 'current'}-${currentUser?.updated_at || ''}-${currentUser?.phone || ''}`}
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              initialValues={{
                name: currentUser?.name || '',
                email: currentUser?.email || '',
                phone: currentUser?.phone || '',
              }}
              submitter={{
                resetButtonProps: {
                  style: {
                    display: 'none',
                  },
                },
                submitButtonProps: {
                  children: '更新基本信息',
                },
              }}
              hideRequiredMark
            >
              <ProFormText
                width="md"
                name="name"
                label="姓名"
                rules={[
                  {
                    required: true,
                    message: '请输入您的姓名!',
                  },
                ]}
              />
              <ProFormText
                width="md"
                name="email"
                label="邮箱"
                rules={[
                  {
                    required: true,
                    message: '请输入您的邮箱!',
                  },
                ]}
              />
              <ProFormText
                width="md"
                name="phone"
                label="联系电话"
                placeholder="输入电话后可接收钉钉/企业微信通知哦"
                rules={[
                  {
                    required: false,
                    message: '请输入您的联系电话!',
                  },
                  {
                    validator: validatorPhone,
                  },
                ]}
              />
            </ProForm>
          </div>
          <div className={styles.right}>
            <AvatarView avatar={getAvatarURL()} />
          </div>
        </>
      )}
    </div>
  );
};

export default connect(({ user }) => ({ user }))(BaseView);


