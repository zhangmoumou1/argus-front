import dayjs from 'dayjs';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, DatePicker, Form, Row, Select, Table, Tag } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { connect } from '@umijs/max';
import { useEffect } from 'react';
import reportConfig from '@/consts/reportConfig';
import UserLink from '@/components/Button/UserLink';
import { IconFont } from '@/components/Icon/IconFont';
import { REPORT_MODE } from '@/components/Common/global';

const { RangePicker } = DatePicker;
const { Option } = Select;

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
      fixed: 'left',
      render: (text, record) => {
        const ok = record.failed_count === 0 && record.error_count === 0 && record.success_count > 0;
        return (
          <span>
            {ok ? <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 13 }} /> : <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 13 }} />}
            {' '}
            #
            <a href={`/#/run/api-report/${record.id}`}>{text}</a>
          </span>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode) => REPORT_MODE[mode],
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      render: (executor) =>
        executor === 0 ? (
          <span>
            <IconFont style={{ fontSize: 20 }} type="icon-a-jiqirenrengongzhineng" /> argus机器人
          </span>
        ) : (
          <UserLink user={userMap[executor]} />
        ),
    },
    {
      title: '总数',
      key: 'total',
      render: (_, record) => <Tag>{record.success_count + record.failed_count + record.skipped_count + record.error_count}</Tag>,
    },
    {
      title: '成功',
      dataIndex: 'success_count',
      key: 'success_count',
      render: (value) => <Tag color="success">{value}</Tag>,
    },
    {
      title: '失败',
      dataIndex: 'failed_count',
      key: 'failed_count',
      render: (value) => <Tag color="error">{value}</Tag>,
    },
    {
      title: '出错',
      dataIndex: 'error_count',
      key: 'error_count',
      render: (value) => <Tag color="warning">{value}</Tag>,
    },
    {
      title: '跳过',
      dataIndex: 'skipped_count',
      key: 'skipped_count',
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'start_at',
      key: 'start_at',
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => reportConfig.STATUS[status],
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) => <a href={`/#/run/api-report/${record.id}`}>查看</a>,
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
    <PageContainer title="接口报告" breadcrumb={null}>
      <Card>
        <Form form={form}>
          <Row gutter={[8, 8]}>
            <Col span={8}>
              <Form.Item label="执行人" name="executor">
                <Select placeholder="选择执行人" style={{ width: '90%' }} allowClear>
                  <Option value="argus机器人" key="CPU">
                    <IconFont style={{ fontSize: 20 }} type="icon-a-jiqirenrengongzhineng" /> argus机器人
                  </Option>
                  {Object.keys(userMap).map((v) => (
                    <Option key={v} value={v}>
                      <UserLink user={userMap[v]} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label="执行时间"
                name="date"
                rules={[{ required: true, message: '请选择开始/结束时间' }]}
                initialValue={[dayjs().startOf('week'), dayjs().endOf('week')]}
              >
                <RangePicker
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
            <Col span={6}>
              <div style={{ float: 'right' }}>
                <Button type="primary" onClick={fetchReport}><SearchOutlined /> 查询</Button>
                <Button style={{ marginLeft: 8 }} onClick={onReset}><ReloadOutlined /> 重置</Button>
              </div>
            </Col>
          </Row>
        </Form>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reportData}
          pagination={pagination}
          loading={loading.effects['report/fetchReportList']}
          onChange={(pg) => {
            dispatch({
              type: 'report/save',
              payload: { pagination: { ...pagination, current: pg.current } },
            });
          }}
        />
      </Card>
    </PageContainer>
  );
};

export default connect(({ report, user, loading }) => ({
  report,
  loading,
  user,
}))(ApiReportList);
