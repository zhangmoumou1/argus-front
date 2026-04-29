import {Button, Card, Col, Row} from "antd";
import {history} from "@umijs/max";
import {
  ApiOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  LineChartOutlined,
  SecurityScanOutlined,
  SyncOutlined,
} from "@ant-design/icons";

const scenes = [
  {
    id: 1,
    title: '创建平台用户',
    sceneKey: 'create-platform-user',
    used: 43,
    desc: '192.168.8.87新天山测试环境创建用户并配置角色',
    color: '#dbeafe',
    iconColor: '#2563eb',
    icon: <CheckSquareOutlined/>,
  },
  {
    id: 2,
    title: '创建数据库用户并赋权',
    sceneKey: 'create-db-user',
    used: 29,
    desc: '解决环境数据库用户的DDL权限问题',
    color: '#ffedd5',
    iconColor: '#f97316',
    icon: <ApiOutlined/>,
  },
  {
    id: 3,
    title: '接口自动化测试',
    sceneKey: 'api-auto-test',
    used: 82,
    desc: '边缘端数采平台、数据中台、数据库底座等产品的接口自动化测试',
    color: '#dcfce7',
    iconColor: '#16a34a',
    icon: <DashboardOutlined/>,
  },
  {
    id: 4,
    title: '需求发布统计',
    sceneKey: 'release-metrics',
    used: 118,
    desc: '按照时间维度统计已发布版本和需求',
    color: '#f3e8ff',
    iconColor: '#7c3aed',
    icon: <SecurityScanOutlined/>,
  },
  {
    id: 5,
    title: '模拟发送数仓点位和标签值',
    sceneKey: 'sim-point-tag',
    used: 1208,
    desc: '通过API或Kafka模拟发送点位标签数据',
    color: '#ffe4e6',
    iconColor: '#e11d48',
    icon: <LineChartOutlined/>,
  },
  {
    id: 6,
    title: '创建GP和SR指标表',
    sceneKey: 'create-gp-sr-table',
    used: 94,
    desc: '根据已有指标，创建对应Greenplum和StarRocks指标表',
    color: '#e0f2fe',
    iconColor: '#0284c7',
    icon: <SyncOutlined/>,
  },
  {
    id: 7,
    title: '自动同步harbor镜像并部署',
    sceneKey: 'sync-harbor-image',
    used: 13,
    desc: '自动同步harbor镜像并部署，目前仅支持byt-grid-data',
    color: '#fef3c7',
    iconColor: '#d97706',
    icon: <ApiOutlined/>,
  },
];

const formatUsed = (value) => {
  if (value >= 1000) {
    const result = (value / 1000).toFixed(1).replace('.0', '');
    return `${result}k`;
  }
  return `${value}`;
};

export default () => {
  return (
    <Row gutter={[32, 20]} className="factory-body">
      {scenes.map((item) => (
        <Col xs={24} sm={12} lg={6} xl={6} key={item.id}>
          <Card className="scene-card-v2" hoverable>
            <div className="scene-head">
              <div className="scene-icon" style={{backgroundColor: item.color, color: item.iconColor}}>
                {item.icon}
              </div>
              <div className="scene-title-wrap">
                <div className="scene-title">{item.title}</div>
              </div>
            </div>
            <div className="scene-desc">{item.desc}</div>
            <div className="scene-footer">
              <div className="scene-used">{formatUsed(item.used)} 次执行</div>
                <Button
                  type="primary"
                  className="scene-action-btn"
                  onClick={() => history.push(`/datafactory/run/${item.sceneKey}`)}
                >
                  去执行
                </Button>
              </div>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
