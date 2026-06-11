import dayjs from 'dayjs';
import { PageContainer } from '@ant-design/pro-components';
import { Col, DatePicker, Form, Row, Select, Space, Table, Tag } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { connect } from '@umijs/max';
import { useEffect } from 'react';
import reportConfig from '@/consts/reportConfig';
import UserLink from '@/components/Button/UserLink';
import { IconFont } from '@/components/Icon/IconFont';
import { PillButton, SectionCard, UiEmpty, actionSplit, uiPalette, uiStatusTag } from '@/pages/UITest/shared';

const { RangePicker } = DatePicker;
const { Option } = Select;
const statusFilters = [
  { label: '全部', value: undefined },
  { label: '运行中', value: 1 },
  { label: '停止', value: 2 },
  { label: '测试成功', value: 3 },
  { label: '测试失败', value: 4 },
];

const ApiReportList = ({ user, report, loading, dispatch }) => {
  const [form] = Form.useForm();
  const { userMap } = user;
  const { reportData, pagination } = report;

  useEffect(() => {
    dispatch({ type: 'user/fetchUserList' });
    fetchReport();
  }, [pagination.current]);

  const columns = [
    {
      title: '报告ID',
      dataIndex: 'id',
      key: 'id',
      width: 136,
      render: (text, record) => {
        const ok = record.failed_count === 0 && record.error_count === 0 && record.success_count > 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {ok ? <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 14 }} /> : <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 14 }} />}
            <a href={`/#/run/api-report/${record.id}`} style={{ fontWeight: 600 }}>{text}</a>
          </div>
        );
      },
    },
    {
      title: '来源',
      key: 'source',
      width: 420,
      render: (_, record) => (
        <div style={{ fontWeight: 500, color: '#334155' }}>
          <div>{`测试计划：${record.plan_name || '-'}`}</div>
        </div>
      ),
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      render: (executor) =>
        executor === 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, lineHeight: '24px' }}>
            <IconFont style={{ fontSize: 20, marginRight: 6 }} type="icon-a-jiqirenrengongzhineng" /> 机器人
          </span>
        ) : (
          <UserLink user={userMap[executor]} />
        ),
    },
    {
      title: '总数',
      key: 'total',
      render: (_, record) => <Tag style={{ borderRadius: 999, border: 'none', background: '#eff6ff', color: '#1d4ed8' }}>{record.success_count + record.failed_count + record.skipped_count + record.error_count}</Tag>,
    },
    {
      title: '测试成功',
      dataIndex: 'success_count',
      key: 'success_count',
      render: (value) => <Tag color="success" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '测试失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      render: (value) => <Tag color="error" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '出错',
      dataIndex: 'error_count',
      key: 'error_count',
      render: (value) => <Tag color="warning" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '跳过',
      dataIndex: 'skipped_count',
      key: 'skipped_count',
      render: (value) => <Tag color="blue" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'start_at',
      key: 'start_at',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        if (status === 1) return uiStatusTag('running');
        if (status === 2) return uiStatusTag('cancelled');
        if (status === 3) {
          const isFailed = Number(record.failed_count || 0) > 0 || Number(record.error_count || 0) > 0;
          return uiStatusTag(isFailed ? 'ui_test_failed' : 'ui_test_success');
        }
        return reportConfig.STATUS[status];
      },
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) => (
        <Space split={actionSplit}>
          <a href={`/#/run/api-report/${record.id}`}>查看</a>
        </Space>
      ),
    },
  ];

  const fetchReport = async () => {
    const value = await form.validateFields();
    const [startDate, endDate] = value.date || [];
    if (!startDate || !endDate) return;
    const start = startDate.startOf('day');
    const end = endDate.endOf('day');
    const start_time = start.format('YYYY-MM-DD HH:mm:ss');
    const end_time = end.format('YYYY-MM-DD HH:mm:ss');
    const { date, ...rest } = value;
    dispatch({
      type: 'report/fetchReportList',
      payload: {
        ...rest,
        start_time,
        end_time,
        page: pagination.current,
        size: pagination.pageSize,
      },
    });
  };

  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({ date: [dayjs().startOf('week'), dayjs().endOf('week')] });
    fetchReport();
  };

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div style={{ padding: '8px 0 24px', background: uiPalette.page, minHeight: 'calc(100vh - 120px)' }}>
        <SectionCard>
          <div style={{ paddingTop: 12 }}>
            <Form form={form}>
              <Row gutter={[12, 12]} align="bottom">
                <Col xs={24} md={3}>
                <Form.Item label="执行人" name="executor" style={{ marginBottom: 0 }}>
                  <Select placeholder="选择执行人" style={{ width: '100%' }} allowClear>
                    <Option value="argus机器人" key="CPU">
                      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, lineHeight: '24px' }}>
                        <IconFont style={{ fontSize: 20, marginRight: 6 }} type="icon-a-jiqirenrengongzhineng" /> 机器人
                      </span>
                    </Option>
                    {Object.keys(userMap).map((v) => (
                      <Option key={v} value={v}>
                        <UserLink user={userMap[v]} />
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={5}>
                <Form.Item label="状态" name="status" style={{ marginBottom: 0 }}>
                  <Select placeholder="选择状态" style={{ width: '100%' }} allowClear options={statusFilters} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="执行时间"
                  name="date"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: '请选择开始/结束时间' }]}
                  initialValue={[dayjs().startOf('week'), dayjs().endOf('week')]}
                >
                  <RangePicker
                    style={{ width: '100%', maxWidth: 520 }}
                    ranges={{
                      今天: [dayjs(), dayjs()],
                      本周: [dayjs().startOf('week'), dayjs().endOf('week')],
                      本月: [dayjs().startOf('month'), dayjs().endOf('month')],
                    }}
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Space>
                  <PillButton type="primary" onClick={fetchReport}><SearchOutlined /> 查询</PillButton>
                  <PillButton onClick={onReset}><ReloadOutlined /> 重置</PillButton>
                </Space>
              </Col>
            </Row>
          </Form>
          </div>
        </SectionCard>
        <SectionCard
          title="测试报告"
          extra={<span style={{ color: uiPalette.subtle, fontSize: 13 }}>共 {pagination.total || reportData.length} 条记录</span>}
        >
          <Table
          rowKey="id"
          columns={columns}
          dataSource={reportData}
          pagination={pagination}
          loading={loading.effects['report/fetchReportList']}
          locale={{ emptyText: <UiEmpty description="当前还没有接口测试报告记录" /> }}
          onChange={(pg) => {
            dispatch({
              type: 'report/save',
              payload: { pagination: { ...pagination, current: pg.current } },
            });
          }}
        />
        </SectionCard>
      </div>
    </PageContainer>
  );
};

export default connect(({ report, user, loading }) => ({
  report,
  loading,
  user,
}))(ApiReportList);
