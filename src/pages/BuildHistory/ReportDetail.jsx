import {connect, useLocation, useParams} from "@umijs/max";
import {Badge, Button, Card, Col, Descriptions, Divider, Dropdown, Input, message, Row, Spin, Statistic, Table, Tabs, Tag} from "antd";
import {PageContainer} from "@ant-design/pro-components";
import React, {useEffect, useState} from "react";
import {queryReport, querySharedReport} from "@/services/report";
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
  SearchOutlined,
  ShareAltOutlined
} from "@ant-design/icons";
import {IconFont} from "@/components/Icon/IconFont";
import reportConfig from "@/consts/reportConfig";
import common from "@/utils/common";
import Pie from "@/components/Charts/Pie";
import NoRecord from "@/components/NotFound/NoRecord";
import TestResult from "@/components/TestCase/TestResult";
import UserLink from "@/components/Button/UserLink";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const {TabPane} = Tabs;

const ReportDetail = ({dispatch, loading, user, gconfig}) => {
  const params = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isShared = location.pathname.startsWith('/share/report/') || searchParams.get('share') === '1';
  const reportId = params.id;
  const [reportDetail, setReportDetail] = useState({});
  const [planName, setPlanName] = useState('');
  const [caseModal, setCaseModal] = useState(false);
  const [response, setResponse] = useState({});
  const [caseName, setCaseName] = useState('');
  const [caseList, setCaseList] = useState([]);
  const [envName, setEnvName] = useState('');
  const [executorName, setExecutorName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [currentCaseList, setCurrentCaseList] = useState([]);
  const [filterStatus, setFilterStatus] = useState(null);
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
    let temp = filterStatus !== null ? caseList.filter(item => Number(item.status) === filterStatus) : caseList;
    temp = temp.filter(item => item.data_name.indexOf(value) > -1 || item.case_name.indexOf(value) > -1);
    setCurrentCaseList(temp)
  }

  const onFilterByStatus = status => {
    if (filterStatus === status) {
      setFilterStatus(null);
      setCurrentCaseList(caseList);
    } else {
      setFilterStatus(status);
      if (status === null) {
        setCurrentCaseList(caseList);
      } else {
        setCurrentCaseList(caseList.filter(item => Number(item.status) === status));
      }
    }
  }

  const load = !!(loading.effects['testcase/retryCase'] || reportLoading)

  const onShare = () => {
    const url = `${window.location.origin}/#/share/report/${reportId}`;
    navigator.clipboard.writeText(url).then(() => {
      message.success('报告链接已复制，分享后无需登录即可查看');
    });
  }

  const getReportName = () => planName || `测试报告_${reportId}`;

  const onGenerateImage = async () => {
    const el = document.querySelector(`.${styles.summaryCard}`);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${getReportName()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      message.success('报告图片已生成');
    } catch {
      message.error('生成图片失败');
    }
  }

  const onGeneratePDF = async () => {
    const el = document.querySelector(`.${styles.summaryCard}`);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      pdf.save(`${getReportName()}.pdf`);
      message.success('报告PDF已生成');
    } catch {
      message.error('生成PDF失败');
    }
  }

  const shareMenuItems = [
    {key: 'image', label: '生成图片'},
    {key: 'pdf', label: '生成PDF'},
    {key: 'link', label: '复制链接'},
  ];

  const onShareMenuClick = ({key}) => {
    if (key === 'image') onGenerateImage();
    else if (key === 'pdf') onGeneratePDF();
    else if (key === 'link') onShare();
  }

  const getReportResponse = async () => {
    setReportLoading(true);
    try {
      const res = isShared ? await querySharedReport({id: reportId}) : await queryReport({id: reportId})
      if (auth.response(res)) {
        setCaseList(res.data.case_list);
        setCurrentCaseList(res.data.case_list);
        setReportDetail(res.data.report);
        setPlanName(res.data.plan_name);
        setProjectName(res.data.project_name);
        if (isShared) {
          setEnvName(res.data.env_name);
          setExecutorName(res.data.executor_name);
        }
      }
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    if (!isShared) {
      fetchEnv();
      fetchUsers();
    }
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
      render: (text, record) => isShared ? <span>{text}</span> : <span><a href={`/#/apiTest/testcase/${record.directory_id}/${record.case_id}`}>{text}</a>{record.api_pending_update ? <Tag color="red" style={{marginLeft: 8}}>变更</Tag> : null}</span>
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
        {!isShared && <>
          <Divider type="vertical"/>
          <a onClick={async () => {
            await onHandleRetry(record)
          }}>重试</a>
        </>}
      </>
    }
  ]

  return (
    <PageContainer title={false} breadcrumb={null} className={styles.reportDetailPage}>
      <TestResult width={1000} setModal={setCaseModal} modal={caseModal} caseName={caseName} response={response} isShared={isShared}/>
      <Spin spinning={load}>
        <Card className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.headerTitle}>
              测试报告 #{reportId}
              {getTag()}
            </span>
            {!isShared && (
              <Dropdown menu={{items: shareMenuItems, onClick: onShareMenuClick}} placement="bottomRight">
                <Button type="primary" ghost size="small" icon={<ShareAltOutlined/>}>
                  分享报告
                </Button>
              </Dropdown>
            )}
          </div>
          <div className={styles.summaryBody}>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={16}>
                <Row gutter={[10, 10]} className={styles.statRow}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card className={`${styles.statisticCard} ${styles.statTotal} ${filterStatus !== null ? styles.statInactive : ''}`}
                          onClick={() => onFilterByStatus(null)}>
                      <Statistic title="用例总数" value={totalCount}
                                 prefix={<IconFont type="icon-yongliliebiao"/>}/>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card className={`${styles.statisticCard} ${styles.statSuccess} ${filterStatus !== null && filterStatus !== 0 ? styles.statInactive : ''}`}
                          onClick={() => onFilterByStatus(0)}>
                      <Statistic title="成功" value={successCount}
                                 prefix={<CheckCircleTwoTone twoToneColor='#22c55e'/>}/>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card className={`${styles.statisticCard} ${styles.statFailed} ${filterStatus !== null && filterStatus !== 1 ? styles.statInactive : ''}`}
                          onClick={() => onFilterByStatus(1)}>
                      <Statistic title="失败" value={failedCount}
                                 prefix={<CloseCircleTwoTone twoToneColor='#ef4444'/>}/>
                    </Card>
                  </Col>
                </Row>
                <Row gutter={[10, 10]} className={styles.statRow}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card className={`${styles.statisticCard} ${styles.statError} ${filterStatus !== null && filterStatus !== 2 ? styles.statInactive : ''}`}
                          onClick={() => onFilterByStatus(2)}>
                      <Statistic title="错误" value={errorCount}
                                 prefix={<AlertTwoTone twoToneColor="#f59e0b"/>}/>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card className={`${styles.statisticCard} ${styles.statSkipped} ${filterStatus !== null && filterStatus !== 3 ? styles.statInactive : ''}`}
                          onClick={() => onFilterByStatus(3)}>
                      <Statistic title="跳过" value={skippedCount}
                             prefix={<MinusCircleOutlined style={{color: '#8b5cf6'}}/>}/>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card className={`${styles.statisticCard} ${styles.statRate}`}>
                      <Statistic title="通过率" suffix="%"
                                 value={common.calPercent(successCount, failedCount + successCount + errorCount)}
                                 prefix={common.calPercent(successCount, failedCount + successCount + errorCount) > 90
                                   ? <LikeTwoTone/> : <FrownTwoTone/>}/>
                    </Card>
                  </Col>
                </Row>
                <Descriptions className={styles.reportDescriptions} column={{xs: 1, sm: 2}} size="small">
                  <Descriptions.Item label="项目">
                    {projectName || '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="测试计划">
                    {planName || '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行环境">
                    <Tag icon={<IconFont type="icon-huanjing"/>}>{envMap[reportDetail.env] || envName || reportDetail.env}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="执行人">
                    {reportDetail.executor === 0 ? 'pity机器人' : (userMap[reportDetail.executor] ? <UserLink user={userMap[reportDetail.executor]} size={16}/> : (executorName || `执行人#${reportDetail.executor}`))}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行方式">
                    {reportConfig.EXECUTE_METHOD[reportDetail.mode]}
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
              <Col xs={24} md={8}>
                <div className={styles.pieCardWrap}>
                  <Pie height={200} data={getPieData()} name="name" value="count"/>
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
                 scroll={{x: 'max-content'}}
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
