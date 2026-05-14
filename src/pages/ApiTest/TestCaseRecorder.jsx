import { PageContainer } from "@ant-design/pro-components";
import {
  AndroidOutlined,
  AppleOutlined,
  DownOutlined,
  LaptopOutlined,
  StopOutlined,
  ToolOutlined,
  VideoCameraOutlined,
  WindowsOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  notification,
  Select,
  Space,
  Tag,
  TreeSelect,
  Typography
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { connect, useModel } from "@umijs/max";
import RequestInfoList from "@/components/TestCase/recorder/RequestInfoList";
import CONFIG from "@/consts/config";
import { CameraOne } from "@icon-park/react";

const { Option } = Select;
const MAX_RECORD_DURATION_MS = 2 * 60 * 60 * 1000;

const TestCaseRecorder = ({ dispatch, project, recorder, testcase, loading }) => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const {
    recordStatus,
    recordLists,
    regex
  } = recorder;

  const { projects } = project;
  const { directory } = testcase;

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [url, setUrl] = useState(regex);
  const [visible, setVisible] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [form] = Form.useForm();

  const rowSelection = {
    selectedRowKeys,
    onChange: keys => {
      setSelectedRowKeys(keys)
    }
  };

  const selectedRequests = useMemo(() => selectedRowKeys.map(key => ({
    request_headers: JSON.parse(recordLists[key].request_headers),
    response_headers: JSON.parse(recordLists[key].response_headers),
    cookies: JSON.parse(recordLists[key].cookies),
    request_cookies: JSON.parse(recordLists[key].request_cookies),
    response_content: recordLists[key].response_content,
    request_method: recordLists[key].request_method,
    url: recordLists[key].url,
    body: recordLists[key].body,
    status_code: recordLists[key].status_code,
    created_at: recordLists[key].created_at,
  })), [recordLists, selectedRowKeys]);

  const listTestcaseTree = () => {
    if (projectId) {
      dispatch({
        type: 'testcase/listTestcaseDirectory',
        payload: { project_id: projectId, move: true }
      })
    }
  }

  useEffect(() => {
    dispatch({
      type: 'recorder/queryRecordStatus',
    })
  }, [])

  useEffect(() => {
    setUrl(regex)
  }, [regex])

  useEffect(() => {
    dispatch({
      type: 'project/listProject',
    })
  }, [])

  useEffect(() => {
    if (!recordStatus || !currentUser?.id) {
      return undefined
    }
    const ws = new WebSocket(`${CONFIG.WS_URL}/ws/${currentUser.id}`)
    ws.onmessage = function (event) {
      event.preventDefault()
      const msg = JSON.parse(event.data)
      if (msg.type === 2) {
        dispatch({
          type: 'recorder/readRecord',
          payload: {
            data: JSON.parse(msg.record_msg),
          }
        })
      }
    }
    ws.onerror = function () {
      notification.warning({
        message: '录制实时连接异常',
        description: '当前录制 websocket 连接中断，请停止后重新开始录制。',
      })
    }
    return () => {
      try {
        ws.close()
      } catch (e) {
      }
    }
  }, [currentUser?.id, dispatch, recordStatus])

  useEffect(() => {
    if (!recordStatus) {
      return undefined
    }
    const timer = window.setTimeout(async () => {
      await dispatch({
        type: 'recorder/stopRecord',
      })
      notification.warning({
        message: '录制已自动停止',
        description: '单次录制最长支持 2 小时，已自动停止以释放连接和录制资源。',
      })
    }, MAX_RECORD_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [dispatch, recordStatus])

  useEffect(() => {
    setProjectId(null)
    listTestcaseTree()
  }, [projectId])

  const startRecord = () => {
    if (!url) {
      notification.error({
        message: '建议填写过滤url，否则数据会较多'
      })
      return;
    }
    dispatch({
      type: 'recorder/startRecord',
      payload: {
        regex: url
      }
    })
  }

  const stopRecord = () => {
    dispatch({
      type: 'recorder/stopRecord',
    })
  }

  const onBatchDelete = async () => {
    Modal.confirm({
      title: `确认删除选中的 ${selectedRowKeys.length} 条录制接口吗？`,
      content: '删除后无法恢复，如果其中有需要保留的录制数据，建议先取消勾选。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await dispatch({
          type: 'recorder/removeBatch',
          payload: selectedRowKeys,
        })
        setSelectedRowKeys([])
      }
    })
  }

  const onGenerateCase = async () => {
    const values = await form.validateFields()
    const res = await dispatch({
      type: 'recorder/generateCase',
      payload: {
        directory_id: values.directory_id,
        name: values.name,
        requests: selectedRequests
      }
    })
    if (res) {
      setVisible(false)
      setSelectedRowKeys([])
      if ((res.data?.count || 0) > 1) {
        notification.success({
          message: "用例生成成功",
          description: `已按“${values.name}_编号”生成 ${res.data.count} 条接口用例，请前往对应目录查看。`
        })
      } else {
        notification.success({
          message: "用例生成成功",
          description: <span>点击<a
            href={`/#/apiTest/testcase/${res.data.directory_id}/${res.data.id}`}>链接</a>可跳转至测试用例</span>
        })
      }
    }
  }

  const getDownloadUrl = (cert) => {
    return `${CONFIG.URL}/request/cert?cert=${cert}`
  }

  const menu = <Menu>
    <Menu.Item key="windows"><WindowsOutlined />
      <a href={getDownloadUrl(0)}> Windows</a>
    </Menu.Item>
    <Menu.Item key="linux"><LaptopOutlined />
      <a href={getDownloadUrl(1)}> Linux</a>
    </Menu.Item>
    <Menu.Item key="macos"><AppleOutlined />
      <a href={getDownloadUrl(2)}> Mac OS</a>
    </Menu.Item>
    <Menu.Item key="ios"><AppleOutlined />
      <a href={getDownloadUrl(3)}> IOS</a>
    </Menu.Item>
    <Menu.Item key="android"><AndroidOutlined />
      <a href={getDownloadUrl(4)}> Android</a>
    </Menu.Item>
  </Menu>

  return (
    <PageContainer breadcrumb={null} title={false}>
      <Card>
        <Modal title={<span>生成用例 - 已选中{selectedRowKeys.length}条数据</span>} open={visible}
          onOk={onGenerateCase}
          onCancel={() => setVisible(false)}>
          <Form form={form} {...CONFIG.LAYOUT}>
            <Form.Item label="项目">
              <Select placeholder="请选择项目" onChange={e => {
                setProjectId(e)
              }}>
                {projects.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="用例目录" name="directory_id" rules={[{ required: true, message: '请选择用例目录' }]}>
              <TreeSelect placeholder="先选择项目，然后选择你要生成的用例目录" treeLine treeData={directory} />
            </Form.Item>
            <Form.Item label="用例名称" name="name" rules={[{ required: true, message: '请输入用例名称' }]}>
              <Input placeholder="请输入用例名称" />
            </Form.Item>
          </Form>
        </Modal>
        <div className="recorder-page-toolbar">
          <div className="recorder-page-toolbar__left">
            <Space wrap size={[12, 12]}>
              <Dropdown overlay={menu}>
                <a onClick={e => e.preventDefault()}>
                  下载证书 <DownOutlined />
                </a>
              </Dropdown>
              <Input
                placeholder="请输入要匹配的url(正则表达式)"
                value={url}
                onChange={e => {
                  setUrl(e.target.value)
                }}
                style={{ width: 420 }}
              />
              <Typography.Text type="secondary">
                过滤条件会在开始录制后生效
              </Typography.Text>
            </Space>
          </div>
          <div className="recorder-page-toolbar__right">
            <Space wrap size={[8, 12]} style={{ justifyContent: 'flex-end' }}>
              <Tag color={recordStatus ? 'green' : 'default'}>
                {recordStatus ? '录制中' : '未录制'}
              </Tag>
              <Button onClick={onBatchDelete} disabled={selectedRowKeys.length === 0} danger>
                批量删除
              </Button>
              <Button onClick={() => setVisible(true)} disabled={selectedRowKeys.length === 0}>
                <ToolOutlined />生成用例
              </Button>
              {recordStatus ? (
                <Button onClick={stopRecord} danger>
                  <StopOutlined />停止录制
                </Button>
              ) : (
                <Button type="primary" onClick={startRecord} loading={recordStatus}>
                  <VideoCameraOutlined />{recordLists.length === 0 ? '开始录制' : '重新录制'}
                </Button>
              )}
            </Space>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <RequestInfoList rowSelection={rowSelection} rowKey="index"
            emptyText="点击录制按钮即可开始录制app/web的接口请求"
            dataSource={recordLists} dispatch={dispatch}
            recordStatus={recordStatus}
            loading={loading.effects['recorder/queryRecordStatus']} />
        </div>
      </Card>
      <style>{`
        .recorder-page-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          padding: 14px 16px;
          border-radius: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          border: 1px solid #eef4ff;
        }
        .recorder-page-toolbar__left,
        .recorder-page-toolbar__right {
          display: flex;
          align-items: center;
          flex: 1 1 420px;
          min-width: 280px;
        }
        .recorder-page-toolbar__right {
          justify-content: flex-end;
        }
        @media (max-width: 1280px) {
          .recorder-page-toolbar__right {
            justify-content: flex-start;
          }
        }
      `}</style>
    </PageContainer>)
}

export default connect(({ loading, recorder, project, testcase, global }) => ({
  global,
  recorder,
  testcase,
  project,
  loading
}))(TestCaseRecorder);
