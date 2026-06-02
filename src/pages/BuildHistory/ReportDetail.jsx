import {connect, useParams} from "@umijs/max";
import {Badge, Card, Col, Descriptions, Divider, Input, Row, Spin, Statistic, Table, Tabs, Tag} from "antd";
import {PageContainer} from "@ant-design/pro-components";
import React, {useEffect, useState} from "react";
import {queryReport} from "@/services/report";
import auth from "@/utils/auth";
import styles from './ReportDetail.less';
import './ReportDetail.less';
import {
  AlertTwoTone,
  CheckCircleOutlined,
  CheckCircleTwoTone,
  CloseCircleOutlined,
  CloseCircleTwoTone,
  FrownTwoTone,
  LikeTwoTone,
  MinusCircleOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {IconFont} from "@/components/Icon/IconFont";
import reportConfig from "@/consts/reportConfig";
import common from "@/utils/common";
import Pie from "@/components/Charts/Pie";
import NoRecord from "@/components/NotFound/NoRecord";
import TestResult from "@/components/TestCase/TestResult";
import UserLink from "@/components/Button/UserLink";

const {TabPane} = Tabs;

const ReportDetail = ({dispatch, loading, user, gconfig}) => {
  const params = useParams();
  const reportId = params.id;
  const [reportDetail, setReportDetail] = useState({});
  const [planName, setPlanName] = useState('');
  const [caseModal, setCaseModal] = useState(false);
  const [response, setResponse] = useState({});
  const [caseName, setCaseName] = useState('');
  const [caseList, setCaseList] = useState([]);
  const [currentCaseList, setCurrentCaseList] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const {envMap, envList} = gconfig;
  const {userMap, userNameMap} = user;
  const successCount = Number(reportDetail.success_count || 0);
  const failedCount = Number(reportDetail.failed_count || 0);
  const errorCount = Number(reportDetail.error_count || 0);
  const skippedCount = Number(reportDetail.skipped_count || 0);
  const totalCount = successCount + failedCount + errorCount + skippedCount;

  const getTag = () => {
    if (failedCount === 0 && errorCount === 0 && successCount > 0) {
      return <span className={styles.statusBadge} data-status="pass"><CheckCircleOutlined/> 通过</span>
    }
    return <span className={styles.statusBadge} data-status="fail"><CloseCircleOutlined/> 未通过</span>
  }

  const fetchEnv = () => {
    if (envList.length === 0) {
      dispatch({
        type: 'gconfig/fetchEnvList',
      })
    }
  }

  const fetchUsers = () => {
    dispatch({
      type: 'user/fetchUserList',
    })
  }

  const getPieData = () => {
    if (totalCount <= 0) {
      return [];
    }
    return [
      {name: '成功', count: successCount},
      {name: '失败', count: failedCount},
      {name: '错误', count: errorCount},
      {name: '跳过', count: skippedCount},
    ]
  }

  const getReport = record => {
    return {
      case_id: record.case_id,
      url: record.url,
      request_method: record.request_method,
      request_data: record.body,
      request_headers: record.request_headers,
      response: record.response,
      logs: record.case_log,
      response_headers: record.response_headers,
      status_code: record.status_code,
      cookies: record.cookies,
      asserts: record.asserts,
      cost: record.cost,
      status: record.status === 0,
    }
  }

  const getRetryData = record => {
    return {
      case_id: record.case_id,
      url: record.url,
      request_method: record.request_method,
      request_data: record.request_data,
      request_headers: record.request_headers,
      response: record.response,
      logs: record.logs,
      response_headers: record.response_headers,
      status_code: record.status_code,
      cookies: record.cookies,
      asserts: record.asserts,
      cost: record.cost,
      status: record.status,
    }
  }

  const onSearchCase = e => {
    const {value} = e.target;
    const temp = caseList.filter(item => item.data_name.indexOf(value) > -1 || item.case_name.indexOf(value) > -1);
    setCurrentCaseList(temp)
  }

  const load = !!(loading.effects['testcase/retryCase'] || reportLoading)

  const getReportResponse = async () => {
    setReportLoading(true);
    try {
      const res = await queryReport({id: reportId})
      if (auth.response(res)) {
        setCaseList(res.data.case_list);
        setCurrentCaseList(res.data.case_list);
        setReportDetail(res.data.report);
        setPlanName(res.data.plan_name);
      }
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    fetchEnv();
    fetchUsers();
    getReportResponse();
  }, [])

  const onHandleRetry = async record => {
    const retryResult = await dispatch({
      type: 'testcase/retryCase',
      payload: {
        env: reportDetail.env,
        case_id: record.case_id,
        data_id: record.data_id || 0,
      }
    })
    setCaseModal(true)
    setCaseName(record.case_name)
    setResponse(retryResult)
  }

  const columns = [
    {
      title: '用例id',
      dataIndex: 'case_id',
      key: 'case_id',
    },
    {
      title: '用例名称',
      dataIndex: 'case_name',
      key: 'case_name',
      render: (text, record) => <span><a href={`/#/apiTest/testcase/${record.directory_id}/${record.case_id}`}>{text}</a>{record.api_pending_update ? <Tag color="red" style={{marginLeft: 8}}>变更</Tag> : null}</span>
    },
    {
      title: '数据描述',
      dataIndex: 'data_name',
      key: 'data_name',
    },
    {
      title: '尝试次数',
      dataIndex: 'retry',
      key: 'retry',
    },
    {
      title: '执行状态',
      dataIndex: 'status',
      key: 'status',
      render: status => <Badge status={reportConfig.EXECUTE_BADGE_STATUS[status]}
                               text={reportConfig.EXECUTE_STATUS[status]}/>
    },
    {
      title: '请求方式',
      dataIndex: 'request_method',
      key: 'method',
      render: method => reportConfig.METHOD_TAG[method]
    },
    {
      title: '开始时间',
      dataIndex: 'start_at',
      key: 'start_at',
    },
    {
      title: '结束时间',
      dataIndex: 'finished_at',
      key: 'finished_at',
    },
    {
      title: '操作',
      key: 'operation',
      render: (_, record) => <>
        <a onClick={() => {
          setResponse(getReport(record))
          setCaseModal(true)
          setCaseName(record.case_name)
        }}>日志</a>
        <Divider type="vertical"/>
        <a onClick={async () => {
          await onHandleRetry(record)
        }}>重试</a>
      </>
    }
  ]

  return (
    <PageContainer title={false} breadcrumb={null} className={styles.reportDetailPage}>
      <TestResult width={1000} setModal={setCaseModal} modal={caseModal} caseName={caseName} response={response}/>
      <Spin spinning={load}>
        <Card className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.headerTitle}>
              测试报告 #{reportId}
              {getTag()}
            </span>
          </div>
          <div className={styles.summaryBody}>
            <Row gutter={[12, 12]}>
              <Col span={16}>
                <Row gutter={[10, 10]} className={styles.statRow}>
                  <Col span={8}>
                    <Card className={`${styles.statisticCard} ${styles.statTotal}`}>
                      <Statistic title="用例总数" value={totalCount}
                                 prefix={<IconFont type="icon-yongliliebiao"/>}/>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className={`${styles.statisticCard} ${styles.statSuccess}`}>
                      <Statistic title="成功" value={successCount}
                                 prefix={<CheckCircleTwoTone twoToneColor='#22c55e'/>}/>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className={`${styles.statisticCard} ${styles.statFailed}`}>
                      <Statistic title="失败" value={failedCount}
                                 prefix={<CloseCircleTwoTone twoToneColor='#ef4444'/>}/>
                    </Card>
                  </Col>
                </Row>
                <Row gutter={[10, 10]} className={styles.statRow}>
                  <Col span={8}>
                    <Card className={`${styles.statisticCard} ${styles.statError}`}>
                      <Statistic title="错误" value={errorCount}
                                 prefix={<AlertTwoTone twoToneColor="#f59e0b"/>}/>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className={`${styles.statisticCard} ${styles.statSkipped}`}>
                      <Statistic title="跳过" value={skippedCount}
                             prefix={<MinusCircleOutlined style={{color: '#8b5cf6'}}/>}/>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card className={`${styles.statisticCard} ${styles.statRate}`}>
                      <Statistic title="通过率" suffix="%"
                                 value={common.calPercent(successCount, failedCount + successCount + errorCount)}
                                 prefix={common.calPercent(successCount, failedCount + successCount + errorCount) > 90
                                   ? <LikeTwoTone/> : <FrownTwoTone/>}/>
                    </Card>
                  </Col>
                </Row>
                <Descriptions className={styles.reportDescriptions} column={2} size="small">
                  <Descriptions.Item label="测试环境">
                    <Tag icon={<IconFont type="icon-huanjing"/>}>{envMap[reportDetail.env]}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="执行人">
                    {reportDetail.executor === 0 ? 'pity机器人' : <UserLink user={userMap[reportDetail.executor]} size={16}/>}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行方式">
                    {reportConfig.EXECUTE_METHOD[reportDetail.mode]}
                  </Descriptions.Item>
                  <Descriptions.Item label="用例跳过数">
                    {skippedCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="测试计划">
                    {planName || '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="开始时间">
                    {reportDetail.start_at}
                  </Descriptions.Item>
                  <Descriptions.Item label="结束时间">
                    {reportDetail.finished_at}
                  </Descriptions.Item>
                  <Descriptions.Item label="耗时">
                    {parseFloat(reportDetail.cost) > 60 ? `${Math.round(parseFloat(reportDetail.cost) / 60)}分` : reportDetail.cost + '秒'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={8}>
                <div className={styles.pieCardWrap}>
                  <Pie height={260} data={getPieData()} name="name" value="count"/>
                </div>
              </Col>
            </Row>
          </div>
        </Card>

        <Card className={styles.bottomCard}
              title="用例列表"
              extra={
                <Input prefix={<SearchOutlined/>} placeholder="搜索场景名称..."
                       className={styles.bottomSearch} onPressEnter={onSearchCase}/>
              }>
          <Table className={styles.caseTable} columns={columns} dataSource={currentCaseList}
                 locale={{emptyText: <NoRecord height={200}/>}}/>
        </Card>
      </Spin>
    </PageContainer>
  )

}

export default connect(({gconfig, user, loading}) => ({
  gconfig: gconfig,
  loading: loading,
  user,
}))(ReportDetail)
