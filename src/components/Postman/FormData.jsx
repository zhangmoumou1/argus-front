import React from 'react';
import { Button, Input, Select, Space, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import CONFIG from '@/consts/config';

const { Option } = Select;

const normalizeRows = (rows = []) => (
  Array.isArray(rows)
    ? rows.map((item, index) => ({
      id: item?.id || `${Date.now()}_${index}`,
      key: item?.key || '',
      type: item?.type || 'FILE',
      value: item?.value || '',
    }))
    : []
);

const bucketFiles = (ossFileList = []) => (
  (ossFileList || []).filter((item) => !item?.is_dir && item?.file_path)
);

export default function FormData({ ossFileList = [], dataSource = [], setDataSource }) {
  const rows = normalizeRows(dataSource);
  const files = bucketFiles(ossFileList);

  const updateRows = (nextRows) => {
    setDataSource(nextRows.map((item) => ({
      key: item.key,
      type: item.type,
      value: item.value,
      id: item.id,
    })));
  };

  const updateRow = (rowId, patch) => {
    updateRows(rows.map((item) => (item.id === rowId ? { ...item, ...patch } : item)));
  };

  const addRow = () => {
    updateRows([
      ...rows,
      {
        id: `${Date.now()}_${rows.length}`,
        key: '',
        type: 'FILE',
        value: '',
      },
    ]);
  };

  const removeRow = (rowId) => {
    updateRows(rows.filter((item) => item.id !== rowId));
  };

  const columns = [
    {
      title: 'KEY',
      dataIndex: 'key',
      render: (_, record) => (
        <Input
          value={record.key}
          placeholder="file"
          onChange={(e) => updateRow(record.id, { key: e.target.value })}
        />
      ),
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      width: 140,
      render: (_, record) => (
        <Select
          value={record.type}
          style={{ width: '100%' }}
          onChange={(value) => updateRow(record.id, { type: value, value: '' })}
        >
          <Option value="FILE">FILE</Option>
          <Option value="TEXT">TEXT</Option>
        </Select>
      ),
    },
    {
      title: 'VALUE',
      dataIndex: 'value',
      render: (_, record) => (
        record.type === 'FILE' ? (
          <Select
            showSearch
            value={record.value || undefined}
            placeholder="选择 public bucket 文件"
            style={{ width: '100%' }}
            optionFilterProp="children"
            onChange={(value) => updateRow(record.id, { value })}
          >
            {files.map((item) => (
              <Option key={item.file_path} value={item.file_path}>
                {item.file_path}
              </Option>
            ))}
          </Select>
        ) : (
          <Input
            value={record.value}
            placeholder="文本值"
            onChange={(e) => updateRow(record.id, { value: e.target.value })}
          />
        )
      ),
    },
    {
      title: '预览',
      dataIndex: 'preview',
      width: 120,
      render: (_, record) => (
        record.type === 'FILE' && record.value ? (
          <a
            href={`${CONFIG.URL}/oss/download?filepath=${encodeURIComponent(record.value)}`}
            target="_blank"
            rel="noreferrer"
          >
            下载
          </a>
        ) : '-'
      ),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 90,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRow(record.id)}
        />
      ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<PlusOutlined />} onClick={addRow}>添加字段</Button>
      </Space>
      <Table
        rowKey="id"
        pagination={false}
        dataSource={rows}
        columns={columns}
      />
    </div>
  );
}
