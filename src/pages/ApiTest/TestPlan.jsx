import {PageContainer} from "@ant-design/pro-components";
import {connect} from '@umijs/max';
import {Alert, Badge, Button, Card, Col, Form, Input, Popconfirm, Row, Select, Space, Switch, Table, Tag, Tooltip} from "antd";
import React, {useEffect} from "react";
import CONFIG from "@/consts/config";
import {DeleteOutlined, EditOutlined, PlayCircleOutlined, PlusOutlined, QuestionCircleOutlined, ReloadOutlined, SearchOutlined, ThunderboltOutlined} from "@ant-design/icons";
import TestPlanForm from "@/components/TestCase/TestPlanForm";
import UserLink from "@/components/Button/UserLink";
import UserSelect from "@/components/User/UserSelect";

const {Option} = Select;

const TestPlan = ({testplan, dispatch, loading, gconfig, user, project}) => {

  const {planData} = testplan;
  const {userList, userMap} = user;
  const {projectsMap, projects} = project;
  const {envMap} = gconfig;
  // form查询条件
  const [form] = Form.useForm();

  const onSave = data => {
    dispatch({
      type: 'testplan/save',
      payload: data
    })
  }

  const onEdit = record => {
    onSave({
      visible: true,
      currentStep: 0,
      title: `编辑测试计划: ${record.name}`,
      planRecord: {
        ...record,
        msg_type: record.msg_type === '' ? [] : record.msg_type.split(","),
        receiver: record.receiver === '' ? [] : record.receiver.split(",").map(v => parseInt(v, 10)),
        env: record.env === '' ? [] : record.env.split(",").map(v => parseInt(v, 10)),
        case_list: record.case_list === '' ? [] : record.case_list.split(",").map(v => `testcase_${v}`),
      },

    })
  }
  const fetchTestPlan = () => {
    const values = form.getFieldsValue();
    dispatch({
      type: 'testplan/listTestPlan',
      payload: {
        page: 1,
        size: 10,
        ...values,
      }
    })
  }

  const onDelete = async id => {
    const res = await dispatch({
      type: 'testplan/deleteTestPlan',
      payload: {id}
    })
    if (res) {
      fetchTestPlan();
    }
  }

  const onFollowTestPlan = (id, value) => {
    const type = value ? 'testplan/followTestPlan' : 'testplan/unFollowTestPlan';
    dispatch({
      type,
      payload: {
        id,
      }
    })
  }

  const onSwitchTestPlan = async (id, value) => {
    const res = await dispatch({
      type: 'testplan/switchTestPlan',
      payload: {id, status: value},
    });
    if (res) {
      fetchTestPlan();
    }
  }

  // 执行测试计划
  const onExecute = async id => {
    const res = await dispatch({
      type: 'testplan/executeTestPlan',
      payload: {id}
    })
    // if (res) {
    //   Modal.confirm({
    //     title: '🎉 测试计划执行完成',
    //     content: '是否跳转到报告页面?',
    //     onOk() {
    //       history.push("/record/list")
    //     },
    //   })
    // }
  }

  const columns = [
    {
      title: '项目',
      key: 'project_id',
      dataIndex: 'project_id',
      render: projectId => <span>{projectsMap[projectId] || 'loading'}</span>
    },
    {
      title: '计划名称',
      key: 'name',
      dataIndex: 'name',
      render: (name, record) => <span>{name}{record.pending_review ? <Tag color="red" style={{marginLeft: 8}}>变更</Tag> : null}</span>,
    },
    {
      title: '执行环境',
      key: 'env',
      dataIndex: 'env',
      render: (value) => (value || '').split(',').filter(Boolean).map(id => envMap[Number(id)] || `环境#${id}`).join(', '),
    },
    {
      title: '顺序执行',
      key: 'ordered',
      dataIndex: 'ordered',
      render: bool => bool ? <Tag color="blue">是</Tag> : <Tag>否</Tag>
    },
    {
      title: '用例数量',
      key: 'case_list',
      dataIndex: 'case_list',
      render: caseList => caseList.split(",").length,
    },
    {
      title: <span>
          是否开启 <Tooltip title="关闭后该计划不会按定时触发"><QuestionCircleOutlined/></Tooltip>
        </span>,
      key: 'enabled',
      dataIndex: 'enabled',
      render: (enabled, record) => <Switch checked={!!enabled} onChange={value => {
        onSwitchTestPlan(record.id, value)
      }}/>
    },
    {
      title: '调度',
      key: 'cron',
      dataIndex: 'cron',
      render: (value, record) => {
        if (!value) {
          return <span style={{ color: '#cbd5e1' }}>手动执行</span>;
        }
        const state = record.state;
        if (state === 2) {
          return (
            <Tooltip title="定时任务可能添加失败, 请尝试重新添加">
              <Space size={4}>
                <Badge status="error" />
                <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
                  {value}
                </Tag>
              </Space>
            </Tooltip>
          );
        }
        if (state === 3) {
          return (
            <Tooltip title="任务已暂停">
              <Space size={4}>
                <Badge status="warning" />
                <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
                  {value}
                </Tag>
              </Space>
            </Tooltip>
          );
        }
        if (state === 1 && record.next_run) {
          return (
            <Tooltip title={`下次运行时间: ${record.next_run}`}>
              <Space size={4}>
                <Badge status="success" />
                <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
                  {value}
                </Tag>
              </Space>
            </Tooltip>
          );
        }
        return (
          <Tag icon={<ThunderboltOutlined />} color="purple" style={{ borderRadius: 999, border: 'none' }}>
            {value}
          </Tag>
        );
      },
    },
    {
      title: <span>
          是否关注 <Tooltip title="点击可关注项目数据"><QuestionCircleOutlined/></Tooltip>
        </span>,
      key: 'follow',
      dataIndex: 'follow',
      render: (follow, record) => <Switch defaultChecked={follow} onChange={value => {
        onFollowTestPlan(record.id, value)
      }}/>
    },
    {
      title: '创建人',
      key: 'create_user',
      dataIndex: 'create_user',
      render: create_user => <UserLink user={userMap[create_user]}/>
    },
    {
      title: '操作',
      key: 'ops',
      render: (_, record) => (
        <Space split={<span style={{ color: '#e2e8f0' }}>|</span>}>
          <a onClick={() => onEdit(record)}>
            <Space size={4}><EditOutlined /> 编辑</Space>
          </a>
          <a onClick={async () => await onExecute(record.id)} style={{ color: '#10b981' }}>
            <Space size={4}><PlayCircleOutlined /> 执行</Space>
          </a>
          <Popconfirm title="确认删除该计划？" onConfirm={async () => await onDelete(record.id)} okText="确认" cancelText="取消">
            <a style={{ color: '#ef4444' }}>
              <Space size={4}><DeleteOutlined /></Space>
            </a>
          </Popconfirm>
        </Space>
      ),
    },


  ]


  const spin = loading.effects['testplan/listTestPlan'] || loading.effects['project/listProject'] || loading.effects['testplan/executeTestPlan']


  const fetchProjectList = () => {
    dispatch({
      type: 'project/listProject',
    })
  }

  const fetchUsers = () => {
    if (userList.length === 0) {
      dispatch({
        type: 'user/fetchUserList',
      })
    }
  }

  const fetchEnvList = () => {
    dispatch({
      type: 'gconfig/fetchEnvList',
      payload: {
        page: 1,
        size: 1000,
        exactly: true // 全部获取
      }
    })
  }


  useEffect(() => {
    fetchEnvList()
    fetchUsers()
    fetchProjectList()
    fetchTestPlan()
  }, [])

  return (
    <>
      <PageContainer title={false} breadcrumb={null}>
        <Alert message="执行测试计划前，记得修改测试计划接收人, 这样就能收到邮件通知啦😈~"
               style={{marginBottom: 16}} type="info" banner closable/>
        <div style={{ borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.22)', boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)', background: '#fff', padding: 16, marginBottom: 16 }}>
          <TestPlanForm fetchTestPlan={fetchTestPlan}/>
          <Form form={form}>
            <Row gutter={[12, 12]} align="middle">
              <Col span={5}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, whiteSpace: 'nowrap', color: '#0f172a' }}>项目：</span>
                  <Form.Item name="project_id" style={{ marginBottom: 0, flex: 1 }}>
                    <Select allowClear showSearch placeholder="选择项目">
                      {projects.map(item => <Option value={item.id} key={item.id}>{item.name}</Option>)}
                    </Select>
                  </Form.Item>
                </div>
              </Col>
              <Col span={5}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, whiteSpace: 'nowrap', color: '#0f172a' }}>名称：</span>
                  <Form.Item name="name" style={{ marginBottom: 0, flex: 1 }}>
                    <Input placeholder="输入测试计划名称"/>
                  </Form.Item>
                </div>
              </Col>
              <Col span={5}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, whiteSpace: 'nowrap', color: '#0f172a' }}>创建人：</span>
                  <Form.Item name="create_user" style={{ marginBottom: 0, flex: 1 }}>
                    <UserSelect users={userList}/>
                  </Form.Item>
                </div>
              </Col>
              <Col span={5}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={fetchTestPlan}>查询</Button>
                  <Button icon={<ReloadOutlined />} onClick={() => {
                    form.resetFields();
                    fetchTestPlan();
                  }}>重置</Button>
                </Space>
              </Col>
              <Col span={4} />
            </Row>
          </Form>
        </div>
        <Card style={{ borderRadius: 8 }}>
          <Row style={{marginBottom: 12}}>
            <Button type="primary" onClick={() => {
              onSave({visible: true, title: '新增测试计划', planRecord: {enabled: true}, currentStep: 0,})
            }}><PlusOutlined/> 添加计划</Button>
          </Row>
          <Table columns={columns} dataSource={planData} rowKey={row => row.id} loading={spin}/>
        </Card>
      </PageContainer>
    </>
  )
}


export default connect(({testplan, project, user, loading, gconfig}) => ({
  testplan,
  project,
  loading,
  user,
  gconfig,
}))(TestPlan);
