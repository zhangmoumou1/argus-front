import {connect} from '@umijs/max';
import {Button, Card, Col, Form, Row, Select, message} from "antd";
import styles from "@/components/Drawer/CaseDetail.less";
import getComponent from "@/components/PityForm";
import fields from "@/consts/fields";
import React, {useEffect, useState} from "react";
import {PlayCircleOutlined, SaveOutlined} from "@ant-design/icons";
import TestCaseBottom from "@/components/TestCase/TestCaseBottom";
import {
  getApiEndpointSample,
  getApiEndpointVersionDetail,
  listApiEndpoints,
  listApiEndpointVersions,
  listApiServices,
} from "@/services/interfaceManage";
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
  const [assetQueryParams, setAssetQueryParams] = useState([]);

  const safeParseJson = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  };

  const toHeaderRows = (rawHeaders) => {
    const list = Array.isArray(rawHeaders)
      ? rawHeaders
      : Object.keys(rawHeaders || {}).map((key) => ({ key, value: rawHeaders[key] }));
    return list.map((item, idx) => ({
      id: Date.now() + idx,
      key: item?.key || item?.name || '',
      value: item?.value || item?.default || '',
      description: item?.description || '',
    }));
  };

  const buildUrlWithQuery = (baseUrl, path, queryObj) => {
    const base = String(baseUrl || '').replace(/\/+$/, '');
    const route = String(path || '').trim();
    const normalizedRoute = route
      ? (route.startsWith('/') ? route : `/${route}`)
      : '';
    const urlPath = `${base}${normalizedRoute}` || route || '';
    const queryEntries = Object.entries(queryObj || {}).filter(([key]) => !!key);
    if (!queryEntries.length) return urlPath;
    const query = queryEntries
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value === undefined || value === null ? '' : value)}`)
      .join('&');
    return `${urlPath}${urlPath.includes('?') ? '&' : '?'}${query}`;
  };

  const extractSwaggerQueryAndBody = (requestParamsRaw) => {
    const requestParams = safeParseJson(requestParamsRaw, {});
    const parameters = Array.isArray(requestParams?.parameters)
      ? requestParams.parameters
      : Array.isArray(requestParams?.req_query)
        ? requestParams.req_query
        : [];
    const queryObj = {};
    const queryRows = [];
    parameters
      .filter((item) => {
        const inValue = String(item?.in || '').toLowerCase();
        return inValue === 'query' || requestParams?.req_query;
      })
      .forEach((item) => {
        const key = String(item?.name || '').trim();
        if (!key) return;
        const schemaType = item?.schema?.type || item?.type;
        if (schemaType === 'integer' || schemaType === 'number') {
          queryObj[key] = 0;
        } else if (schemaType === 'boolean') {
          queryObj[key] = false;
        } else {
          queryObj[key] = '';
        }
        queryRows.push({
          key,
          value: queryObj[key],
          description: item?.description || '',
        });
      });

    let bodyContent = '';
    const requestBody = requestParams?.requestBody || {};
    const content = requestBody?.content || {};
    const contentKeys = Object.keys(content);
    if (contentKeys.length) {
      const contentNode = content['application/json'] || content[contentKeys[0]] || {};
      const schema = contentNode?.schema || {};
      if (schema?.type === 'object' || schema?.properties) {
        const bodyObj = {};
        Object.keys(schema?.properties || {}).forEach((propKey) => {
          const propSchema = schema.properties[propKey] || {};
          if (propSchema.type === 'integer' || propSchema.type === 'number') {
            bodyObj[propKey] = 0;
          } else if (propSchema.type === 'boolean') {
            bodyObj[propKey] = false;
          } else if (propSchema.type === 'array') {
            bodyObj[propKey] = [];
          } else if (propSchema.type === 'object') {
            bodyObj[propKey] = {};
          } else {
            bodyObj[propKey] = '';
          }
        });
        bodyContent = JSON.stringify(bodyObj, null, 2);
      } else if (schema?.type === 'array') {
        bodyContent = JSON.stringify([], null, 2);
      } else {
        bodyContent = JSON.stringify({}, null, 2);
      }
    } else if (requestParams?.req_body_other) {
      const reqBodyOther = requestParams.req_body_other;
      if (typeof reqBodyOther === 'string') {
        bodyContent = reqBodyOther;
      } else {
        bodyContent = JSON.stringify(reqBodyOther, null, 2);
      }
    } else if (Array.isArray(requestParams?.req_body_form) && requestParams.req_body_form.length) {
      const formObj = {};
      requestParams.req_body_form.forEach((item) => {
        const key = String(item?.name || '').trim();
        if (!key) return;
        formObj[key] = '';
      });
      bodyContent = JSON.stringify(formObj, null, 2);
    }

    return { queryObj, bodyContent, queryRows };
  };

  const autoFillCaseFromApiAsset = async ({ endpointId, versionId }) => {
    if (!create || !endpointId || !versionId) return;
    const selectedEndpoint = (endpoints || []).find((item) => Number(item.id) === Number(endpointId));
    const selectedService = (services || []).find((item) => Number(item.id) === Number(form.getFieldValue('api_service_id')));
    const versionRes = await getApiEndpointVersionDetail({ version_id: versionId });
    if (!auth.response(versionRes, false)) return;
    const versionDetail = versionRes.data || {};
    const struct = versionDetail.request_params_struct || {};

    let sampleData = null;
    const sampleRes = await getApiEndpointSample({ endpoint_id: endpointId });
    if (auth.response(sampleRes, false)) {
      sampleData = sampleRes.data || null;
    }

    const selectedVersion = (versions || []).find((item) => Number(item.id) === Number(versionId));
    const method = String(selectedVersion?.method || versionDetail.method || selectedEndpoint?.method || 'GET').toUpperCase();
    const path = versionDetail.path || selectedEndpoint?.path || '';

    let queryObj = {};
    let bodyContent = '';
    let queryRows = [];
    if (sampleData) {
      const structParams = Array.isArray(struct?.params_items) ? struct.params_items : [];
      const structMap = structParams.reduce((acc, item) => {
        const k = String(item?.key || '').trim();
        if (k) acc[k] = item;
        return acc;
      }, {});
      queryObj = safeParseJson(sampleData.request_query, {});
      const sampleBody = sampleData.request_body;
      if (sampleBody !== undefined && sampleBody !== null && String(sampleBody) !== '') {
        bodyContent = typeof sampleBody === 'string'
          ? sampleBody
          : JSON.stringify(sampleBody, null, 2);
      }
      queryRows = Object.keys(queryObj || {}).map((key) => ({
        key,
        value: queryObj[key],
        description: structMap[key]?.description || '',
      }));
    } else {
      if (Array.isArray(struct?.params_items) && struct.params_items.length) {
        queryRows = struct.params_items.map((item) => ({
          key: item?.key || '',
          value: '',
          description: item?.description || '',
        }));
        queryObj = queryRows.reduce((acc, item) => {
          if (item.key) acc[item.key] = '';
          return acc;
        }, {});
      }

      if (!queryRows.length || (struct?.request_kind === 'body')) {
        const extracted = extractSwaggerQueryAndBody(versionDetail.request_params);
        if (!Object.keys(queryObj).length) {
          queryObj = extracted.queryObj;
        }
        if (!queryRows.length) {
          queryRows = extracted.queryRows || [];
        }
        bodyContent = extracted.bodyContent;
      }

      if (!bodyContent && struct?.body_type) {
        if (struct.body_type === 'raw-json' || struct.body_type === 'raw-text') {
          bodyContent = struct.body_raw_example || '';
        } else if ((struct.body_type === 'form-data' || struct.body_type === 'x-www-form-urlencoded') && Array.isArray(struct.body_items)) {
          const formObj = {};
          struct.body_items.forEach((item) => {
            const key = String(item?.key || '').trim();
            if (key) formObj[key] = '';
          });
          bodyContent = JSON.stringify(formObj, null, 2);
        }
      }
    }

    const baseFullUrl = String(
      selectedVersion?.full_url || versionDetail.full_url || selectedEndpoint?.full_url || ''
    ).trim();
    const requestUrl = baseFullUrl
      ? baseFullUrl
      : buildUrlWithQuery(selectedService?.base_url || '', path, {});

    const nextBodyType = bodyContent ? 1 : 0;
    form.setFieldsValue({
      request_method: method,
      url: requestUrl,
    });
    setAssetQueryParams(queryRows || []);
    setHeaders([]);
    setBody(bodyContent);
    setBodyType(nextBodyType);
    setFormData([]);
    message.success('已填充接口资产数据');
  };

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
      <Card title={<span className={styles.caseTitle}>接口信息</span>}
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
            <FormItem label="接口资产" colon={true} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} name="api_service_id">
              <Select
                allowClear
                showSearch
                placeholder="可选，绑定服务"
                options={(services || []).map((item) => ({ label: item.name, value: item.id }))}
                onChange={(value) => {
                  form.setFieldsValue({
                    api_endpoint_id: undefined,
                    api_version_id: undefined,
                    api_version_no: undefined,
                    api_pending_update: 0,
                  });
                  if (create) {
                    form.setFieldsValue({ request_method: undefined, url: '' });
                    setAssetQueryParams([]);
                    setHeaders([]);
                    setBody('');
                    setBodyType(0);
                    setFormData([]);
                  }
                  loadEndpoints(value);
                }}
              />
            </FormItem>
          </Col>
          <Col span={8}>
            <FormItem label="接口" colon={true} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} name="api_endpoint_id">
              <Select
                allowClear
                showSearch
                placeholder="可选，绑定接口"
                options={(endpoints || []).map((item) => ({ label: `${item.method} ${item.path}`, value: item.id }))}
                filterOption={(input, option) => {
                  const keyword = String(input || '').toLowerCase();
                  const endpoint = (endpoints || []).find((it) => Number(it.id) === Number(option?.value));
                  const fullUrl = String(endpoint?.full_url || '').toLowerCase();
                  const label = String(option?.label || '').toLowerCase();
                  return label.includes(keyword) || fullUrl.includes(keyword);
                }}
                onChange={(value) => {
                  form.setFieldsValue({
                    api_version_id: undefined,
                    api_version_no: undefined,
                    api_pending_update: 0,
                  });
                  if (create) {
                    form.setFieldsValue({ request_method: undefined, url: '' });
                    setAssetQueryParams([]);
                    setHeaders([]);
                    setBody('');
                    setBodyType(0);
                    setFormData([]);
                  }
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
                onChange={async (value) => {
                  const selected = (versions || []).find((item) => item.id === value);
                  form.setFieldsValue({
                    api_version_no: selected?.version_no || undefined,
                    api_pending_update: 0,
                  });
                  const endpointId = form.getFieldValue('api_endpoint_id');
                  await autoFillCaseFromApiAsset({ endpointId, versionId: value });
                }}
              />
            </FormItem>
          </Col>
          <Col span={24}>
            <FormItem name="api_version_no" hidden><input /></FormItem>
            <FormItem name="api_bind_mode" hidden initialValue="pinned"><input /></FormItem>
            <FormItem name="api_pending_update" hidden initialValue={0}><input /></FormItem>
          </Col>
        </Row>
        <Row style={{marginTop: 8}}>
          <Col span={24}>
            <TestCaseBottom case_id={caseId} body={body} bodyType={bodyType} setBody={setBody} headers={headers}
                            setHeaders={setHeaders} form={form} createMode={create}
                            formData={formData} setFormData={setFormData} setSuffix={setSuffix}
                            setBodyType={setBodyType} assetQueryParams={assetQueryParams}
            />
          </Col>
        </Row>
      </Card>
    </Form>

  )

}

export default connect(({user, testcase, loading}) => ({testcase, user, loading}))(TestCaseEditor);
