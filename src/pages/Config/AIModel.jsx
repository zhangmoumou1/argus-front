import {PageContainer} from "@ant-design/pro-components";
import {Alert, Card} from "antd";
import {connect} from "@umijs/max";
import AIModelConfig from "@/components/System/AIModelConfig";

const AIModel = ({dispatch, gconfig, loading}) => (
  <PageContainer title={false} breadcrumb={null}>
    <Card>
      <Alert
        type="info"
        showIcon
        style={{marginBottom: 16}}
        message="当前启用模型会被测试平台内的 AI 功能统一调用"
        description="目前功能用例智能生成、功能用例技能生成等能力都会读取这里的启用模型。请确保请求地址兼容 OpenAI Chat Completions 协议。"
      />
      <AIModelConfig dispatch={dispatch} aiModelConfig={gconfig.aiModelConfig} aiModelProviders={gconfig.aiModelProviders} loading={loading}/>
    </Card>
  </PageContainer>
);

export default connect(({gconfig, loading}) => ({gconfig, loading}))(AIModel);
