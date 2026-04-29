import {Card, message, Row, Col} from 'antd';
import {history, useParams} from '@umijs/max';
import {PageContainer} from '@ant-design/pro-components';
import React, {useState} from 'react';
import sceneRegistry from '@/pages/datafactory/registry';
import LogPanel from '@/pages/datafactory/TaskRunner/components/LogPanel';
import './index.less';

export default function TaskRunner() {
  const {sceneId} = useParams();
  const scene = sceneRegistry[sceneId] || null;
  const [logs, setLogs] = useState('');
  const [running, setRunning] = useState(false);

  if (!scene) {
    return (
      <PageContainer title={false} breadcrumb={null} className="df-runner-page">
        <Card>
          <h3>场景不存在</h3>
          <p>请返回数据工厂列表重新选择场景。</p>
        </Card>
      </PageContainer>
    );
  }

  const handleRun = async (payload) => {
    setRunning(true);
    const fake = {
      code: 0,
      msg: '执行成功（模拟数据）',
      sceneId,
      executeAt: new Date().toISOString(),
      input: payload,
      output: {
        taskId: `mock_${Date.now()}`,
        accepted: true,
      },
    };
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    setLogs(JSON.stringify(fake, null, 2));
    setRunning(false);
    message.success('执行完成（模拟数据）');
  };

  const handleReset = () => {
    setLogs('');
  };

  const FormComponent = scene.FormComponent;

  return (
    <PageContainer title={false} breadcrumb={null} className="df-runner-page">
      <Row gutter={16}>
        <Col xs={24} xl={12}>
          <Card className="df-runner-card">
            <div className="df-runner-title-row">
              <h2 className="df-runner-title">{scene.title}</h2>
              <a onClick={() => history.push('/datafactory')}>返回列表</a>
            </div>
            <FormComponent
              scene={scene}
              loading={running}
              onRun={handleRun}
              onReset={handleReset}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="df-runner-card">
            <LogPanel logs={logs} placeholder="等待提交表单以查看执行结果..." />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
