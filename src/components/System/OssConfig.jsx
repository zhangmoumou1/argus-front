import {Col, Form, Input, InputNumber, Row, Select, Switch} from "antd";
import CONFIG from "@/consts/config";

export default ({form}) => {
  return (
    <Row gutter={8}>
      <Col span={4}/>
      <Col span={16}>
        <Form form={form} {...CONFIG.LAYOUT}>
          <Form.Item label="类型" name="oss_type" rules={[{required: true, message: '请选择oss类型'}]}>
            <Select placeholder="请选择oss类型">
              <Select.Option value="aliyun">阿里云</Select.Option>
              <Select.Option value="cos">腾讯云</Select.Option>
              <Select.Option value="qiniu">七牛云</Select.Option>
              <Select.Option value="s3">S3兼容存储</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="access_id" name="access_key_id" rules={[{required: true, message: '请输入access_key_id'}]}>
            <Input placeholder="请输入access_key_id"/>
          </Form.Item>
          <Form.Item label="access_secret" name="access_key_secret" rules={[{required: true, message: '请输入access_secret'}]}>
            <Input placeholder="请输入access_secret"/>
          </Form.Item>
          <Form.Item label="bucket" name="bucket" rules={[{required: true, message: '请输入bucket'}]}>
            <Input placeholder="请输入bucket"/>
          </Form.Item>
          <Form.Item label="endpoint" name="endpoint">
            <Input placeholder="请输入endpoint, 可不填"/>
          </Form.Item>
          <Form.Item label="头像bucket" name="avatar_bucket">
            <Input placeholder="请输入头像bucket, 不填则复用bucket"/>
          </Form.Item>
          <Form.Item label="region" name="region">
            <Input placeholder="请输入region, 默认us-east-1"/>
          </Form.Item>
          <Form.Item label="SSL" name="use_ssl" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭"/>
          </Form.Item>
          <Form.Item label="Path Style" name="force_path_style" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭"/>
          </Form.Item>
          <Form.Item label="签名过期(s)" name="presign_expire">
            <InputNumber min={1} style={{width: '100%'}} placeholder="请输入预签名过期时间"/>
          </Form.Item>
        </Form>
      </Col>
      <Col span={4}/>
    </Row>

  )
}
