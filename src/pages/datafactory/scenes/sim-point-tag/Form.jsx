import {Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tooltip, Upload, message} from 'antd';
import {DownloadOutlined, MinusOutlined, PlusOutlined, QuestionCircleOutlined, UploadOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import React, {useMemo, useState} from 'react';
import ActionBar from '@/pages/datafactory/TaskRunner/components/ActionBar';

const {RangePicker} = DatePicker;

const featureOptions = [
  {label: '模型标签（区域数据中台-新天山测试环境）', value: 'model_tag'},
  {label: '盒子点位（区域数据中台-新天山测试环境）', value: 'box_point'},
];

const sendModeOptions = [
  {label: '直发kafka', value: 'kafka'},
  {label: '模拟API', value: 'api'},
];

const valueTypeOptions = [
  {label: '固定值', value: 'fixed'},
  {label: '递增', value: 'incr'},
  {label: '随机', value: 'random'},
];

const valueOptions = [
  {label: '1（在线）', value: '1'},
  {label: '0（离线）', value: '0'},
];

const defaultRows = [
  {id: 1, tag: 'IoStatus（盒子状态）', valueType: 'fixed', value: '1'},
  {id: 2, tag: '', valueType: 'incr', value: ''},
  {id: 3, tag: '', valueType: 'fixed', value: ''},
];

export default function SimPointTagForm({loading, onRun, onReset}) {
  const [form] = Form.useForm();
  const [rows, setRows] = useState(defaultRows);
  const [frequency, setFrequency] = useState(2);
  const [importVisible, setImportVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const initialRange = useMemo(() => [dayjs(), dayjs().add(5, 'hour')], []);

  const updateRow = (id, field, fieldValue) => {
    setRows((prev) => prev.map((item) => (item.id === id ? {...item, [field]: fieldValue} : item)));
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((item) => item.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {id: Date.now(), tag: '', valueType: 'fixed', value: ''},
    ]);
  };

  const resetNow = () => {
    form.setFieldValue('timeRange', [dayjs(), dayjs().add(5, 'hour')]);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    onRun({
      ...values,
      frequency,
      rows,
      timeRange: values.timeRange.map((v) => v.format('YYYY-MM-DD HH:mm:ss')),
    });
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      feature: 'model_tag',
      sendMode: 'kafka',
      timeRange: [dayjs(), dayjs().add(5, 'hour')],
    });
    setFrequency(2);
    setRows(defaultRows);
    onReset();
  };

  const handleDownloadTemplate = () => {
    const content = '点位/标签,值类型,值\nZN_PV1,固定值,100\nZN_TEMP2,递增,20\nZN_RANDOM3,随机,';
    const blob = new Blob([`\uFEFF${content}`], {type: 'text/csv;charset=utf-8;'});
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '点位标签导入模板.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      message.warning('请先选择导入文件');
      return;
    }
    setImporting(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    setImporting(false);
    setImportVisible(false);
    message.success('导入成功（模拟）');
  };

  const columns = [
    {
      title: '点位/标签',
      dataIndex: 'tag',
      key: 'tag',
      render: (_, record) => (
        <Input
          value={record.tag}
          placeholder="请输入点位/标签"
          onChange={(e) => updateRow(record.id, 'tag', e.target.value)}
        />
      ),
    },
    {
      title: '值类型',
      dataIndex: 'valueType',
      key: 'valueType',
      width: 140,
      render: (_, record) => (
        <Select
          value={record.valueType}
          options={valueTypeOptions}
          onChange={(v) => updateRow(record.id, 'valueType', v)}
        />
      ),
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      width: 170,
      render: (_, record) => (
        <Select
          value={record.value}
          options={valueOptions}
          placeholder="选择值"
          onChange={(v) => updateRow(record.id, 'value', v)}
        />
      ),
    },
    {
      title: '操作',
      key: 'ops',
      width: 90,
      render: (_, record) => (
        <Button danger size="small" onClick={() => removeRow(record.id)}>删除</Button>
      ),
    },
  ];

  return (
    <div className="sim-point-tag-form">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          feature: 'model_tag',
          sendMode: 'kafka',
          topic: '',
          timeRange: initialRange,
        }}
      >
        <Form.Item
          label={<span>产品功能 <Tooltip title="场景功能分类"><QuestionCircleOutlined/></Tooltip></span>}
          name="feature"
          rules={[{required: true, message: '请选择产品功能'}]}
        >
          <Select options={featureOptions}/>
        </Form.Item>

        <Form.Item
          label="发送方式"
          name="sendMode"
          rules={[{required: true, message: '请选择发送方式'}]}
        >
          <Select options={sendModeOptions}/>
        </Form.Item>

        <Form.Item
          label="Topic"
          name="topic"
          rules={[{required: true, message: '请输入Topic'}]}
        >
          <Input placeholder="请输入Topic，盒子点位-填写来源topic，模型标签-填写目标topic"/>
        </Form.Item>

        <div className="sim-range-row">
          <Form.Item
            className="sim-range-item"
            label="时间范围"
            name="timeRange"
            rules={[{required: true, message: '请选择时间范围'}]}
          >
            <RangePicker showTime style={{width: '100%'}}/>
          </Form.Item>
          <Button className="sim-range-reset-btn" onClick={resetNow}>重置为当前时间</Button>
        </div>

        <Form.Item label="发送频率">
          <Space>
            <Button icon={<MinusOutlined/>} onClick={() => setFrequency((v) => Math.max(1, v - 1))}/>
            <InputNumber min={1} value={frequency} onChange={(v) => setFrequency(v || 1)}/>
            <Button icon={<PlusOutlined/>} onClick={() => setFrequency((v) => v + 1)}/>
            <span>秒</span>
          </Space>
        </Form.Item>

        <div style={{marginBottom: 8, fontWeight: 600}}>点位/标签配置</div>
        <Space style={{marginBottom: 10}}>
          <Button type="primary" onClick={addRow}>添加</Button>
          <Button type="primary" ghost onClick={() => setImportVisible(true)}>批量导入</Button>
        </Space>
        <div className="sim-tag-table-wrap">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={rows}
          />
        </div>
      </Form>

      <ActionBar
        loading={loading}
        onExecute={handleSubmit}
        onReset={handleReset}
        onHelp={() => window.alert('说明：当前为模拟表单，后续将接入真实接口。')}
        onHistory={() => window.alert('执行记录：后续接入接口后开放。')}
      />

      <Modal
        open={importVisible}
        title="批量导入点位/标签"
        width={760}
        footer={null}
        destroyOnClose
        onCancel={() => {
          setImportVisible(false);
          setSelectedFile(null);
        }}
      >
        <div className="sim-import-modal-content">
          <div className="sim-import-title">导入说明：</div>
          <ul className="sim-import-list">
            <li>支持格式：Excel (.xlsx) 或 CSV (.csv)</li>
            <li>表头必须包含三列（顺序不限）：点位/标签、值类型、值</li>
            <li>值类型支持：固定值 / Fixed、递增 / Increasing、随机 / Random</li>
          </ul>

          <Button
            type="link"
            icon={<DownloadOutlined />}
            className="sim-import-template-link"
            onClick={handleDownloadTemplate}
          >
            下载导入模板
          </Button>

          <div className="sim-import-actions">
            <Upload
              accept=".csv,.xlsx"
              maxCount={1}
              showUploadList={{showRemoveIcon: true}}
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false;
              }}
              onRemove={() => {
                setSelectedFile(null);
              }}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <Button type="primary" className="sim-import-submit-btn" loading={importing} onClick={handleImport}>
              导入
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
