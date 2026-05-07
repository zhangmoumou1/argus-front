import {PageContainer} from '@ant-design/pro-components';
import {REQUEST_TYPE} from '@/components/Common/global';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu as AMenu,
  message,
  Modal,
  Result,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
} from 'antd';
import {connect, history} from '@umijs/max';
import React, {memo, useEffect, useState} from 'react';
import SplitPane from 'react-split-pane';
import './TestCaseDirectory.less';
import {
  CameraTwoTone,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  RobotOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import 'react-contexify/dist/ReactContexify.css';
import NoRecord from '@/components/NotFound/NoRecord';
import FormForModal from '@/components/PityForm/FormForModal';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';
import TestResult from '@/components/TestCase/TestResult';
import UserLink from '@/components/Button/UserLink';
import noResult from '@/assets/NoData.svg';
import UserSelect from '@/components/User/UserSelect';
import SearchTree from '@/components/Tree/SearchTree';
import ScrollCard from '@/components/Scrollbar/ScrollCard';
import emptyWork from '@/assets/emptyWork.svg';
import AddTestCaseComponent from '@/pages/ApiTest/AddTestCaseComponent';
import RecorderDrawer from '@/components/TestCase/recorder/RecorderDrawer';
import {Switch} from '@icon-park/react';
import common from "@/utils/common";
import {listApiEndpointVersions, listApiEndpoints, listApiServices} from '@/services/interfaceManage';
import {aiGenerateFlowPreview, aiGenerateFlowSave, copyTestCase, listTestcaseTree as fetchTestcaseDirectoryTree} from '@/services/testcase';

const {Option} = Select;

const TestCaseDirectory = ({testcase, gconfig, project, user, loading, dispatch}) => {
  const {projects, project_id} = project;
  const {envList} = gconfig;
  const {userList, userMap} = user;
  const {
    directory, currentDirectory, testcases,
    asserts,
    testData,
    preConstructor, outParameters,
    postConstructor, testResult, selectedRowKeys, pagination
  } = testcase;
  const [currentNode, setCurrentNode] = useState(null);
  const [rootModal, setRootModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [record, setRecord] = useState({});
  const [modalTitle, setModalTitle] = useState('新建目录');
  const [addCaseVisible, setAddCaseVisible] = useState(false);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [resultModal, setResultModal] = useState(false);
  const [name, setName] = useState('');
  const [moveModal, setMoveModal] = useState(false);
  const [copyModal, setCopyModal] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyDirectoryTree, setCopyDirectoryTree] = useState([]);
  const [copyForm] = Form.useForm();
  const [moveDirectoryModal, setMoveDirectoryModal] = useState(false);
  const [moveDirectoryRecord, setMoveDirectoryRecord] = useState({});
  const [recorderModal, setRecorderModal] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiServices, setAiServices] = useState([]);
  const [aiEndpoints, setAiEndpoints] = useState([]);
  const [aiVersions, setAiVersions] = useState({});
  const [aiPreview, setAiPreview] = useState(null);
  const [aiSelectedKeys, setAiSelectedKeys] = useState([]);
  const [aiForm] = Form.useForm();

  const [bodyType, setBodyType] = useState(0);
  const [formData, setFormData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [body, setBody] = useState('');

  const findDirectoryMeta = (nodes, targetKey, parentKey = null) => {
    for (const node of nodes) {
      if (node.key === targetKey) {
        return {node, parentKey};
      }
      if (node.children && node.children.length > 0) {
        const result = findDirectoryMeta(node.children, targetKey, node.key);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  const getDescendantKeys = (nodes, targetKey) => {
    const targetMeta = findDirectoryMeta(nodes, targetKey);
    if (!targetMeta || !targetMeta.node || !targetMeta.node.children) {
      return [];
    }
    const keys = [];
    const collect = (children = []) => {
      children.forEach((child) => {
        keys.push(child.key);
        collect(child.children || []);
      });
    };
    collect(targetMeta.node.children);
    return keys;
  };

  const buildParentOptions = (nodes, disabledSet = new Set()) => {
    return (nodes || []).map((item) => ({
      title: item.title,
      label: item.title,
      key: item.key,
      value: item.key,
      disabled: disabledSet.has(item.key),
      children: buildParentOptions(item.children || [], disabledSet),
    }));
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      saveCase({
        selectedRowKeys,
      });
    },
  };

  const execute = async (record, env) => {
    const result = await dispatch({
      type: 'testcase/executeTestcase',
      payload: {
        case_id: record.id,
        env,
      },
    });
    if (result) {
      setResultModal(true);
      setName(record.name);
    }
  };

  const onExecute = async (env) => {
    const res = await dispatch({
      type: 'testcase/executeSelectedCase',
      payload: {
        case_list: selectedRowKeys,
        env,
      },
    });
    if (auth.response(res)) {
      Modal.confirm({
        title: '用例正在后台执行, 去报告页面查看任务状态🔔',
        icon: <QuestionCircleOutlined/>,
        onOk() {
          history.push(`/#/record/list`);
        },
        onCancel() {
        },
      });
    }
  };

  const menu = (record) =>
    envList.length === 0 ? (
      <Card>
        <div>
          <Empty
            image={noResult}
            imageStyle={{height: 90, width: 90, margin: '0 auto'}}
            description={
              <p>
                还没有任何环境, 去<a href="/#/config/environment">添加一个</a>?
              </p>
            }
          />
        </div>
      </Card>
    ) : (
      <AMenu>
        {envList.map((item) => (
          <AMenu.Item key={item.id}>
            <a
              onClick={async () => {
                if (record) {
                  await execute(record, item.id);
                } else {
                  await onExecute(item.id);
                }
              }}
            >
              {item.name}
            </a>
          </AMenu.Item>
        ))}
      </AMenu>
    );

  const columns = [
    {
      title: '用例ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      // 自动省略多余数据
      ellipsis: true,
      fixed: 'left',
      width: '20%',
    },
    {
      title: '请求协议',
      dataIndex: 'request_type',
      key: 'request_type',
      width: 110,
      render: (request_type) => REQUEST_TYPE[request_type],
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority) => <Tag color={CONFIG.CASE_TAG[priority]}>{priority}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => <Badge {...CONFIG.CASE_BADGE[status]} />,
    },
    {
      title: '接口版本',
      dataIndex: 'api_version_no',
      key: 'api_version_no',
      width: 120,
      render: (value) => value || '-',
    },
    {
      title: '版本状态',
      dataIndex: 'api_pending_update',
      key: 'api_pending_update',
      width: 110,
      render: (value) => (Number(value) === 1 ? <Tag color="orange">待更新</Tag> : <Tag color="green">已同步</Tag>),
    },
    {
      title: '创建人',
      dataIndex: 'create_user',
      key: 'create_user',
      width: 160,
      ellipsis: true,
      render: (create_user) => <UserLink user={userMap[create_user]}/>,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
    },
    {
      title: '操作',
      dataIndex: 'ops',
      width: 130,
      key: 'ops',
      fixed: 'right',
      render: (_, record) => (
        <>
          <a
            onClick={(e) => {
              e.preventDefault();
              history.push(`/apiTest/testcase/${currentDirectory[0]}/${record.id}`);
            }}
          >
            详情
          </a>
          <Divider type="vertical"/>
          <Dropdown overlay={menu(record)}>
            <a
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              执行 <DownOutlined/>
            </a>
          </Dropdown>
        </>
      ),
    },
  ];

  const listProjects = () => {
    dispatch({
      type: 'project/listProject',
    });
  };

  const listTestcaseTree = () => {
    if (project_id) {
      dispatch({
        type: 'testcase/listTestcaseDirectory',
        payload: {project_id, move: true},
      });
    }
  };

  const listUsers = () => {
    dispatch({
      type: 'user/fetchUserList',
    });
  };

  const listEnv = () => {
    dispatch({
      type: 'gconfig/fetchEnvList',
    });
  };

  const listTestcase = async () => {
    const values = await form.getFieldsValue();
    if (currentDirectory.length > 0) {
      dispatch({
        type: 'testcase/listTestcase',
        payload: {
          directory_id: currentDirectory[0],
          name: values.name || '',
          create_user:
            values.create_user !== null && values.create_user !== undefined
              ? values.create_user
              : '',
        },
      });
    }
  };

  useEffect(() => {
    listProjects();
    listUsers();
    listEnv();
  }, []);

  useEffect(() => {
    listTestcaseTree();
  }, [project_id]);

  useEffect(() => {
    listTestcase();
  }, [currentDirectory]);

  const save = (data) => {
    dispatch({
      type: 'project/save',
      payload: data,
    });
    dispatch({
      type: 'testcase/save',
      payload: {currentDirectory: []},
    });
    // 把项目id写入localStorage
    localStorage.setItem('project_id', data.project_id);
  };

  const saveCase = (data) => {
    dispatch({
      type: 'testcase/save',
      payload: data,
    });
  };

  const onCreateDirectory = async (values) => {
    const params = {
      name: values.name,
      project_id,
    };
    let result;
    if (record.id) {
      const meta = findDirectoryMeta(directory, record.id);
      result = await dispatch({
        type: 'testcase/updateTestcaseDirectory',
        payload: {
          ...params,
          id: record.id,
          parent: meta?.parentKey ?? null,
          sort_index: meta?.node?.sort_index ?? 0,
        },
      });
    } else {
      result = await dispatch({
        type: 'testcase/insertTestcaseDirectory',
        payload: {
          ...params,
          parent: currentNode,
        },
      });
    }
    if (result) {
      setRootModal(false);
      saveCase({
        selectedRowKeys: [],
      });
      listTestcaseTree();
    }
  };

  const onMoveDirectory = async (values) => {
    const sortIndexValue =
      values.sort_index === undefined || values.sort_index === null || values.sort_index === ''
        ? 0
        : parseInt(values.sort_index, 10);
    if (Number.isNaN(sortIndexValue)) {
      message.error('排序号必须是数字');
      return;
    }
    const res = await dispatch({
      type: 'testcase/updateTestcaseDirectory',
      payload: {
        id: moveDirectoryRecord.id,
        name: moveDirectoryRecord.name,
        project_id,
        parent: values.parent ?? null,
        sort_index: sortIndexValue,
      },
    });
    if (res) {
      setMoveDirectoryModal(false);
      listTestcaseTree();
    }
  };

  const onMove = async (values) => {
    const res = await dispatch({
      type: 'testcase/moveTestCaseToDirectory',
      payload: {
        id_list: selectedRowKeys,
        directory_id: values.directory_id,
        project_id,
      },
    });
    if (res) {
      setMoveModal(false);
      saveCase({
        selectedRowKeys: [],
      });
      listTestcase();
    }
  };

  const loadCopyDirectoryTree = async (targetProjectId) => {
    if (!targetProjectId) {
      setCopyDirectoryTree([]);
      return;
    }
    const res = await fetchTestcaseDirectoryTree({project_id: targetProjectId, move: true});
    if (auth.response(res, true)) {
      setCopyDirectoryTree(res.data || []);
    }
  };

  const onCopyTestCase = async () => {
    if (selectedRowKeys.length === 0) {
      message.info('请先勾选需要复制的用例');
      return;
    }
    copyForm.resetFields();
    copyForm.setFieldsValue({project_id});
    setCopyModal(true);
    await loadCopyDirectoryTree(project_id);
  };

  const onCopy = async () => {
    const values = await copyForm.validateFields();
    setCopyLoading(true);
    try {
      const res = await copyTestCase({
        id_list: selectedRowKeys,
        project_id: values.project_id,
        directory_id: values.directory_id,
      });
      if (auth.response(res, true)) {
        setCopyModal(false);
        saveCase({selectedRowKeys: []});
        if (values.project_id === project_id) {
          listTestcase();
        }
      }
    } finally {
      setCopyLoading(false);
    }
  };

  const onDeleteDirectory = async (key) => {
    const res = await dispatch({
      type: 'testcase/deleteTestcaseDirectory',
      payload: {id: key},
    });
    if (res) {
      listTestcaseTree();
    }
  };

  const onDeleteTestcase = async () => {
    const res = await dispatch({
      type: 'testcase/deleteTestcase',
      payload: selectedRowKeys,
    });
    if (res) {
      listTestcase();
    }
  };

  const onMoveTestCase = () => {
    setMoveModal(true);
  };

  const handleItemClick = (key, node) => {
    if (key === 1) {
      // 新增目录
      setCurrentNode(node.key);
      setModalTitle('新增目录');
      setRecord({name: ''});
      setRootModal(true);
    } else if (key === 2) {
      const meta = findDirectoryMeta(directory, node.key);
      setRecord({
        name: meta?.node?.title || '',
        id: node.key,
      });
      setModalTitle('编辑目录');
      setRootModal(true);
    } else if (key === 4) {
      const meta = findDirectoryMeta(directory, node.key);
      setMoveDirectoryRecord({
        id: node.key,
        name: meta?.node?.title || '',
        parent: meta?.parentKey ?? null,
        sort_index: meta?.node?.sort_index ?? 0,
      });
      setMoveDirectoryModal(true);
    } else if (key === 3) {
      Modal.confirm({
        title: '你确定要删除这个目录吗?',
        icon: <ExclamationCircleOutlined/>,
        content: '删除后，目录下的case也将不再可见！！！',
        okText: '确定',
        okType: 'danger',
        cancelText: '点错了',
        onOk() {
          onDeleteDirectory(node.key);
        },
      });
    }
  };

  const disabledParentKeys = new Set(
    moveDirectoryRecord.id ? [moveDirectoryRecord.id, ...getDescendantKeys(directory, moveDirectoryRecord.id)] : [],
  );
  const parentTreeData = buildParentOptions(directory, disabledParentKeys);

  const fields = [
    {
      name: 'name',
      label: '目录名称',
      required: true,
      placeholder: '请输入目录名称, 不超过18个字符',
      type: 'input',
    },
  ];

  const moveDirectoryFields = [
    {
      name: 'parent',
      label: '父目录',
      required: false,
      type: 'select',
      component: (
        <TreeSelect
          treeData={parentTreeData}
          showSearch
          allowClear
          treeDefaultExpandAll
          placeholder="不选即根目录"
        />
      ),
    },
    {
      name: 'sort_index',
      label: '排序号',
      required: false,
      type: 'input',
      placeholder: '请输入排序号，默认0',
      component: <Input type="number" min={0} placeholder="请输入排序号，默认0"/>,
    },
  ];

  const moveFields = [
    {
      name: 'directory_id',
      label: '目标目录',
      required: true,
      placeholder: '请选择要移动到的目录',
      type: 'select',
      component: <TreeSelect treeData={directory} showSearch treeDefaultExpandAll/>,
    },
  ];

  const getProject = () => {
    if (projects.length === 0) {
      return 'loading...';
    }
    const filter_project = projects.filter((p) => p.id === project_id);
    if (filter_project.length === 0) {
      save({project_id: projects[0].id});
      return projects[0];
    }
    return filter_project[0];
  };

  const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
  };

  // menu
  const content = (node) => (
    <AMenu>
      <AMenu.Item key="1">
        <a
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(2, node);
          }}
        >
          <EditOutlined/> 编辑目录
        </a>
      </AMenu.Item>
      <AMenu.Item key="3">
        <a
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(4, node);
          }}
        >
          <ExportOutlined/> 移动目录
        </a>
      </AMenu.Item>
      <AMenu.Item key="2" danger>
        <a
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(3, node);
          }}
        >
          <DeleteOutlined/> 删除目录
        </a>
      </AMenu.Item>
    </AMenu>
  );

  const AddDirectory = (
    <Tooltip title="点击可新建根目录, 子目录需要在树上新建">
      <a
        className="directoryButton"
        onClick={() => {
          setRootModal(true);
          setRecord({name: ''});
          setModalTitle('新建根目录');
          setCurrentNode(null);
        }}
      >
        <PlusOutlined/>
      </a>
    </Tooltip>
  );

  const onAddTestCase = () => {
    if (!currentDirectory[0]) {
      message.info('请先创建或选择用例目录~');
      return;
    }
    setAddCaseVisible(true);
    dispatch({
      type: 'testcase/save',
      payload: {
        asserts: [],
        postConstructor: [],
        preConstructor: [],
        outParameters: [{key: 0, source: 1}],
        caseInfo: {},
        testData: {},
      },
    });
  };

  const openAiGenerate = async () => {
    if (!currentDirectory[0]) {
      message.info('请先创建或选择用例目录~');
      return;
    }
    setAiDrawerOpen(true);
    setAiPreview(null);
    setAiSelectedKeys([]);
    aiForm.resetFields();
    aiForm.setFieldsValue({
      generate_style: 'standard',
      include_negative: true,
      include_asserts: true,
      include_extractors: true,
    });
    const res = await listApiServices({project_id, keyword: ''});
    if (auth.response(res, false)) {
      setAiServices(res.data || []);
    }
  };

  const onAiServiceChange = async (serviceId) => {
    aiForm.setFieldsValue({endpoint_ids: []});
    setAiEndpoints([]);
    setAiVersions({});
    if (!serviceId) return;
    const res = await listApiEndpoints({service_id: serviceId, endpoint_status: 'available'});
    if (auth.response(res, false)) {
      setAiEndpoints(res.data?.list || []);
    }
  };

  const onAiEndpointChange = async (endpointIds = []) => {
    const nextVersions = {};
    await Promise.all((endpointIds || []).map(async (endpointId) => {
      const res = await listApiEndpointVersions({endpoint_id: endpointId});
      if (auth.response(res, false)) {
        nextVersions[endpointId] = res.data || [];
      }
    }));
    setAiVersions(nextVersions);
  };

  const onAiPreview = async () => {
    const values = await aiForm.validateFields();
    setAiLoading(true);
    try {
      const res = await aiGenerateFlowPreview({
        ...values,
        project_id,
        directory_id: currentDirectory[0],
      });
      if (auth.response(res, true)) {
        setAiPreview(res.data);
        setAiSelectedKeys((res.data?.cases || []).map((item) => item.key));
      }
    } finally {
      setAiLoading(false);
    }
  };

  const onAiSave = async () => {
    const cases = (aiPreview?.cases || []).filter((item) => aiSelectedKeys.includes(item.key));
    if (cases.length === 0) {
      message.info('请至少勾选一条 AI 生成用例');
      return;
    }
    setAiLoading(true);
    const res = await aiGenerateFlowSave({
      directory_id: currentDirectory[0],
      cases,
    });
    setAiLoading(false);
    if (auth.response(res, true)) {
      setAiDrawerOpen(false);
      setAiPreview(null);
      setAiSelectedKeys([]);
      await listTestcase();
    }
  };

  const aiPreviewColumns = [
    {
      title: '步骤',
      dataIndex: 'name',
      width: 220,
      render: (value, record) => (
        <div>
          <b>{value}</b>
          <div style={{color: '#667085', fontSize: 12}}>{record.reason}</div>
        </div>
      ),
    },
    {
      title: '请求',
      dataIndex: 'url',
      render: (value, record) => (
        <span>
          <Tag color="blue">{record.request_method}</Tag>
          {value}
        </span>
      ),
    },
    {
      title: '变量/断言',
      width: 180,
      render: (_, record) => (
        <div>
          <Tag color="green">断言{record.asserts?.length || 0}</Tag>
          <Tag color="cyan">出参{record.out_parameters?.length || 0}</Tag>
        </div>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 90,
      render: (value) => <Tag color={CONFIG.CASE_TAG[value] || 'blue'}>{value}</Tag>,
    },
  ];

  const AddCaseMenu = (
    <AMenu>
      <AMenu.Item key="1">
        <a
          onClick={() => {
            onAddTestCase();
          }}
        >
          <RocketOutlined/> 普通场景
        </a>
      </AMenu.Item>
      <AMenu.Item key="2">
        <a onClick={() => setRecorderModal(true)}>
          <CameraTwoTone/> 录制场景
          <Tag
            color="red"
            style={{
              fontSize: 12,
              margin: '0 4px',
              lineHeight: '12px',
              padding: 2,
            }}
          >
            新
          </Tag>
        </a>
      </AMenu.Item>
    </AMenu>
  );

  const filterOutParameters = () => {
    return outParameters.filter(v => {
      switch (v.source) {
        case 0:
        case 5:
          return v.name && v.expression && v.match_index
        case 1:
        case 2:
        case 3:
        case 6:
        case 7:
          return v.name && v.expression
        case 4:
          return v.name
        default:
          return false;
      }
    })
  }

  const onSubmit = async () => {
    const values = await addForm.validateFields()
    const params = {
      ...values,
      request_type: parseInt(values.request_type, 10),
      status: parseInt(values.status, 10),
      tag: values.tag ? values.tag.join(',') : null,
      directory_id: currentDirectory[0],
      body_type: bodyType,
      request_headers: common.translateHeaders(headers),
      body: bodyType === 2 ? JSON.stringify(formData) : body,
    };
    let tempData = []
    Object.values(testData).forEach(v => {
      tempData = tempData.concat(v)
    })
    const data = {
      "case": params,
      "asserts": asserts,
      "data": tempData,
      "constructor": [...preConstructor, ...postConstructor],
      "out_parameters": filterOutParameters(),
    }
    const res = await dispatch({
      type: 'testcase/createTestCase',
      payload: data
    })
    if (res) {
      setAddCaseVisible(false);
      await listTestcase()
    }
  }

  return (
    <PageContainer title={false} breadcrumb={null}>
      <TestResult
        width={1000}
        modal={resultModal}
        setModal={setResultModal}
        response={testResult}
        caseName={name}
        single={false}
      />
      <FormForModal
        title="移动用例"
        onCancel={() => setMoveModal(false)}
        fields={moveFields}
        onFinish={onMove}
        open={moveModal}
        left={6}
        right={18}
        width={500}
        formName="move"
      />
      <Modal
        title="复制用例"
        open={copyModal}
        confirmLoading={copyLoading}
        onOk={onCopy}
        onCancel={() => setCopyModal(false)}
        okText="复制"
        cancelText="取消"
        width={560}
      >
        <Form form={copyForm} layout="vertical">
          <Form.Item name="project_id" label="目标项目" rules={[{required: true, message: '请选择目标项目'}]}>
            <Select
              placeholder="请选择目标项目"
              onChange={async (value) => {
                copyForm.setFieldsValue({directory_id: undefined});
                await loadCopyDirectoryTree(value);
              }}
            >
              {projects.map((item) => (
                <Option key={item.id} value={item.id}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="directory_id" label="目标目录" rules={[{required: true, message: '请选择目标目录'}]}>
            <TreeSelect
              treeData={copyDirectoryTree}
              showSearch
              treeDefaultExpandAll
              placeholder="请选择复制到哪个目录"
              treeNodeFilterProp="title"
            />
          </Form.Item>
          <div style={{color: '#667085'}}>将复制当前已勾选的 {selectedRowKeys.length} 条接口用例，包含断言、测试数据、出参和前后置步骤。</div>
        </Form>
      </Modal>
      <FormForModal
        title="移动目录"
        onCancel={() => setMoveDirectoryModal(false)}
        fields={moveDirectoryFields}
        onFinish={onMoveDirectory}
        record={moveDirectoryRecord}
        open={moveDirectoryModal}
        left={6}
        right={18}
        width={500}
        formName="move-directory"
      />
      {projects.length === 0 ? (
        <Result
          status="404"
          subTitle={
            <span>
              你还没有添加任何项目, <a href="/#/project">添加项目</a>后才能编写Case
            </span>
          }
        />
      ) : (
        <Card
          style={{height: '100%', minHeight: 600}}
          bodyStyle={{padding: 0}}
          bordered={false}
        >
          <Row>
            <FormForModal
              title={modalTitle}
              onCancel={() => setRootModal(false)}
              fields={fields}
              onFinish={onCreateDirectory}
              record={record}
              open={rootModal}
              left={6}
              right={18}
              width={400}
              formName="root"
            />
            <Drawer
              bodyStyle={{padding: 0}}
              open={addCaseVisible}
              width={1300}
              title="添加场景用例"
              onClose={() => setAddCaseVisible(false)}
              maskClosable={false}
              footer={<div style={{float: 'right'}}>
                <Button type="primary" onClick={async () => {
                  await onSubmit()
                }}><SaveOutlined/> 提交</Button>
                <Button style={{marginLeft: 8}}><PlayCircleOutlined/> 测试</Button>
              </div>}
            >
              <AddTestCaseComponent
                directory_id={currentDirectory[0]}
                onSubmit={onSubmit}
                bodyType={bodyType}
                setBodyType={setBodyType}
                formData={formData}
                setFormData={setFormData}
                setAddCaseVisible={setAddCaseVisible}
                headers={headers}
                setHeaders={setHeaders}
                body={body}
                form={addForm}
                setBody={setBody}
              />
            </Drawer>
            <RecorderDrawer
              directory={directory}
              visible={recorderModal}
              setVisible={setRecorderModal}
            />
            <SplitPane
              className="pitySplit"
              split="vertical"
              minSize={260}
              defaultSize={300}
              maxSize={800}
            >
              <ScrollCard className="card" hideOverflowX={true}>
                <Row gutter={8}>
                  <Col span={24}>
                    <div style={{height: 40, lineHeight: '40px'}}>
                      {editing ? (
                        <Select
                          style={{marginLeft: 32, width: 150}}
                          showSearch
                          allowClear
                          placeholder="请选择项目"
                          value={project_id}
                          autoFocus={true}
                          onChange={(e) => {
                            if (e !== undefined) {
                              save({project_id: e});
                            }
                            setEditing(false);
                          }}
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {projects.map((v) => (
                            <Option key={v.id} value={v.id}>
                              {v.name}
                            </Option>
                          ))}
                        </Select>
                      ) : (
                        <div onClick={() => setEditing(true)}>
                          <img
                            src="/project.svg"
                            alt="project"
                            style={{
                              width: 30,
                              marginLeft: 8,
                              marginRight: 6,
                              display: 'inline-block',
                              objectFit: 'contain',
                              verticalAlign: 'middle',
                            }}
                          />
                          <span
                            style={{
                              display: 'inline-block',
                              marginLeft: 12,
                              fontWeight: 400,
                              fontSize: 14,
                            }}
                          >
                            {getProject().name}
                          </span>
                          <Switch
                            style={{marginLeft: 12, cursor: 'pointer', lineHeight: '40px'}}
                            theme="outline"
                            size="16"
                            fill="#7ed321"
                          />
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
                <div style={{marginTop: 24}}>
                  <Spin spinning={loading.effects['testcase/listTestcaseDirectory']}>
                    {directory.length > 0 ? (
                      <SearchTree
                        treeData={directory}
                        menu={content}
                        addDirectory={AddDirectory}
                        onSelect={(keys) => {
                          saveCase({
                            currentDirectory: keys[0] === currentDirectory[0] ? [] : keys,
                            selectedRowKeys: [],
                          });
                        }}
                        onAddNode={(node) => {
                          setCurrentNode(node.key);
                          handleItemClick(1, node);
                        }}
                        selectedKeys={currentDirectory}
                      />
                    ) : (
                      <NoRecord
                        height={180}
                        desc={
                          <span>
                            还没有目录，
                            <a
                              onClick={() => {
                                setRootModal(true);
                                setRecord({name: ''});
                                setModalTitle('新建根目录');
                                setCurrentNode(null);
                              }}
                            >
                              添加
                            </a>
                            一个吧~
                          </span>
                        }
                      />
                    )}
                  </Spin>
                </div>
              </ScrollCard>
              <ScrollCard className="card" hideOverflowX={true}>
                {currentDirectory.length > 0 ? (
                  <>
                    <Form form={form}>
                      <Row gutter={6}>
                        <Col span={8}>
                          <Form.Item label="用例名称" {...layout} name="name">
                            <Input placeholder="输入用例名称"/>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="创建人" {...layout} name="create_user">
                            <UserSelect users={userList} placeholder="请选择创建用户"/>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <div style={{float: 'right'}}>
                            <Button
                              type="primary"
                              onClick={async () => {
                                await listTestcase();
                              }}
                            >
                              <SearchOutlined/> 查询
                            </Button>
                            <Button
                              style={{marginLeft: 8}}
                              onClick={async () => {
                                form.resetFields();
                                await listTestcase();
                              }}
                            >
                              <ReloadOutlined/> 重置
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Form>
                    <Row gutter={8} style={{marginTop: 4}}>
                      <Col span={24}>
                        <Dropdown overlay={AddCaseMenu} trigger="click">
                          <Button type="primary">
                            <PlusOutlined/> 新建场景
                          </Button>
                        </Dropdown>
                        <Button
                          style={{marginLeft: 8}}
                          type="primary"
                          ghost
                          icon={<RobotOutlined/>}
                          onClick={openAiGenerate}
                        >
                          AI生成流程场景
                        </Button>
                        {selectedRowKeys.length > 0 ? (
                          <Dropdown overlay={menu()} trigger={['hover']}>
                            <Button
                              style={{marginLeft: 8}}
                              icon={<PlayCircleOutlined/>}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              执行用例 <DownOutlined/>
                            </Button>
                          </Dropdown>
                        ) : null}
                        {selectedRowKeys.length > 0 ? (
                          <Button
                            type="dashed"
                            style={{marginLeft: 8}}
                            icon={<ExportOutlined/>}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveTestCase();
                            }}
                          >
                            移动用例
                          </Button>
                        ) : null}
                        {selectedRowKeys.length > 0 ? (
                          <Button
                            type="dashed"
                            style={{marginLeft: 8}}
                            icon={<CopyOutlined/>}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyTestCase();
                            }}
                          >
                            复制用例
                          </Button>
                        ) : null}
                        {selectedRowKeys.length > 0 ? (
                          <Button
                            danger
                            style={{marginLeft: 8}}
                            icon={<DeleteOutlined/>}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTestcase();
                            }}
                          >
                            删除用例
                          </Button>
                        ) : null}
                      </Col>
                    </Row>
                    <Row style={{marginTop: 16}}>
                      <Col span={24}>
                        <Table
                          columns={columns}
                          rowKey={(record) => record.id}
                          rowSelection={rowSelection}
                          pagination={pagination}
                          bordered
                          onChange={(pg) => {
                            saveCase({pagination: {...pagination, current: pg.current}});
                          }}
                          dataSource={testcases}
                          scroll={{x: 1100}}
                          loading={
                            loading.effects['testcase/listTestcase'] ||
                            loading.effects['testcase/executeTestcase']
                          }
                        />
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Empty
                    image={emptyWork}
                    imageStyle={{height: 230}}
                    description="快选中左侧的目录畅享用例之旅吧~"
                  />
                )}
              </ScrollCard>
            </SplitPane>
          </Row>
        </Card>
      )}
      <Drawer
        width={1180}
        title="AI生成流程性接口场景"
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        maskClosable={false}
        footer={(
          <div style={{float: 'right'}}>
            <Button onClick={() => setAiDrawerOpen(false)}>取消</Button>
            <Button style={{marginLeft: 8}} loading={aiLoading} onClick={onAiPreview}>
              <RobotOutlined/> 生成预览
            </Button>
            <Button type="primary" style={{marginLeft: 8}} loading={aiLoading} onClick={onAiSave}>
              <SaveOutlined/> 保存选中
            </Button>
          </div>
        )}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Card title="生成配置" bordered={false} className="ai-flow-config-card">
              <Form form={aiForm} layout="vertical">
                <Form.Item name="service_id" label="接口服务" rules={[{required: true, message: '请选择接口服务'}]}>
                  <Select
                    showSearch
                    placeholder="选择服务"
                    options={aiServices.map((item) => ({label: item.name, value: item.id}))}
                    onChange={onAiServiceChange}
                  />
                </Form.Item>
                <Form.Item name="endpoint_ids" label="流程接口链路" rules={[{required: true, message: '请选择至少一个接口'}]}>
                  <Select
                    mode="multiple"
                    placeholder="按流程顺序选择接口"
                    optionFilterProp="label"
                    options={aiEndpoints.map((item) => ({
                      label: `${item.method} ${item.path} ${item.name}`,
                      value: item.id,
                    }))}
                    onChange={onAiEndpointChange}
                  />
                </Form.Item>
                {Object.keys(aiVersions).length > 0 ? (
                  <div className="ai-flow-version-tip">
                    已选择 {Object.keys(aiVersions).length} 个接口，默认使用各接口最新版本生成流程场景。
                  </div>
                ) : null}
                <Form.Item name="business_goal" label="业务目标/生成要求">
                  <Input.TextArea
                    rows={4}
                    placeholder="例如：生成用户登录后创建订单、查询订单、取消订单的完整流程，并覆盖参数异常。"
                  />
                </Form.Item>
                <Form.Item name="generate_style" label="生成风格">
                  <Select
                    options={[
                      {label: '标准覆盖', value: 'standard'},
                      {label: '主流程优先', value: 'happy_path'},
                      {label: '严格边界/异常', value: 'strict'},
                    ]}
                  />
                </Form.Item>
                <Form.Item name="include_negative" valuePropName="checked">
                  <Checkbox>包含异常/边界场景</Checkbox>
                </Form.Item>
                <Form.Item name="include_asserts" valuePropName="checked">
                  <Checkbox>自动生成断言</Checkbox>
                </Form.Item>
                <Form.Item name="include_extractors" valuePropName="checked">
                  <Checkbox>自动提取变量并在后续步骤引用</Checkbox>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col span={16}>
            <Card
              title={aiPreview?.scenario_name || '生成结果预览'}
              extra={aiPreview ? <Tag color="blue">{aiPreview.cases?.length || 0}条</Tag> : null}
              bordered={false}
              className="ai-flow-preview-card"
            >
              {aiPreview ? (
                <>
                  <div className="ai-flow-summary">{aiPreview.summary}</div>
                  {(aiPreview.warnings || []).map((item) => <Tag color="orange" key={item}>{item}</Tag>)}
                  <Table
                    style={{marginTop: 12}}
                    rowKey="key"
                    size="small"
                    columns={aiPreviewColumns}
                    dataSource={aiPreview.cases || []}
                    pagination={false}
                    rowSelection={{
                      selectedRowKeys: aiSelectedKeys,
                      onChange: setAiSelectedKeys,
                    }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <div className="ai-flow-case-detail">
                          <div><b>前后依赖：</b>{(record.pre_steps || []).join('；') || '无'}</div>
                          <pre>{JSON.stringify({
                            headers: record.request_headers,
                            body: record.body,
                            asserts: record.asserts,
                            out_parameters: record.out_parameters,
                          }, null, 2)}</pre>
                        </div>
                      ),
                    }}
                  />
                </>
              ) : (
                <Empty description="选择服务和接口链路后，点击生成预览" image={emptyWork} imageStyle={{height: 220}}/>
              )}
            </Card>
          </Col>
        </Row>
      </Drawer>
    </PageContainer>
  );
};

export default connect(({testcase, gconfig, project, user, loading}) => ({
  loading,
  gconfig,
  user,
  project,
  testcase,
}))(memo(TestCaseDirectory));




