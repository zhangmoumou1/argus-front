import React, {memo, useEffect, useState} from 'react';
import {PageContainer} from "@ant-design/pro-components";
import {connect} from "@umijs/max";
import {Button, Card, Col, Divider, Form, Input, Row, Select, Table, Tag} from "antd";
import CONFIG from "@/consts/config";
import TooltipTextIcon from "@/components/Icon/TooltipTextIcon";
import {PlusOutlined} from "@ant-design/icons";
import FormForModal from "@/components/PityForm/FormForModal";
import PityPopConfirm from "@/components/Confirm/PityPopConfirm";

const {Option} = Select;

const Address = ({loading, gconfig, dispatch}) => {

  const [form] = Form.useForm();
  const {envList, envMap, addressList} = gconfig;
  const [modal, setModal] = useState(false);
  const [item, setItem] = useState({});

  const fetchEnvList = () => {
    dispatch({
      type: 'gconfig/fetchEnvList',
      payload: {
        page: 1,
        size: 1000,
        exactly: true
      }
    })
  }

  const fetchAddress = () => {
    const values = form.getFieldsValue()
    dispatch({
      type: 'gconfig/fetchAddress',
      payload: values,
    })
  }

  const isLoading = loading.effects['gconfig/fetchAddress'] || loading.effects['gconfig/fetchEnvList'] || loading.effects['gconfig/updateAddress']
    || loading.effects['gconfig/insertAddress'] || loading.effects['gconfig/deleteAddress']

  useEffect(() => {
    fetchEnvList()
    fetchAddress()
  }, []);

  const columns = [
    {
      title: '环境',
      key: 'env',
      dataIndex: 'env',
      render: env => <Tag>{envMap[env]}</Tag>,
    },
    {
      title: '名称',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: <TooltipTextIcon title="地址一般是服务的基础地址，比如https://api.baidu.com, 用例中的地址简写即可" text="地址"/>,
      key: 'gateway',
      dataIndex: 'gateway',
      render: text => <a href={text}>{text}</a>,
      ellipsis: true
    },
    {
      title: <TooltipTextIcon title="页面地址支持两种写法：1. 相对路径，例如 /portal，会拼接在服务地址后；2. 完整地址，例如 https://demo.xxx.com，会直接作为页面前缀使用" text="页面地址"/>,
      key: 'page_url',
      dataIndex: 'page_url',
      render: text => text || '-',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) =>
        <>
          <a onClick={() => {
            setItem(record)
            setModal(true)
          }}>编辑</a>
          <Divider type="vertical"/>
          <PityPopConfirm text="删除" title="你确定要删除这个地址吗?" onConfirm={async () => {
            await onDelete(record)
          }}/>
        </>

    }
  ]

  const fields = [
    {
      name: 'env',
      label: '环境',
      required: true,
      message: '请选择对应环境',
      type: 'select',
      component: <Select placeholder="请选择对应环境">
        {envList.map(v => <Option key={v.id} value={v.id}>{v.name}</Option>)}
      </Select>,
    },
    {
      name: 'name',
      label: '地址名称',
      required: true,
      message: '请输入地址名称',
      type: 'input',
      placeholder: '请输入地址名称',
    },
    {
      name: 'gateway',
      label: '服务地址',
      required: true,
      message: '请输入服务地址',
      type: 'input',
      placeholder: '请输入服务地址',
    },
    {
      name: 'page_url',
      label: '页面地址',
      type: 'input',
      placeholder: '例如 /portal 或 https://demo.xxx.com',
    },
  ];

  // 删除地址
  const onDelete = async record => {
    const ans = await dispatch({
      type: 'gconfig/deleteAddress',
      payload: {
        id: record.id,
      }
    })
    if (ans) {
      fetchAddress()
    }
  }

  // 新增/修改地址
  const onSubmit = async values => {
    let ans;
    if (item.id) {
      ans = await dispatch({
        type: 'gconfig/updateAddress',
        payload: {
          ...values,
          id: item.id,
        }
      })
    } else {
      ans = await dispatch({
        type: 'gconfig/insertAddress',
        payload: values
      })
    }
    if (ans) {
      setModal(false)
      fetchAddress()
    }

  }


  return (
    <PageContainer breadcrumb={null} title={false}>
      <Card>
        <FormForModal open={modal} fields={fields} title={item.id ? "修改地址": "添加地址"} left={6} right={18} record={item}
                      onFinish={onSubmit} onCancel={() => setModal(false)}/>
        <Form form={form} {...CONFIG.LAYOUT} onValuesChange={fetchAddress}>
          <Row gutter={12}>
            <Col span={4}>
              <Form.Item>
                <Button type="primary" onClick={() => {
                  setModal(true)
                  setItem({})
                }}><PlusOutlined/>添加地址</Button>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="环境" name="env">
                <Select allowClear showSearch placeholder="选择对应的环境">
                  {envList.map(item => <Option value={item.id} key={item.id}>{item.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="名称" name="name">
                <Input placeholder="输入对应的地址名称"/>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="地址" name="gateway">
                <Input placeholder="输入对应的地址"/>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="页面地址" name="page_url">
                <Input placeholder="例如 /portal 或 https://demo.xxx.com"/>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Table columns={columns} loading={isLoading} rowKey={record => record.id} dataSource={addressList}/>
      </Card>
    </PageContainer>
  )
}

export default connect(({gconfig, user, loading}) => ({gconfig, user, loading}))(memo(Address));
