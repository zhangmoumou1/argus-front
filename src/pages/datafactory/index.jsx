import {PageContainer} from "@ant-design/pro-components";
import {useState} from "react";
import Helper from './help';
import "./index.less"
import Header from "@/pages/datafactory/header";
import Body from "@/pages/datafactory/body";

export default () => {

  const [helpVisible, setHelperVisible] = useState(true);

  return (
    <PageContainer title={false} breadcrumb={null}>
      {/*  头部*/}
      <Helper open={helpVisible} onCancel={() => setHelperVisible(false)}/>
      <Header/>
      <Body/>
    </PageContainer>
  )
}
