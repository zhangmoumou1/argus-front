import React, {memo, useEffect, useState} from 'react';

import {PageContainer} from '@ant-design/pro-components';

import {Button, Card, Col, Dropdown, Empty, Input, Modal, Pagination, Row, Spin, Tooltip,} from 'antd';

import {

  AliwangwangOutlined,

  ClockCircleOutlined,
  DeleteTwoTone,

  ExclamationCircleOutlined,
  UserOutlined,

  QuestionCircleOutlined,

  SearchOutlined

} from '@ant-design/icons';

import FormForModal from '@/components/ArgusForm/FormForModal';

import {connect, history, useModel} from '@umijs/max';

import {insertProject, listProject} from '@/services/project';

import auth from '@/utils/auth';

import {listUsers} from '@/services/user';


import UserLink from "@/components/Button/UserLink";

import styles from './Project.less';

import UserSelect from "@/components/User/UserSelect";

import {IconFont} from "@/components/Icon/IconFont";

import ProjectAvatar from "@/components/Project/ProjectAvatar";






const Project = ({dispatch, project, loading}) => {

  const { initialState } = useModel('@@initialState');

  const currentUser = initialState?.currentUser || {};

  const currentRole = Number(currentUser?.role ?? 0);

  const isSuperAdmin = currentRole === 2;

  const isLeader = currentRole === 1;

  const [data, setData] = useState([]);

  const [pagination, setPagination] = useState({

    current: 1,

    pageSize: 8,

    total: 0,

    showTotal: count => `共${count}个项目`

  });

  const [visible, setVisible] = useState(false);

  const [users, setUsers] = useState([]);

  const [userMap, setUserMap] = useState({});

  const [spinning, setSpinning] = useState(false);



  const fetchData = async (current = pagination.current, size = pagination.pageSize) => {

    setSpinning(true)

    const res = await listProject({page: current, size});

    setSpinning(false)

    if (auth.response(res)) {

      setData(res.data);

      setPagination({...pagination, current, total: res.total});

    }

  };



  const getUsers = async () => {

    const user = await listUsers();

    const temp = {};

    user.forEach((item) => {

      temp[item.id] = item;

    });

    setUsers(user);

    setUserMap(temp);

  };



  const onDeleteProject = async projectId => {

    const res = await dispatch({

      type: 'project/deleteProject',

      payload: {

        projectId,

      },

    });

    if (res) {

      fetchData();

    }

  }



  useEffect(() => {

    getUsers();

    fetchData();

  }, []);



  const onSearchProject = async e => {

    const projectName = e.target.value;

    const res = await listProject({page: 1, size: pagination.pageSize, name: projectName});

    if (auth.response(res)) {

      setData(res.data);

      setPagination({...pagination, current: 1, total: res.total});

    }

  };



  const onHandleCreate = async (values) => {

    const res = await insertProject(values);

    if (auth.response(res, true)) {

      setVisible(false);

      // 创建成功后自动获取第一页的数据, 因为项目会按创建时间排序

      await fetchData(1);

    }

  };



  const fields = [

    {

      name: 'name',

      label: '项目名称',

      required: true,

      message: '请输入项目名称',

      type: 'input',

      placeholder: '请输入项目名称',

    },

    {

      name: 'app',

      label: '服务名',

      required: true,

      message: '请输入项目对应服务名称',

      type: 'input',

      placeholder: '请输入项目对应服务名称',

      component: null,

    },

    {

      name: 'owner',

      label: '项目负责人',

      required: true,

      component: <UserSelect users={users} placeholder="选择项目负责人"/>,

      type: 'select',

    },

    {

      name: 'description',

      label: '项目描述',

      required: false,

      message: '请输入项目描述',

      type: 'textarea',

      placeholder: '请输入项目描述',

    },

  ];



  const menu = item => ({
    items: [
      {
        key: 'apply',
        icon: <AliwangwangOutlined/>,
        label: '申请权限',
      },
      {
        key: 'delete',
        icon: <DeleteTwoTone twoToneColor="red"/>,
        label: '删除项目',
      },
    ],
    onClick: async ({key, domEvent}) => {
      domEvent?.stopPropagation?.();
      if (key !== 'delete') return;
      Modal.confirm({
        title: '你确定要删除此项目吗?',
        icon: <ExclamationCircleOutlined/>,
        content: '删除后不可恢复，请谨慎~',
        okText: '确定',
        okType: 'danger',
        cancelText: '点错了',
        onOk: async () => {
          await onDeleteProject(item.id);
        },
      });
    },
  });



  const renderCardMenu = item => {

    const isOwner = Number(item?.owner) === Number(currentUser?.id);

    const allowOps = isSuperAdmin || isLeader || isOwner;

    if (!allowOps) return null;

    return (

      <Dropdown menu={menu(item)} trigger={['click']} onClick={e => { e.stopPropagation(); }}>

        <IconFont type="icon-more1" style={{cursor: 'pointer', fontSize: 20, color: '#94a3b8'}}/>

      </Dropdown>

    );

  };



  return (

    <PageContainer title={false} breadcrumb={null}>

      <FormForModal

        width={600}

        title="添加项目"

        left={6}

        right={18}

        record={{}}

        open={visible}

        onCancel={() => setVisible(false)}

        fields={fields}

        onFinish={onHandleCreate}

      />

      <Spin spinning={spinning}>

        <Card className={styles.toolbarCard}>

          <Row gutter={8} align="middle">

            <Col span={18}>

              <Button type="primary" onClick={() => setVisible(true)}>

                创建项目

                <Tooltip title="只有超级管理员可以创建项目">

                  <QuestionCircleOutlined/>

                </Tooltip>

              </Button>

            </Col>

            <Col span={6}>

              <Input

                className="borderSearch"

                prefix={<SearchOutlined/>}

                onPressEnter={onSearchProject}

                style={{float: 'right'}}

                placeholder="请输入项目名称"

              />

            </Col>

          </Row>

        </Card>

        <Row gutter={[24, 24]}>
          {data.length === 0 ? (
            <Col span={24}>
              <Card className={styles.emptyCard}>
                <Empty description="暂无项目，点击「创建项目」创建一个吧!" />
              </Card>
            </Col>
          ) : (
            data.map((item) => (
              <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
                <Card hoverable className={styles.card} onClick={() => history.push(`/project/${item.id}`)}>
                  <div className={styles.cardMeta}>
                    <div className={styles.cardTitle}>
                      <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        <ProjectAvatar data={item} width={32}/>
                        {item.name}
                      </span>
                      {renderCardMenu(item)}
                    </div>
                    <p className={styles.cardDesc}>{item.description || '暂无描述'}</p>
                    <div className={styles.cardMetaRow}>
                      <UserOutlined />
                      <UserLink user={userMap[item.owner]}/>
                    </div>
                    <div className={styles.cardMetaRow}>
                      <ClockCircleOutlined />
                      {item.updated_at}
                    </div>
                  </div>
                </Card>
              </Col>
            ))
          )}
        </Row>

        <div className={styles.paginationWrap}>
          <Pagination {...pagination} onChange={pg => { fetchData(pg) }}/>
        </div>

      </Spin>

    </PageContainer>

  );

};





export default connect(({loading, project}) => ({loading, project}))(memo(Project));
