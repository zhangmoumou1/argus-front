import dayjs from 'dayjs';
import { PageContainer } from '@ant-design/pro-components';
import { Col, DatePicker, Form, Input, Row, Select, Space, Table, Tag, Popconfirm, message } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { connect } from '@umijs/max';
import { useEffect } from 'react';
import reportConfig from '@/consts/reportConfig';
import UserLink from '@/components/Button/UserLink';
import { IconFont } from '@/components/Icon/IconFont';
import { PillButton, SectionCard, UiEmpty, actionSplit, uiPalette, uiStatusTag } from '@/pages/UITest/shared';
import { stopTestReport } from '@/services/report';

const { RangePicker } = DatePicker;
const { Option } = Select;
const statusFilters = [
  { label: '全部', value: undefined },
  { label: '运行中', value: 1 },
  { label: '停止', value: 2 },
  { label: '通过', value: 3 },
  { label: '不通过', value: 4 },
];

const ApiReportList = ({ user, report, loading, dispatch, project: projectModel, gconfig }) => {
  const [form] = Form.useForm();
  const { userMap } = user;
  const { reportData, pagination } = report;
  const { projects, projectsMap } = projectModel;
  const { envMap } = gconfig;

  useEffect(() => {
    dispatch({ type: 'user/fetchUserList' });
    dispatch({ type: 'project/listProject' });
    dispatch({ type: 'gconfig/fetchEnvList', payload: { page: 1, size: 1000, exactly: true } });
    fetchReport();
  }, [pagination.current]);

  const handleStopReport = async (record) => {
    const res = await stopTestReport({ id: record.id });
    if (res?.code !== 0) {
      message.error(res?.msg || '停止失败');
      return;
    }
    message.success('已停止该报告任务');
    fetchReport();
  };

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
      title: '项目',
      key: 'project',
      width: 180,
      render: (_, record) => {
        const pid = record.project_id;
        return projectsMap[pid] || <span style={{ color: '#cbd5e1' }}>-</span>;
      },
    },
    {
      title: '执行环境',
      key: 'env',
      width: 140,
      render: (_, record) => {
        const envId = Number(record.env || 0);
        return envId > 0 && envMap[envId]
          ? <Tag style={{ borderRadius: 999, border: 'none', background: '#eef2ff', color: '#4338ca' }}>{envMap[envId]}</Tag>
          : <span style={{ color: '#cbd5e1' }}>-</span>;
      },
    },
    {
      title: '来源',
      key: 'source',
      width: 360,
      render: (_, record) => (
        <div style={{ fontWeight: 500, color: '#334155' }}>
          <div>{`测试计划：${record.plan_name || '-'}`}</div>
        </div>
      ),
    },
    {
      title: '总数',
      key: 'total',
      width: 80,
      render: (_, record) => <Tag style={{ borderRadius: 999, border: 'none', background: '#eff6ff', color: '#1d4ed8' }}>{record.success_count + record.failed_count + record.skipped_count + record.error_count}</Tag>,
    },
    {
      title: '通过',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 80,
      render: (value) => <Tag color="success" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '不通过',
      dataIndex: 'failed_count',
      key: 'failed_count',
      width: 90,
      render: (value) => <Tag color="error" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '出错',
      dataIndex: 'error_count',
      key: 'error_count',
      width: 80,
      render: (value) => <Tag color="warning" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '跳过',
      dataIndex: 'skipped_count',
      key: 'skipped_count',
      width: 80,
      render: (value) => <Tag color="blue" style={{ borderRadius: 999, border: 'none' }}>{value}</Tag>,
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      width: 160,
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
      title: '开始时间',
      dataIndex: 'start_at',
      key: 'start_at',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
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
      width: 130,
      render: (_, record) => (
        <Space split={actionSplit}>
          <a href={`/#/run/api-report/${record.id}`}><Space size={4}><EyeOutlined /> 详情</Space></a>
          {Number(record.status) === 1 ? (
            <Popconfirm
              title="确认停止当前报告任务？"
              description="停止后当前执行会结束，报告状态会更新为停止。"
              okText="停止"
              cancelText="取消"
              onConfirm={() => handleStopReport(record)}
            >
              <a>停止</a>
            </Popconfirm>
          ) : null}
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
              <Row gutter={[12, 12]} align="middle">
                <Col xs={24} md={5}>
                  <Form.Item label="项目" name="project_id" style={{ marginBottom: 0 }}>
                    <Select placeholder="选择项目" style={{ width: '100%' }} allowClear showSearch>
                      {projects.map(item => <Option value={item.id} key={item.id}>{item.name}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={5}>
                  <Form.Item label="名称" name="source" style={{ marginBottom: 0 }}>
                    <Input placeholder="计划名称/用例名称模糊查询" style={{ width: '100%' }} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} md={4}>
                  <Form.Item label="状态" name="status" style={{ marginBottom: 0 }}>
                    <Select placeholder="选择状态" style={{ width: '100%' }} allowClear options={statusFilters} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    label="开始时间"
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
                <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
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

export default connect(({ report, user, loading, project, gconfig }) => ({
  report,
  loading,
  user,
  project,
  gconfig,
}))(ApiReportList);
