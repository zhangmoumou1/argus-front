import {PageContainer} from "@ant-design/pro-components";
import {Card} from "antd";
import {connect} from "@umijs/max";
import AIModelConfig from "@/components/System/AIModelConfig";

const AIModel = ({dispatch, gconfig, loading}) => (
  <PageContainer title={false} breadcrumb={null}>
    <Card>
      <AIModelConfig dispatch={dispatch} aiModelConfig={gconfig.aiModelConfig} aiModelProviders={gconfig.aiModelProviders} loading={loading}/>
    </Card>
  </PageContainer>
);

export default connect(({gconfig, loading}) => ({gconfig, loading}))(AIModel);
