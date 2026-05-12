import {PageContainer} from '@ant-design/pro-components';
import {Badge, Button, Card, Col, Divider, Input, Modal, Row, Select, Switch, Table, Tag} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {connect} from '@umijs/max';

import {PlusOutlined} from '@ant-design/icons';
import FormForModal from '@/components/PityForm/FormForModal';
import {vs2015} from "react-syntax-highlighter/dist/cjs/styles/hljs";
import SyntaxHighlighter from "react-syntax-highlighter";
import UserLink from "@/components/Button/UserLink";
import PityAceEditor from "@/components/CodeEditor/AceEditor/index";
import CONFIG from "@/consts/config";
import {listProject} from "@/services/project";

const {Option} = Select;
const GConfig = ({gconfig, user, loading, dispatch}) => {
  const {data, envList, key_type, var_type, envMap, modal, currentEnv, currentCreateUser, currentVarType, currentProjectId, currentCaseName, name, pagination} = gconfig;
  const {userMap, userList, currentUser} = user;
  const [record, setRecord] = useState({id: 0, key_type: 0, type: 1});
  const [language, setLanguage] = useState(0);
  const [editor, setEditor] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectMap, setProjectMap] = useState({});
  const initializedCreateUserRef = useRef(false);

  const getType = () => {
    if (language === 1) {
      return 'yaml';
    }
    if (language === 2) {
      return 'yaml';
    }
    return 'text';
  };

  const formatJsonValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    const rawText = `${value}`;
    try {
      return JSON.stringify(JSON.parse(rawText), null, 2);
    } catch (e) {
      // 兼容后端返回的“伪 JSON”格式：中文引号/单引号
      try {
        const normalized = rawText
          .replace(/[‘’]/g, "'")
          .replace(/[“”]/g, '"')
          .replace(/'([^']*)'/g, '"$1"');
        return JSON.stringify(JSON.parse(normalized), null, 2);
      } catch (error) {
        return rawText;
      }
    }
  };

  const columns = [
    {
      title: '环境',
      key: 'env',
      dataIndex: 'env',
      render: env => <Tag>{envMap[env]}</Tag>,
    },
    {
      title: '变量类型',
      dataIndex: 'type',
      key: 'var_type',
      width: 100,
      render: text => <Tag color='blue'>{var_type[text] || '-'}</Tag>,
    },
    {
      title: '来源项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: text => projectMap[text] || text || '-',
    },
    {
      title: '来源用例',
      dataIndex: 'case_name',
      key: 'case_name',
      render: (text, row) => text || row.case_id || '-',
    },
    {
      title: 'key',
      dataIndex: 'key',
      key: 'keyword',
    },
    {
      title: 'key类型',
      dataIndex: 'key_type',
      key: 'key_type',
      width: 100,
      render: key => <Tag color={CONFIG.CONFIG_TYPE_TAG[key_type[key]]}>{key_type[key]}</Tag>,
    },
    {
      title: 'value',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (text, record) => {
        if (record.key_type === 0) {
          return text;
        }
        if (record.key_type === 1) {
          return <a onClick={() => {
            Modal.info({
              title: `${record.key}`,
              width: 500,
              bodyStyle: {padding: -12},
              content: <SyntaxHighlighter language="json" style={vs2015}>{formatJsonValue(record.value)}</SyntaxHighlighter>
            })
          }}>查看</a>
        }
        // yaml
        if (record.key_type === 2) {
          return <a onClick={() => {
            Modal.info({
              title: `${record.key}`,
              width: 500,
              bodyStyle: {padding: -12},
              content: <SyntaxHighlighter language="yaml" style={vs2015}>{record.value}</SyntaxHighlighter>
            })
          }}>查看</a>
        }
      }
    },
    {
      title: '是否可用',
      dataIndex: 'enable',
      key: 'enable',
      width: 100,
      render: text => <Badge status={text ? 'processing' : 'default'} text={text ? '使用中' : '已禁止'}/>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: text => text || '-',
    },
    {
      title: "创建人",
      key: "create_user",
      render: (_, record) => <UserLink user={userMap[record.create_user.toString()]}/>
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) => {
        const disableEdit = record.type === 2 || record.type === 3;
        const disableDelete = record.type === 3;
        return <>
          <Button type='link' size='small' disabled={disableEdit} onClick={() => {
            if (disableEdit) return;
            save({modal: true})
            setRecord(record);
            setLanguage(record.key_type);
          }}>编辑</Button>
          <Divider type='vertical'/>
          <Button type='link' size='small' disabled={disableDelete} onClick={() => {
            if (disableDelete) return;
            dispatch({type: 'gconfig/deleteGConfig', payload: {id: record.id}})
          }}>删除</Button>
        </>;
      },
    },
  ];

  const fields = [
    {
      name: 'env',
      label: '环境',
      required: true,
      component: <Select defaultValue={currentEnv} placeholder="选择对应环境">
        {
          envList.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)
        }
      </Select>,
      type: 'select',
    },
    {
      name: 'key_type',
      label: 'key类型',
      required: true,
      component: <Select onSelect={e => {
        setLanguage(e);
      }
      }>
        <Option value={0}>String</Option>
        <Option value={1}>JSON</Option>
        <Option value={2}>YAML</Option>
      </Select>,
      type: 'select',
    },
    {
      name: 'type',
      label: '变量类型',
      required: true,
      component: <Select disabled={record.id !== 0}>
        <Option value={1}>全局变量</Option>
        <Option value={2}>接口变量</Option>
        <Option value={3}>特殊变量</Option>
      </Select>,
      type: 'select',
      initialValue: 1,
    },
    {
      name: 'project_id',
      label: '来源项目',
      component: <Select allowClear placeholder='请选择来源项目'>
        {projectOptions.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
      </Select>,
      type: 'select',
    },
    {
      name: 'case_name',
      label: '来源用例',
      component: <Input placeholder='请输入来源用例名称'/>,
      type: 'input',
    },
    {
      name: 'key',
      label: 'key',
      required: true,
      type: 'input',
      placeholder: '请输入key',
    },
    {
      name: 'value',
      label: 'value',
      required: true,
      component: <PityAceEditor language={getType()} setEditor={setEditor} height={250}/>,
    },
    {
      name: 'enable',
      label: '是否可用',
      required: true,
      component: <Switch/>,
      valuePropName: 'checked',
      initialValue: true,
    },
  ];

  const getEnvList = async () => {
    await dispatch({
      type: 'gconfig/fetchEnvList',
      payload: {
        page: 1,
        size: 10000,
      },
    });
  };

  const fetchUserList = () => {
    dispatch({
      type: 'user/fetchUserList',
    });
  }

  const fetchProjectList = async () => {
    const res = await listProject({page: 1, size: 10000});
    if (res && res.code === 0) {
      const dataList = res.data || [];
      const map = {};
      dataList.forEach(item => {
        map[item.id] = item.name;
      });
      setProjectOptions(dataList);
      setProjectMap(map);
    }
  };

  const getConfig = (page = pagination.current, size = pagination.pageSize) => {
    dispatch({
      type: 'gconfig/fetchGConfig',
      payload: {
        page,
        size,
        env: currentEnv || '',
        key: name,
        create_user: currentCreateUser || '',
        var_type: currentVarType || '',
        project_id: currentProjectId || '',
        case_name: currentCaseName || '',
      },
    });
  };

  useEffect(() => {
    getEnvList();
    fetchProjectList();
  }, [])

  useEffect(() => {
    fetchUserList()
    getConfig();
  }, [currentEnv, currentCreateUser, currentVarType, currentProjectId, currentCaseName, name, pagination.current]);

  useEffect(() => {
    if (initializedCreateUserRef.current) {
      return;
    }
    initializedCreateUserRef.current = true;
    if (currentCreateUser !== undefined && currentCreateUser !== null && currentCreateUser !== '') {
      return;
    }
    const localUser = localStorage.getItem('pityUser');
    const uid = currentUser?.id || (localUser ? JSON.parse(localUser || '{}')?.id : undefined);
    if (uid !== undefined && uid !== null && uid !== '') {
      saveQuery({currentCreateUser: uid});
    }
  }, [currentCreateUser, currentUser?.id]);

  const onFinish = async values => {
    const params = {
      ...record,
      ...values,
      project_id: values.project_id ? Number(values.project_id) : null,
      case_id: record.case_id || null,
      case_name: values.case_name || null,
    };
    if (record.id === 0) {
      dispatch({
        type: 'gconfig/insertConfig',
        payload: params,
      });
    } else {
      dispatch({
        type: 'gconfig/updateGConfig',
        payload: params,
      });
    }
  };

  const save = data => {
    dispatch({
      type: 'gconfig/save',
      payload: data,
    });
  };

  const saveQuery = (payload) => {
    save({
      ...payload,
      pagination: {
        ...pagination,
        current: 1,
      },
    });
  };

  return (
    <PageContainer title='全局变量' breadcrumb={null}>
      <Card>
        <FormForModal fields={fields} open={modal} left={4} right={20} onFinish={onFinish}
                      onCancel={() => {
                        save({modal: false});
                      }} title='编辑变量' record={record} width={600} offset={-60}/>
        <Row style={{marginBottom: 12}}>
          <Col span={24}>
            <Button type='primary'
                    onClick={() => {
                      save({modal: true});
                      setRecord({
                        id: 0,
                        key_type: 0,
                        type: 1,
                        enable: true,
                        env: currentEnv !== null ? currentEnv.toString() : currentEnv,
                        project_id: null,
                        case_id: null,
                        case_name: null,
                      })
                    }}><PlusOutlined/>添加变量</Button>
          </Col>
        </Row>
        <Row gutter={[8, 8]}>
          <Col span={4}>
            <Select allowClear placeholder="环境" value={currentEnv} style={{width: '100%'}}
                    onChange={e => {
                      saveQuery({currentEnv: e});
                    }}>
              {envList.map(v => <Option key={v.id} value={v.id.toString()}>{v.name}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Select allowClear placeholder="创建人" value={currentCreateUser} style={{width: '100%'}}
                    onChange={e => {
                      saveQuery({currentCreateUser: e});
                    }}>
              {userList.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Select allowClear placeholder='来源项目' value={currentProjectId} style={{width: '100%'}}
                    onChange={e => {
                      saveQuery({currentProjectId: e});
                    }}>
              {projectOptions.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Select allowClear placeholder='变量类型' value={currentVarType} style={{width: '100%'}}
                    onChange={e => {
                      saveQuery({currentVarType: e});
                    }}>
              <Option value={1}>全局变量</Option>
              <Option value={2}>接口变量</Option>
              <Option value={3}>特殊变量</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Input
              placeholder='请输入key'
              value={name}
              onChange={e => {
                saveQuery({name: e.target.value});
              }}
            />
          </Col>
          <Col span={4}>
            <Input placeholder='来源用例名称' value={currentCaseName} onChange={e => {
              saveQuery({currentCaseName: e.target.value});
            }}/>
          </Col>
        </Row>
        <Row style={{marginTop: 12}}>
          <Col span={24}>
            <Table dataSource={data} columns={columns} pagination={pagination} rowKey={record => record.id}
                   loading={loading.effects['gconfig/fetchGConfig']} onChange={pg => {
              save({pagination: pg});
            }}/>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default connect(({gconfig, user, loading}) => ({
  gconfig, user,
  loading,
}))(GConfig);
