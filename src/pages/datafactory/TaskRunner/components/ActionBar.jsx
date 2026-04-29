import {Button, Space} from 'antd';
import React from 'react';

export default function ActionBar({onExecute, onReset, onHelp, onHistory, loading}) {
  return (
    <div className="sim-action-bar">
      <Space size={12}>
        <Button type="primary" loading={loading} onClick={onExecute}>执行</Button>
        <Button onClick={onReset}>重置</Button>
        <Button type="dashed" onClick={onHelp}>说明</Button>
        <Button onClick={onHistory}>执行记录</Button>
      </Space>
    </div>
  );
}
