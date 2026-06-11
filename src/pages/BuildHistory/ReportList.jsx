// 构建历史记录
import dayjs from 'dayjs';
import { PageContainer } from "@ant-design/pro-components";
import { Col, DatePicker, Form, message, Row, Select, Space, Table, Tag } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {connect} from "@umijs/max";
import {useEffect} from "react";
import reportConfig from "@/consts/reportConfig";
import UserLink from "@/components/Button/UserLink";
import {IconFont} from "@/components/Icon/IconFont";
import {REPORT_MODE} from "@/components/Common/global";
import { PillButton, SectionCard, UiEmpty, actionSplit, uiPalette, uiStatusTag } from '@/pages/UITest/shared';


const {RangePicker} = DatePicker;
const {Option} = Select;

const ReportList = ({user, report, loading, dispatch}) => {
  const [form] = Form.useForm()

  const {userMap} = user;
  const {reportData, pagination} = report;


  useEffect(() => {
    dispatch({
      type: 'user/fetchUserList',
    })
    fetchReport();
  }, [pagination.current])

  const columns = [
    {
      title: '构建id',
      dataIndex: 'id',
      key: 'id',
      render: (text, record) => {
        const pendingTag = record.pending_review ? <Tag color="red" style={{marginLeft: 8}}>变更</Tag> : null;
        const success = record.failed_count === 0 && record.error_count === 0 && record.success_count > 0;
        if (record.failed_count === 0 && record.error_count === 0 && record.success_count > 0) {
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {success ? <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 14 }} /> : <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 14 }} />}
                <a href={`/#/record/report/${record.id}`} style={{ fontWeight: 600 }}>
                  Run #{text}
                </a>
                {pendingTag}
              </div>
            </div>
          );
        }
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <CloseCircleTwoTone twoToneColor="#eb2f96" style={{ fontSize: 14 }} />
              <a href={`/#/record/report/${record.id}`} style={{ fontWeight: 600 }}>
                Run #{text}
              </a>
              {pendingTag}
            </div>
          </div>
        );
      }
    },
    {
      title: '类型',
      dataIndex: 'mode',
      key: 'mode',
      render: mode => REPORT_MODE[mode],
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      render: executor => executor === 0 ?
        <span>
          <IconFont style={{fontSize: 20}} type="icon-a-jiqirenrengongzhineng"/> argus机器人
        </span> : <UserLink user={userMap[executor]}/>,
    },
    {
      title: '总数',
      key: 'total',
      width: 90,
      render: (_, record) =>
        <Tag style={{ borderRadius: 999, border: 'none', background: '#eff6ff', color: '#1d4ed8' }}> {record.success_count + record.failed_count + record.skipped_count + record.error_count} </Tag>,
    },
    {
      title: '成功 ✔',
      dataIndex: 'success_count',
      key: 'success_count',
      render: successCount => <Tag color="success" style={{ borderRadius: 999, border: 'none' }}> {successCount} </Tag>,
    },
    {
      title: '失败 ❌',
      dataIndex: 'failed_count',
      key: 'failed_count',
      render: failedCount => <Tag color="error" style={{ borderRadius: 999, border: 'none' }}> {failedCount} </Tag>,
    },
    {
      title: '出错 ⚠',
      dataIndex: 'error_count',
      key: 'error_count',
      render: errorCount => <Tag color="warning" style={{ borderRadius: 999, border: 'none' }}> {errorCount} </Tag>,
    },
    {
      title: '跳过 🎉',
      dataIndex: 'skipped_count',
      key: 'skipped_count',
      render: skippedCount => <Tag color="blue" style={{ borderRadius: 999, border: 'none' }}> {skippedCount} </Tag>,
    },
    {
      title: '开始时间',
      key: 'start_at',
      dataIndex: 'start_at',
    },
    // {
    //   title: '结束时间',
    //   key: 'finish_at',
    //   dataIndex: 'finished_at',
    // },
    {
      title: '任务状态',
      dataIndex: 'status',
      key: 'status',
      render: status => status === 0 ? uiStatusTag('queued') : status === 1 ? uiStatusTag('running') : status === 2 ? uiStatusTag('cancelled') : status === 3 ? uiStatusTag('success') : reportConfig.STATUS[status],
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) => (
        <Space split={actionSplit}>
          <a href={`/#/record/report/${record.id}`}>查看</a>
        </Space>
      )
    }
  ]

  const fetchReport = async () => {
    try {
      const value = await form.validateFields();
      const [startDate, endDate] = value.date || [];
      if (!startDate || !endDate) {
        message.warning('请选择开始/结束时间');
        return;
      }
      const start_time = startDate.startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const end_time = endDate.endOf('day').format('YYYY-MM-DD HH:mm:ss');
      const { date, ...rest } = value;

      dispatch({
        type: 'report/fetchReportList',
        payload: {
          start_time,
          end_time,
          ...rest,
          page: pagination.current,
          size: pagination.pageSize,
        }
      })
    } catch (e) {
      message.warning('请选择开始/结束时间');
    }
  }

  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({date: [dayjs().startOf('week'), dayjs().endOf('week')]})
    fetchReport();
  }

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div style={{ padding: '8px 0 24px', background: uiPalette.page, minHeight: 'calc(100vh - 120px)' }}>
        <SectionCard>
          <Form form={form}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={6}>
              <Form.Item label="执行人" name="executor">
                <Select placeholder="选择执行人" style={{width: '100%'}} allowClear>
                  <Option value="argus机器人" key="CPU"><IconFont style={{fontSize: 20}}
                                                          type="icon-a-jiqirenrengongzhineng"/> argus机器人</Option>
                  {
                    Object.keys(userMap).map(v => (<Option key={v} value={v}><UserLink user={userMap[v]}/></Option>))
                  }
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="执行时间" name="date"
                         rules={[{required: true, message: '请选择开始/结束时间'}]}
                         initialValue={[dayjs().startOf('week'), dayjs().endOf('week')]}>
                <RangePicker
                  style={{ width: '100%', maxWidth: 420 }}
                  ranges={{
                    '今天': [dayjs(), dayjs()],
                    '本周': [dayjs().startOf('week'), dayjs().endOf('week')],
                    '本月': [dayjs().startOf('month'), dayjs().endOf('month')],
                  }}
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Space>
                <PillButton type="primary" onClick={fetchReport}><SearchOutlined/> 查询</PillButton>
                <PillButton onClick={onReset}><ReloadOutlined/> 重置</PillButton>
              </Space>
            </Col>
          </Row>

          </Form>
        </SectionCard>
        <SectionCard
          title="测试报告列表"
          description="接口测试构建结果与执行状态"
          extra={<span style={{ color: uiPalette.subtle, fontSize: 13 }}>共 {pagination.total || reportData.length} 条记录</span>}
        >
            <Table columns={columns} dataSource={reportData}
                   pagination={pagination}
                   loading={loading.effects['report/fetchReportList']}
                   locale={{emptyText: <UiEmpty description="当前还没有接口测试报告记录" />}}
                   onChange={pg => {
                     dispatch({
                       type: 'report/save',
                       payload: {pagination: {...pagination, current: pg.current}}
                     })
                   }}/>
        </SectionCard>
      </div>
    </PageContainer>
  )
}


export default connect(({report, user, loading}) => ({
  report,
  loading,
  user,
}))(ReportList)

