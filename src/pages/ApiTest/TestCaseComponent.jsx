import {PageContainer} from "@ant-design/pro-components";
import {connect, useLocation, useParams} from '@umijs/max';
import React, {useEffect, useMemo, useState} from "react";
import {Badge, Button, Card, Col, Descriptions, Empty, Form, Modal, Row, Segmented, Spin, Tag, Tooltip, message} from "antd";
import TestCaseEditor from "@/components/TestCase/TestCaseEditor";
import TestResult from "@/components/TestCase/TestResult";
import CONFIG from "@/consts/config";
import ConstructorModal from "@/components/TestCase/ConstructorModal";
import "./TestCaseComponent.less";
import {EditOutlined, PlayCircleOutlined} from "@ant-design/icons";
import common from "@/utils/common";
import auth from "@/utils/auth";
import UserLink from "@/components/Button/UserLink";
import TestCaseBottom from "@/components/TestCase/TestCaseBottom";
import NoPermission from '@/assets/NoPermission.svg';
import {CASE_TYPE, REQUEST_METHOD, REQUEST_TYPE} from "@/components/Common/global";
import {listApiEndpoints, listApiServices, reviewApiEndpointCase} from "@/services/interfaceManage";


const TestCaseComponent = ({loading, dispatch, user, testcase, gconfig}) => {
  const params = useParams();
  const location = useLocation();
  const routeParts = useMemo(() => location.pathname.split('/').filter(Boolean), [location.pathname]);
  const routeDirectory = routeParts[2] || '';
  const routeCaseId = routeParts[3] && routeParts[3] !== 'add' ? routeParts[3] : undefined;
  const directory_id = params.directory || routeDirectory;
  const case_id = params.case_id && params.case_id !== 'add' ? params.case_id : routeCaseId;
  const directoryIdInt = parseInt(directory_id, 10);
  const caseIdInt = parseInt(case_id, 10);
  const {
    directoryName,
    caseInfo,
    outParameters,
    editing,
    casePermission,
    constructRecord,
    constructorModal,
    executeEnv,
  } = testcase;
  const {envList} = gconfig;
  const {userMap} = user;
  const [resultModal, setResultModal] = useState(false);
  const [testResult, setTestResult] = useState({});
  const [form] = Form.useForm();
  const [constructorForm] = Form.useForm();
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [formData, setFormData] = useState([]);
  const [suffix, setSuffix] = useState(false);
  const [apiServiceName, setApiServiceName] = useState('');
  const [apiEndpointName, setApiEndpointName] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('no_impact');

  const fetchTestCaseInfo = () => {
    if (case_id) {
      dispatch({
        type: 'testcase/queryTestcase',
        payload: {
          caseId: case_id,
        }
      })
    }
  }

  useEffect(() => {
    if (directory_id) {
      dispatch({
        type: 'testcase/queryTestcaseDirectory',
        payload: {
          directory_id,
        }
      })
    }

    dispatch({
      type: 'testcase/save',
      payload: {
        currentDirectoryId: Number.isNaN(directoryIdInt) ? null : directoryIdInt,
        currentCaseId: Number.isNaN(caseIdInt) ? null : caseIdInt,
        directoryName: '加载中...',
        casePermission: false,
        caseInfo: {},
        asserts: [],
        preConstructor: [],
        postConstructor: [],
        constructors_case: {},
        testData: {},
        outParameters: [],
        executeEnv: '',
      }
    })

    fetchTestCaseInfo();
  }, [location.pathname, directory_id, case_id])

  useEffect(() => {
    // 获取环境信息
    dispatch({
      type: 'gconfig/fetchEnvList',
      payload: {
        page: 1,
        size: 1000,
        exactly: true // 全部获取
      }
    })

    dispatch({
      type: 'user/fetchUserList'
    })
  }, [])

  useEffect(() => {
    const normalizedCaseInfo = {
      ...caseInfo,
      status: caseInfo?.status !== undefined && caseInfo?.status !== null ? String(caseInfo.status) : undefined,
      request_type: caseInfo?.request_type !== undefined && caseInfo?.request_type !== null ? String(caseInfo.request_type) : undefined,
      api_service_id: Number(caseInfo?.api_service_id || 0) > 0 ? caseInfo.api_service_id : undefined,
      api_endpoint_id: Number(caseInfo?.api_endpoint_id || 0) > 0 ? caseInfo.api_endpoint_id : undefined,
      api_version_id: Number(caseInfo?.api_version_id || 0) > 0 ? caseInfo.api_version_id : undefined,
    };
    form.resetFields();
    form.setFieldsValue(normalizedCaseInfo);
    setHeaders(common.parseHeaders(caseInfo.request_headers))
    setBody(caseInfo.body);
    setBodyType(caseInfo.body_type)
  }, [caseInfo, editing])

  useEffect(() => {
    const loadApiAssetNames = async () => {
      const serviceId = Number(caseInfo?.api_service_id || 0);
      const endpointId = Number(caseInfo?.api_endpoint_id || 0);
      if (!serviceId) {
        setApiServiceName('');
        setApiEndpointName('');
        return;
      }

      const projectId = Number(localStorage.getItem('project_id') || 0);
      const serviceRes = await listApiServices(projectId ? {project_id: projectId} : {});
      if (auth.response(serviceRes, false)) {
        const services = serviceRes.data || [];
        const matchedService = services.find((item) => Number(item.id) === serviceId);
        setApiServiceName(matchedService?.name || '');
      } else {
        setApiServiceName('');
      }

      if (!endpointId) {
        setApiEndpointName('');
        return;
      }
      const endpointRes = await listApiEndpoints({service_id: serviceId});
      if (auth.response(endpointRes, false)) {
        const endpoints = endpointRes.data?.list || [];
        const matchedEndpoint = endpoints.find((item) => Number(item.id) === endpointId);
        setApiEndpointName(
          matchedEndpoint ? `${matchedEndpoint.method || ''} ${matchedEndpoint.path || ''}`.trim() : '',
        );
      } else {
        setApiEndpointName('');
      }
    };

    loadApiAssetNames();
  }, [caseInfo?.api_service_id, caseInfo?.api_endpoint_id]);


  const load = !!(loading.effects['testcase/queryTestcaseDirectory']
    || loading.effects['testcase/queryTestcase']
    || loading.effects['testcase/fetchUserList'])

  const getTag = tag => {
    if (tag === null) {
      return '无'
    }
    if (typeof tag === 'object') {
      return tag.length > 0 ? tag.map(v => <Tag
        key={v}
        style={{marginRight: 8}}
        color='blue'>{v}</Tag>) : '无'
    }
    return tag ? tag.split(',').map(v => <Tag
      key={v}
      style={{marginRight: 8}}
      color='blue'>{v}</Tag>) : '无'
  }

  const filterOutParameters = () => {
    return outParameters.filter(v => {
      if (v.id) {
        return true;
      }
      if (v.source === 4) {
        return v.name;
      }
      if (v.source === 1 || v.source === 6) {
        return v.name && v.expression
      }
      return v.match_index && v.name && v.expression;
    })

  }

  const onSubmit = async (isCreate = false) => {
    const values = await form.validateFields()
    const params = {
      ...values,
      request_type: parseInt(values.request_type, 10),
      status: parseInt(values.status, 10),
      tag: values.tag ? values.tag.join(',') : null,
      directory_id,
      body_type: bodyType,
      request_headers: common.translateHeaders(headers),
      body: bodyType === 2 ? JSON.stringify(formData) : body,
      out_parameters: filterOutParameters(),
    };
    if (!editing && !isCreate) {
      params.priority = caseInfo.priority;
      params.name = caseInfo.name;
      params.status = caseInfo.status;
      params.tag = caseInfo.tag !== null ? typeof caseInfo.tag === 'object' ?
        caseInfo.tag.join(',') : caseInfo.tag ? caseInfo.tag : null : null;
      params.request_type = caseInfo.request_type;
    }
    if (caseInfo.id) {
      // 说明是编辑case
      params.id = caseInfo.id;
      dispatch({
        type: 'testcase/updateTestcase',
        payload: params,
      })
    } else {
      // 说明是新增Case
      dispatch({
        type: 'testcase/insertTestcase',
        payload: params,
      })
    }
  }

  // 在线运行用例
  const onExecuteTestCase = async env => {
    const res = await dispatch({
      type: 'testcase/onExecuteTestCase',
      payload: {case_id, env}
    })
    if (auth.notificationResponse(res, true)) {
      setResultModal(true);
      setTestResult(res.data);
    }
  }

  const onRun = async () => {
    if (!executeEnv) {
      message.info('请先在页面内选择“当前执行环境”后再运行');
      return;
    }
    await onExecuteTestCase(executeEnv);
  };

  const getTagArray = () => {
    if (caseInfo.tag === null || caseInfo.tag === "") {
      return []
    }
    if (typeof caseInfo.tag === 'object') {
      return caseInfo.tag;
    }
    return caseInfo.tag.split(",")
  }

  const submitReview = async () => {
    const res = await reviewApiEndpointCase({
      case_id,
      review_status: reviewStatus,
    });
    if (auth.response(res, true)) {
      message.success('审查成功');
      setReviewModalOpen(false);
      fetchTestCaseInfo();
    }
  };

  return (
    <PageContainer key={location.pathname} title={false} breadcrumb={null}>

      <TestResult width={1000} modal={resultModal} setModal={setResultModal} response={testResult}
                  caseName={caseInfo.name} single={false}/>
      <Modal
        title="版本审查"
        open={reviewModalOpen}
        onOk={submitReview}
        okText="确认"
        cancelText="取消"
        onCancel={() => setReviewModalOpen(false)}
      >
        <div style={{marginBottom: 12, color: '#667085'}}>
          当前接口关联的资产版本变更，请对当前接口进行审查，保证运行正常
        </div>
        <Segmented
          block
          className="review-segmented"
          value={reviewStatus}
          onChange={(value) => setReviewStatus(value)}
          options={[
            {label: '无影响', value: 'no_impact'},
            {label: '已审查', value: 'reviewed'},
          ]}
        />
      </Modal>

      <Spin spinning={load} tip="暴力加载中..." size="large">
        {
          !case_id ? <TestCaseEditor directoryId={directory_id} create={true} form={form} body={body} setBody={setBody}
                                     headers={headers} setHeaders={setHeaders} onSubmit={onSubmit}
                                     setBodyType={setBodyType} bodyType={bodyType}
            /> :

            casePermission ? <Row>
              <Col span={24}>
                <ConstructorModal width={1050} modal={constructorModal} setModal={e => {
                  dispatch({type: 'testcase/save', payload: {constructorModal: e}})
                }} caseId={case_id} form={constructorForm} record={constructRecord}
                                  fetchData={fetchTestCaseInfo} suffix={suffix}/>
                {
                  editing ? <TestCaseEditor directoryId={directory_id} form={form} body={body} setBody={setBody}
                                            caseId={case_id} formData={formData} setFormData={setFormData}
                                            bodyType={bodyType} setBodyType={setBodyType} setSuffix={setSuffix}
                                            headers={headers} setHeaders={setHeaders} onSubmit={onSubmit}/> :
                    <Card style={{margin: -8}} bodyStyle={{padding: 24}} title={
                      <span>{directoryName} {caseInfo.name ? ` > ${caseInfo.name}` : ''} {CASE_TYPE[caseInfo.case_type]}</span>}
                          extra={<div>
                            <Button onClick={() => {
                              dispatch({
                                type: 'testcase/save',
                                payload: {
                                  editing: true,
                                  caseInfo: {
                                    ...caseInfo,
                                    status: caseInfo.status.toString(),
                                    request_type: caseInfo.request_type.toString(),
                                    tag: getTagArray()
                                  },
                                  activeKey: '3',
                                }
                              })
                            }} style={{borderRadius: 16}}><EditOutlined/> 编辑</Button>
                            {caseInfo.api_pending_update ? (
                              <Button style={{marginLeft: 8, borderRadius: 16}} onClick={() => {
                                setReviewStatus('no_impact');
                                setReviewModalOpen(true);
                              }}>版本审查</Button>
                            ) : null}
                            <Button type="primary" style={{marginLeft: 8, borderRadius: 16}}
                                    loading={loading.effects['testcase/onExecuteTestCase']}
                                    onClick={onRun}><PlayCircleOutlined/> 运行</Button>
                          </div>}>
                      <Descriptions column={4}>
                        <Descriptions.Item label='用例名称'><span><a>{caseInfo.name}</a></span></Descriptions.Item>

                        <Descriptions.Item
                          label='请求类型'>{REQUEST_TYPE[caseInfo.request_type]}</Descriptions.Item>
                        <Descriptions.Item label='请求url' span={2} style={{
                          fontSize: 14,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <Tooltip title={caseInfo.url}>
                            <a href={caseInfo.url}>{caseInfo.url}</a>
                          </Tooltip>
                        </Descriptions.Item>
                        <Descriptions.Item label='请求方式'>
                          {REQUEST_METHOD[caseInfo.request_method]}
                        </Descriptions.Item>
                        <Descriptions.Item label='用例等级'>{<Tag
                          color={CONFIG.CASE_TAG[caseInfo.priority]}>{caseInfo.priority}</Tag>}</Descriptions.Item>
                        <Descriptions.Item label='用例状态'>{
                          <Badge {...CONFIG.CASE_BADGE[caseInfo.status]} />}</Descriptions.Item>
                        <Descriptions.Item label='用例标签'>{
                          <div style={{textAlign: 'center'}}>
                            {getTag(caseInfo.tag)}
                          </div>
                        }</Descriptions.Item>
                        <Descriptions.Item
                          label='创建人'><UserLink size={16} user={userMap[caseInfo.create_user]}/></Descriptions.Item>
                        <Descriptions.Item
                          label='更新人'><UserLink size={16} user={userMap[caseInfo.update_user]}/></Descriptions.Item>
                        <Descriptions.Item label='接口资产'>
                          {apiServiceName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='接口'>
                          {apiEndpointName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label='接口版本'>
                          <span>
                            {caseInfo.api_version_no || '-'}
                            {caseInfo.api_pending_update ? (
                              <Tooltip title="查看新版本差异">
                                <Tag
                                  color="red"
                                  style={{marginLeft: 8, cursor: 'pointer'}}
                                  onClick={() => {
                                    const serviceId = Number(caseInfo?.api_service_id || 0);
                                    const endpointId = Number(caseInfo?.api_endpoint_id || 0);
                                    if (serviceId > 0) {
                                      const endpointUrl = encodeURIComponent(String(caseInfo?.url || ''));
                                      const query = `?endpoint_url=${endpointUrl}`;
                                      if (endpointId > 0) {
                                        window.open(`/#/apiTest/interface/${serviceId}/${endpointId}${query}`, '_blank');
                                      } else {
                                        window.open(`/#/apiTest/interface/${serviceId}${query}`, '_blank');
                                      }
                                    }
                                  }}
                                >
                                  有新版
                                </Tag>
                              </Tooltip>
                            ) : null}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label='创建时间'>{caseInfo.created_at}</Descriptions.Item>
                        <Descriptions.Item label='更新时间'>{caseInfo.updated_at}</Descriptions.Item>
                      </Descriptions>
                      <TestCaseBottom setSuffix={setSuffix} headers={headers} setHeaders={setHeaders}
                                      body={body} setBody={setBody} case_id={case_id} formData={formData}
                                      setFormData={setFormData} bodyType={bodyType} form={form}
                                      setBodyType={setBodyType} onSubmit={onSubmit}
                                      editable={editing}
                      />
                    </Card>
                }
              </Col>
            </Row> : <Empty description="你无法查看此用例，请联系对应项目组长开通权限。" image={NoPermission}
                            imageStyle={{height: 400}}/>
        }
      </Spin>


    </PageContainer>
  )
}

export default connect((
  {
    user, testcase, loading, gconfig
  }
) => (
  {
    testcase, user, loading, gconfig
  }
))(TestCaseComponent);
