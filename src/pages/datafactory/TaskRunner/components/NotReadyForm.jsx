import {Alert} from 'antd';
import React from 'react';

export default function NotReadyForm({scene}) {
  return (
    <Alert
      type="warning"
      showIcon
      message={scene?.title || '场景'}
      description="该场景详情页正在建设中，后续会接入真实接口。当前可先使用模拟发送点位和标签值场景。"
    />
  );
}
