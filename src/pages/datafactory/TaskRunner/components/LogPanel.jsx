import {Empty} from 'antd';
import React from 'react';

export default function LogPanel({title = '执行日志', logs, placeholder = '等待提交表单以查看执行结果...'}) {
  return (
    <div className="df-log-panel">
      <h3 className="df-log-title">{title}</h3>
      <div className="df-log-body">
        {!logs ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={placeholder} className="df-log-empty" />
        ) : (
          <pre className="df-log-plain">{logs}</pre>
        )}
      </div>
    </div>
  );
}
