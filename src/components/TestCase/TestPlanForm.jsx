import {connect} from '@umijs/max';
import {Avatar, Button, Col, Form, Input, InputNumber, Modal, Row, Select, Steps, Switch, Tag, TreeSelect} from "antd";
import {ApiOutlined, NotificationOutlined, SaveOutlined, TeamOutlined} from "@ant-design/icons";
import React, {useEffect, useState} from 'react';
import CONFIG from "@/consts/config";
import {IconFont} from "@/components/Icon/IconFont";
import SortedTable from "@/components/Table/SortedTable";
// import '@/components/Table/SortedTable.less';
import parser from 'cron-parser';
import moment from "moment";
import {listAllNotificationConfigs} from "@/services/notificationConfig";

const {Step} = Steps;
const {Option} = Select;

const CaseList = ({dispatch, form, loading, caseMap, treeData, planRecord, onSave, selectedCaseData, pendingMap}) => {
  const columns = [
    {
      title: '用例id',
      key: 'case_id',
      dataIndex: 'case_id',
      width: 100,
      render: case_id => {
        return case_id ? case_id.split("_")[1] : null
      },
    },
    {
      title: '用例名称',
      key: 'name',
      dataIndex: 'name',
      render: (name, record) => <span><a>{name}</a>{pendingMap?.[record.case_id?.split("_")[1]] ? <Tag color="red" style={{marginLeft: 8}}>变更</Tag> : null}</span>,
    },
  ]
  useEffect(() => {
    if (form.getFieldValue("project_id")) {
      dispatch({
        type: 'testplan/listTestCaseTreeWithProjectId',
        payload: {
          project_id: form.getFieldValue("project_id"),
        }
      })
    }
  }, [])

  useEffect(() => {
    onSave({
      selectedCaseData: (form.getFieldValue('case_list') || []).map((item, index) => {
        return {
          name: caseMap[item.split("_")[1]],
          case_id: item,
          index,
        }
      })
    })
  }, [caseMap])

  return (
    <>
      <Col span={24}>
        <Form.Item label="用例树" name="case_list" rules={
          [{required: true, message: '请至少选择一个case'}]
        } {...CONFIG.SQL_LAYOUT}>
          <TreeSelect treeData={treeData} treeCheckable style={{width: '100%'}} showSearch allowClear
                      maxTagCount={5} onChange={(a, b) => {
            onSave({
              selectedCaseData: b.map((item, idx) => ({name: item, case_id: a[idx], index: idx}))
            })
          }} loading={loading.effects['testplan/listTestCaseTreeWithProjectId']}/>
        </Form.Item>

      </Col>
      <Col span={24} style={{marginTop: 8}}>
        <Form.Item label="用例表" name="caseList" {...CONFIG.SQL_LAYOUT}>
          <SortedTable columns={columns} dataSource={selectedCaseData} setDataSource={data => {
            onSave({
              selectedCaseData: data
            })
          }} dragCallback={data => {
            form.setFieldsValue({case_list: data.map(item => item.case_id)})
          }}/>
        </Form.Item>
      </Col>
    </>
  )
}


const TestPlanForm = ({user, loading, project, testplan, dispatch, gconfig, fetchTestPlan}) => {

  const {visible, currentStep, title, treeData, selectedCaseData, caseMap, planRecord, pendingMap} = testplan;
  const {projects} = project;
  const {envList} = gconfig;
  const [form] = Form.useForm();
  const [cronDate, setCronDate] = useState(null);
  const [notificationConfigs, setNotificationConfigs] = useState([]);

  useEffect(() => {
    listAllNotificationConfigs().then(res => {
      if (res?.data) {
        setNotificationConfigs(Array.isArray(res.data) ? res.data : []);
      }
    });
  }, []);

  const onSave = data => {
    dispatch({
      type: 'testplan/save',
      payload: data,
    })
  }

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(planRecord)
  }, [planRecord])

  const onSubmit = async () => {

    const values = form.getFieldsValue(["name", "env", "priority", "cron", "ordered", "enabled", "case_list", "project_id", "retry_minutes", "notification_config_id"])
    let res;
    if (planRecord.id) {
      res = await dispatch({
        type: 'testplan/updateTestPlan',
        payload: {
          ...values,
          id: planRecord.id,
          case_list: values.case_list.map(item => parseInt(item.split("_")[1], 10))
        },
      })
    } else {
      res = await dispatch({
        type: 'testplan/insertTestPlan',
        payload: {...values, case_list: values.case_list.map(item => parseInt(item.split("_")[1], 10))},
      })
    }
    if (res) {
      onSave({
        visible: false,
      })
      fetchTestPlan();
    }


  }


  const getStep = () => {
    if (currentStep === 0) {
      // 返回人员选择form
      return <>
        <Col span={12}>
          <Form.Item label="项目" rules={
            [{required: true, message: '请选择项目'}]
          } name="project_id">
            <Select allowClear showSearch placeholder="选择项目" filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }>
              {projects.map(item => <Option value={item.id} key={item.id}>{item.name}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="计划名称" rules={
            [{required: true, message: '请填写测试计划名称'}]
          } name="name">
            <Input placeholder="输入测试计划名称"/>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="运行环境" rules={
            [{required: true, message: '请选择要运行的环境, 支持多选'}]
          } name="env">
            <Select placeholder="请选择要运行的环境" allowClear mode="multiple">
              {envList.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="优先级" rules={
            [{required: true, message: '请选择测试计划优先级'}]
          } name="priority">
            <Select placeholder="选择优先级" allowClear>
              {CONFIG.PRIORITY.map(v => <Option key={v} value={v}>{v}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="cron表达式"
                     extra={<div className="m-input-footer-msg">
                       {cronDate || "* cron表达式只支持5位!"}
                     </div>}
                     rules={
                       [
                         {required: true},
                         ({getFieldValue}) => ({
                           validator(_, value) {
                             if (value === '') {
                               setCronDate(null);
                               return;
                             }
                             try {
                               const date = parser.parseExpression(value)
                               setCronDate(`下次运行时间: ${moment(new Date(date.next())).format("YYYY-MM-DD HH:mm:ss")}`)
                               return Promise.resolve();
                             } catch (e) {
                               return Promise.reject(new Error("请输入正确的cron表达式"));
                             }
                           },
                         }),
                       ]
                     } name="cron"
          >
            <Input placeholder="请输入执行cron表达式"/>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="顺序执行" rules={
            [{required: true, message: '请选择测试计划是否需要顺序执行'}]
          } name="ordered">
            <Select placeholder="是否需要顺序执行" allowClear>
              <Option value={false}>否</Option>
              <Option value={true}>是</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="是否开启" name="enabled" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="开启" unCheckedChildren="关闭"/>
          </Form.Item>
        </Col>
      </>
    }

    if (currentStep === 1) {
      return <CaseList dispatch={dispatch} treeData={treeData} planRecord={planRecord} form={form} onSave={onSave}
                       selectedCaseData={selectedCaseData} caseMap={caseMap} loading={loading} pendingMap={pendingMap}/>
    }

    if (currentStep === 2) {
      return <>
        <Col span={24}>
          <Form.Item label="通知配置" name="notification_config_id" {...CONFIG.SQL_LAYOUT}>
            <Select allowClear showSearch placeholder="选择通知配置" style={{width: '100%'}}>
              {notificationConfigs.map(item => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="重试等待(min)" rules={
            [{required: false}]
          } name="retry_minutes">
            <InputNumber placeholder="重试等待时间, 不填则不重试" style={{width: '100%'}} min={0}/>
          </Form.Item>
        </Col>
      </>
    }
  }

  return <Modal width={700} open={visible} title={title} style={{marginTop: -40}} footer={null} onCancel={() => {
    onSave({visible: false})
  }
  }>
    <Form form={form} {...CONFIG.SUB_LAYOUT} initialValues={planRecord}>
      <Steps current={currentStep} size="small">
        <Step title="基础信息" icon={<TeamOutlined/>}/>
        <Step title="选择用例" icon={<ApiOutlined/>}/>
        <Step title="通知设置" icon={<NotificationOutlined/>}/>
      </Steps>
      <Row gutter={[8, 8]} style={{marginTop: 24}}>
        {getStep()}
        <div style={{margin: '24px auto'}}>
          {currentStep === 0 ? null :
            <Button style={{marginRight: 8}} onClick={() => {
              onSave({currentStep: currentStep - 1})
            }}><IconFont type="icon-shangyibu1"/> 上一步</Button>
          }
          {
            currentStep < 2 ? <Button type="primary" onClick={() => {
                form.validateFields().then(() => {
                  onSave({currentStep: currentStep + 1})
                })
              }}><IconFont type="icon--xiayibu"/> 下一步</Button> :
              <Button type="primary" onClick={onSubmit}><SaveOutlined/> 保存</Button>
          }
        </div>
      </Row>
    </Form>
  </Modal>
}

export default connect(({user, loading, project, testplan, gconfig}) => ({
  user,
  loading,
  project,
  testplan,
  gconfig
}))(TestPlanForm);
