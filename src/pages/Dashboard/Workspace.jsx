import { PageContainer } from '@ant-design/pro-components';
import { connect, history, useModel } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Rate,
  Row,
  Space,
  Statistic,
  Tag,
  Tooltip,
} from 'antd';
import React, { useEffect, useMemo } from 'react';
import {
  AlertTwoTone,
  BarChartOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  CompassOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { RingProgress, TinyArea } from '@ant-design/plots';
import NoRecord2 from '@/components/NotFound/NoRecord2';
import ChartCard from '@/components/Charts/ChartCard';
import Area from '@/components/Charts/Area';
import noRecord from '@/assets/no_record.svg';
import common from '@/utils/common';
import { getAvatarByUser } from '@/utils/avatar';
import styles from './Workspace.less';

const getWelcome = (user) => {
  const hour = new Date().getHours();
  if (hour < 6) return `Hi, ${user}! 凌晨了，跑任务也别忘了休息`;
  if (hour < 9) return `早上好，${user}!`;
  if (hour < 12) return `上午好，${user}!`;
  if (hour < 14) return `中午好，${user}!`;
  if (hour < 19) return `下午好，${user}!`;
  return `晚上好，${user}! 今天的质量地图也点亮一下`;
};

const rateDesc = ['糟糕', '差劲', '普通', '良好', '棒极了'];

const QUICK_LINKS = [
  { name: '项目列表', link: '/project', icon: <FolderOpenOutlined /> },
  { name: '测试计划', link: '/apiTest/testplan', icon: <CompassOutlined /> },
  { name: '测试报告', link: '/record/list', icon: <FileDoneOutlined /> },
  { name: 'HTTP工具', link: '/tool/request', icon: <ThunderboltOutlined /> },
  { name: '数据库配置', link: '/config/database', icon: <DatabaseOutlined /> },
];

const calculatePercent = (report, decimal = false) => {
  const percent = common.calPiePercent(
    report?.success_count || 0,
    (report?.success_count || 0) + (report?.failed_count || 0) + (report?.error_count || 0),
  );
  return decimal ? percent : percent * 100;
};

const calculateRate = (value) => {
  if (value < 0.1) return 1;
  if (value < 0.6) return 2;
  if (value < 0.7) return 3;
  if (value < 0.8) return 4;
  return 5;
};

const reversePercentSeries = (report = []) => [...report].reverse().map((item) => calculatePercent(item));

const Hero = ({ currentUser, projectCount, caseCount, userRank, totalUser }) => (
  <Card bordered={false} className={styles.heroCard}>
    <div className={styles.heroGlow} />
    <div className={styles.heroContent}>
      <div className={styles.heroUser}>
        <Avatar size={72} src={getAvatarByUser(currentUser)} />
        <div>
          <div className={styles.heroEyebrow}>Argux Workspace</div>
          <div className={styles.heroTitle}>{getWelcome(currentUser?.name || '同学')}</div>
          <div className={styles.heroDesc}>
            {currentUser?.email || '-'} {currentUser?.nickname || ''}
          </div>
        </div>
      </div>
      <div className={styles.heroStats}>
        <div className={styles.heroStatItem}>
          <Statistic title="参与项目" value={projectCount || 0} prefix={<FolderOpenOutlined />} />
        </div>
        <div className={styles.heroStatItem}>
          <Statistic title="用例数量" value={caseCount || 0} prefix={<FileDoneOutlined />} />
        </div>
        <div className={styles.heroStatItem}>
          <Statistic title="团队排名" value={userRank === 0 ? '-' : userRank} suffix={`/ ${totalUser || 0}`} prefix={<TeamOutlined />} />
        </div>
      </div>
    </div>
  </Card>
);

const QuickLink = ({ item }) => (
  <div className={styles.quickLink} onClick={() => history.push(item.link)}>
    <span className={styles.quickLinkIcon}>{item.icon}</span>
    <span>{item.name}</span>
  </div>
);

const RingPie = ({ report }) => {
  const config = {
    height: 126,
    autoFit: true,
    percent: calculatePercent(report, true),
    color: ['#12B886', '#F4664A'],
    innerRadius: 0.84,
    radius: 0.98,
    statistic: {
      title: {
        style: {
          color: '#52657a',
          fontSize: '12px',
          lineHeight: '14px',
        },
        formatter: () => '上次通过率',
      },
      content: {
        style: {
          color: '#111827',
          fontSize: '18px',
          fontWeight: 700,
        },
        formatter: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      },
    },
  };
  return <RingProgress {...config} />;
};

const PlanReportCard = ({ item }) => {
  const latest = item.report?.[0];
  if (!latest) return <NoRecord2 desc="这个测试计划还没有执行记录哦，先来一次漂亮的首跑吧" />;

  const passRate = calculatePercent(latest, true);
  const score = calculateRate(passRate);
  const total = (latest.success_count || 0) + (latest.failed_count || 0) + (latest.error_count || 0);

  return (
    <Row gutter={[16, 16]} align="stretch">
      <Col xs={24} md={8}>
        <ChartCard
          bordered={false}
          title="最近一次评分"
          action={<Tooltip title="通过率越高，评分越高"><InfoCircleOutlined /></Tooltip>}
          contentHeight={142}
        >
          <div className={styles.scorePanel}>
            <Rate disabled tooltips={rateDesc} value={score} />
            <span className={styles.scoreText}>{rateDesc[score - 1]}</span>
            <Progress
              percent={Number((passRate * 100).toFixed(0))}
              size="small"
              strokeColor={{ '0%': '#2F7DF4', '100%': '#12B886' }}
            />
          </div>
        </ChartCard>
      </Col>
      <Col xs={24} md={8}>
        <ChartCard
          bordered={false}
          title={latest.start_at}
          action={<Tooltip title="最近一次执行通过率"><InfoCircleOutlined /></Tooltip>}
          contentHeight={142}
        >
          <RingPie report={latest} />
        </ChartCard>
      </Col>
      <Col xs={24} md={8}>
        <ChartCard
          bordered={false}
          title="近7次通过率(%)"
          action={<Tooltip title="最近7次通过率趋势"><InfoCircleOutlined /></Tooltip>}
          contentHeight={142}
        >
          <TinyArea
            color="#2F7DF4"
            height={132}
            autoFit
            smooth
            data={reversePercentSeries(item.report)}
            line={{ color: '#2F7DF4', lineWidth: 2 }}
            areaStyle={{ fill: 'l(270) 0:#dbeafe 1:rgba(219,234,254,0.12)' }}
          />
        </ChartCard>
      </Col>
      <Col span={24}>
        <div className={styles.executionStrip}>
          <div>
            <CheckCircleTwoTone twoToneColor="#12B886" />
            <span>成功 {latest.success_count || 0}</span>
          </div>
          <div>
            <CloseCircleTwoTone twoToneColor="#F56C6C" />
            <span>失败 {latest.failed_count || 0}</span>
          </div>
          <div>
            <AlertTwoTone twoToneColor="#F59E0B" />
            <span>错误 {latest.error_count || 0}</span>
          </div>
          <div>
            <BarChartOutlined />
            <span>总计 {total}</span>
          </div>
        </div>
      </Col>
    </Row>
  );
};

const FollowPlanList = ({ followPlan }) => (
  <Card
    bordered={false}
    className={styles.planBoard}
    title={(
      <Space>
        <RocketOutlined />
        <strong>关注中的测试计划</strong>
        <Tag color="blue">{followPlan.length} 个</Tag>
      </Space>
    )}
    extra={<Button type="link" onClick={() => history.push('/apiTest/testplan')}>管理关注</Button>}
  >
    {followPlan.length === 0 ? (
      <Empty
        imageStyle={{ height: 220 }}
        image={noRecord}
        description={<span>你还没有关注测试计划，赶紧去 <a href="/#/apiTest/testplan">关注</a> 一个吧！</span>}
      />
    ) : (
      <div className={styles.planList}>
        {followPlan.map((item) => (
          <Card
            key={item.plan?.id || item.id}
            className={styles.planCard}
            hoverable
            title={(
              <div className={styles.planHeader}>
                <a href="/#/apiTest/testplan">{item.plan?.name || '未命名计划'}</a>
                <Tag color={item.report?.length ? 'green' : 'default'}>
                  {item.report?.length ? '已有报告' : '待执行'}
                </Tag>
              </div>
            )}
          >
            <PlanReportCard item={item} />
          </Card>
        ))}
      </div>
    )}
  </Card>
);

const SidePanel = ({ weeklyCase }) => {
  const weeklyTotal = useMemo(() => (
    (weeklyCase || []).reduce((sum, item) => sum + Number(item?.count || 0), 0)
  ), [weeklyCase]);

  return (
    <Space direction="vertical" size={16} className={styles.sidePanel}>
      <Card
        bordered={false}
        className={styles.quickCard}
        title={(
          <Space>
            <CompassOutlined />
            <span>快速导航</span>
          </Space>
        )}
      >
        <div className={styles.quickGrid}>
          {QUICK_LINKS.map((item) => <QuickLink item={item} key={item.name} />)}
          <Button className={styles.addQuickButton} type="primary" ghost>
            <PlusOutlined /> 添加
          </Button>
        </div>
      </Card>
      <Card
        bordered={false}
        className={styles.weeklyCard}
        title={(
          <Space>
            <BarChartOutlined />
            <span>最近7天编写用例</span>
          </Space>
        )}
        extra={<Button type="link" onClick={() => history.push('/apiTest/testcase')}>去编写</Button>}
      >
        <div className={styles.weeklySummary}>
          <Statistic title="7天新增" value={weeklyTotal} suffix="条" />
          <Tag color="geekblue">实时统计</Tag>
        </div>
        <Area xField="date" yField="count" data={weeklyCase} />
      </Card>
    </Space>
  );
};

const Workspace = ({ user, dispatch }) => {
  const {
    project_count,
    case_count,
    user_rank,
    total_user,
    weekly_case,
    followPlan = [],
  } = user;

  const { initialState } = useModel('@@initialState');
  const { currentUser = {} } = initialState || {};

  useEffect(() => {
    dispatch({ type: 'user/queryUserStatistics' });
    dispatch({ type: 'user/queryFollowTestPlanData' });
  }, []);

  return (
    <PageContainer title={false} breadcrumb={null}>
      <div className={styles.workspacePage}>
        <Hero
          currentUser={currentUser}
          projectCount={project_count}
          caseCount={case_count}
          userRank={user_rank}
          totalUser={total_user}
        />
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            <FollowPlanList followPlan={followPlan} />
          </Col>
          <Col xs={24} xl={8}>
            <SidePanel weeklyCase={weekly_case} />
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default connect(({ user }) => ({ user }))(Workspace);
