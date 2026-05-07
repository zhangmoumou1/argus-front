import {connect} from '@umijs/max';
import {Button, Card, Col, Form, Row, Select, Tag} from "antd";
import styles from "@/components/Drawer/CaseDetail.less";
import getComponent from "@/components/PityForm";
import fields from "@/consts/fields";
import React, {useEffect, useState} from "react";
import {PlayCircleOutlined, SaveOutlined} from "@ant-design/icons";
import TestCaseBottom from "@/components/TestCase/TestCaseBottom";
import {listApiEndpoints, listApiEndpointVersions, listApiServices} from "@/services/interfaceManage";
import auth from "@/utils/auth";

const FormItem = Form.Item;

const TestCaseEditor = ({
                          dispatch,
                          form,
                          testcase,
                          caseId,
                          body,
                          setBody,
                          headers,
                          setHeaders,
                          formData,
                          setFormData,
                          bodyType,
                          setBodyType,
                          setSuffix,
                          onSubmit,
                        create = false
                        }) => {

  const {caseInfo} = testcase;
  const [services, setServices] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(caseInfo);
    setBody(caseInfo.body)
  }, [caseInfo])

  const projectId = parseInt(localStorage.getItem('project_id') || '0', 10);

  const loadServices = async () => {
    if (!projectId) return;
    const res = await listApiServices({ project_id: projectId });
    if (auth.response(res, false)) {
      setServices(res.data || []);
    }
  };

  const loadEndpoints = async (serviceId) => {
    if (!serviceId) {
      setEndpoints([]);
      return;
    }
    const res = await listApiEndpoints({ service_id: serviceId });
    if (auth.response(res, false)) {
      setEndpoints(res.data?.list || []);
    }
  };

  const loadVersions = async (endpointId) => {
    if (!endpointId) {
      setVersions([]);
      return;
    }
    const res = await listApiEndpointVersions({ endpoint_id: endpointId });
    if (auth.response(res, false)) {
      setVersions(res.data || []);
    }
  };

  useEffect(() => {
    loadServices();
  }, [projectId]);

  useEffect(() => {
    if (caseInfo?.api_service_id) {
      loadEndpoints(caseInfo.api_service_id);
    }
    if (caseInfo?.api_endpoint_id) {
      loadVersions(caseInfo.api_endpoint_id);
    }
  }, [caseInfo?.api_service_id, caseInfo?.api_endpoint_id]);

  return (
    <Form
      form={form}
      name="addCase"
      initialValues={caseInfo}
    >
      <Card title={<span className={styles.caseTitle}>场景信息</span>}
            extra={
              create ? null :
                <>
                  <Button type="primary" onClick={async () => {
                    await onSubmit(create)
                  }}><SaveOutlined/> 提交</Button>
                  {!create ? <Button style={{marginLeft: 8}} onClick={() => {
                      dispatch({
                        type: 'testcase/save',
                        payload: {editing: false}
                      })
                    }}><SaveOutlined/> 取消</Button> :
                    <Button style={{marginLeft: 8}}><PlayCircleOutlined/> 测试</Button>}
                </>}>
        <Row gutter={[8, 8]}>
          {
            fields.CaseDetail.map(item => <Col key={item.name} span={item.span || 24}>
              <FormItem label={item.label} colon={item.colon || true}
                        labelCol={{span: 8}} wrapperCol={{span: 16}}
                        rules={
                          [{required: item.required, message: item.message}]
                        } name={item.name} valuePropName={item.valuePropName || 'value'}
              >
                {getComponent(item.type, item.placeholder, item.component)}
              </FormItem>
            </Col>)
          }
        </Row>
        <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
          <Col span={8}>
            <FormItem label="接口服务" colon={true} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} name="api_service_id">
              <Select
                allowClear
                placeholder="可选，绑定服务"
                options={(services || []).map((item) => ({ label: item.name, value: item.id }))}
                onChange={(value) => {
                  form.setFieldsValue({
                    api_endpoint_id: undefined,
                    api_version_id: undefined,
                    api_version_no: undefined,
                    api_pending_update: 0,
                  });
                  loadEndpoints(value);
                }}
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="接口" colon={true} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} name="api_endpoint_id">
              <Select
                allowClear
                placeholder="可选，绑定接口"
                options={(endpoints || []).map((item) => ({ label: `${item.method} ${item.path}`, value: item.id }))}
                onChange={(value) => {
                  form.setFieldsValue({
                    api_version_id: undefined,
                    api_version_no: undefined,
                    api_pending_update: 0,
                  });
                  loadVersions(value);
                }}
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="接口版本" colon={true} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} name="api_version_id">
              <Select
                allowClear
                placeholder="可选，绑定版本"
                options={(versions || []).map((item) => ({ label: item.version_no, value: item.id }))}
                onChange={(value) => {
                  const selected = (versions || []).find((item) => item.id === value);
                  form.setFieldsValue({
                    api_version_no: selected?.version_no || undefined,
                    api_pending_update: 0,
                  });
                }}
              />
            </FormItem>
          </Col>
          <Col span={24}>
            <FormItem name="api_version_no" hidden><input /></FormItem>
            <FormItem name="api_bind_mode" hidden initialValue="pinned"><input /></FormItem>
            <FormItem name="api_pending_update" hidden initialValue={0}><input /></FormItem>
            <Tag color="processing">可为用例绑定指定接口版本，后续接口版本升级时会自动标记待更新</Tag>
          </Col>
        </Row>
        <Row style={{marginTop: 8}}>
          <Col span={24}>
            <TestCaseBottom case_id={caseId} body={body} bodyType={bodyType} setBody={setBody} headers={headers}
                            setHeaders={setHeaders} form={form} createMode={create}
                            formData={formData} setFormData={setFormData} setSuffix={setSuffix}
                            setBodyType={setBodyType}
            />
          </Col>
        </Row>
      </Card>
    </Form>

  )

}

export default connect(({user, testcase, loading}) => ({testcase, user, loading}))(TestCaseEditor);
