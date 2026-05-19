import {
  deleteUsers,
  listUserActivities,
  listUserOperationLog,
  listUsers,
  loginGithub,
  queryFollowTestPlanData,
  queryUserStatistics,
  updateAvatar,
  updateUsers
} from '@/services/user';
import {history} from 'umi';
import {getPageQuery} from "@/utils/utils";
import {message} from "antd";
import auth from "@/utils/auth";
import {stringify} from "querystring";

// const client_id = `c46c7ae33442d13498cd`;
// const key = `c79fafe58ff45f6b5b51ddde70d2d645209e38b9`;

const getUserMap = data => {
  const temp = {}
  const userNameMap = {}
  data.forEach(item => {
    temp[item.id] = item
    userNameMap[item.id] = item.name
  })
  return {userMap: temp, userNameMap};
}

const UserModel = {
  namespace: 'user',
  state: {
    currentUser: {},
    userList: [],
    currentUserList: [],
    userMap: {},
    userNameMap: {},
    // 用户活动轨迹数据
    activities: [],
    operationLog: [],
    project_count: 0,
    case_count: 0,
    user_rank: 0,
    total_user: 0,
    weekly_case: [],
    month_case: [],
    api_case_count: 0,
    functional_case_count: 0,
    weekly_new_api_case: 0,
    weekly_new_functional_case: 0,
    // 关注的测试计划数据
    followPlan: [],
  },
  effects: {
    // * fetch(_, {call, put}) {
    //   const token = localStorage.getItem("pityToken")
    //   const response = yield call(queryCurrent, {token});
    //   yield put({
    //     type: 'save',
    //     payload: response,
    //   });
    // },

    * fetchUserActivities({payload}, {call, put}) {
      const res = yield call(listUserActivities, payload);
      if (auth.response(res)) {
        yield put({
          type: 'save',
          payload: {
            activities: res.data,
          }
        })
      }
    },

    * fetchUserRecord({payload}, {call, put}) {
      const res = yield call(listUserOperationLog, payload);
      if (auth.response(res)) {
        yield put({
          type: 'save',
          payload: {
            operationLog: res.data,
          }
        })
      }
    },

    * updateUser({payload}, {call, put}) {
      const response = yield call(updateUsers, payload);
      return auth.response(response, true);
    },

    * deleteUser({payload}, {call, put}) {
      const response = yield call(deleteUsers, payload);
      return auth.response(response, true);
    },

    * fetchUserList(_, {call, put}) {
      const response = yield call(listUsers);
      const {userMap, userNameMap} = getUserMap(response);
      yield put({
        type: 'save',
        payload: {
          userList: response,
          currentUserList: response,
          userMap,
          userNameMap
        },
      });
    },

    * getGithubToken({payload}, {call, put}) {
      const response = yield call(loginGithub, payload);
      if (response.code === 0) {
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        message.success('🎉 🎉 🎉  登录成功！');
        yield put({
          type: 'login/changeLoginStatus',
          payload: response,
        }); // Login successfully
        yield put({
          type: 'fetchCurrent',
        })
        let {redirect} = params;

        if (redirect) {
          const redirectUrlParams = new URL(redirect);

          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);

            if (redirect.match(/^\/.*#/)) {
              redirect = redirect.substr(redirect.indexOf('#') + 1);
            }
          } else {
            window.location.href = '/';
            return;
          }
        }

        history.replace(redirect || '/');
      } else {
        message.error(response.msg);
      }

    },

    * avatar({payload}, {call, put}) {
      const res = yield call(updateAvatar, payload)
      if (auth.response(res, true)) {
        const pityUser = localStorage.getItem("pityUser")
        const info = JSON.parse(pityUser)
        info.avatar = res.data;
        localStorage.setItem("pityUser", JSON.stringify(info))
        yield put({
          type: 'saveCurrentUser',
          payload: info,
        });
      }
    },

    * queryUserStatistics(_, {call, put}) {
      const response = yield call(queryUserStatistics);
      if (auth.response(response)) {
        const data = response.data || {};
        yield put({
          type: 'save',
          payload: {
            project_count: data.project_count || 0,
            case_count: data.case_count || 0,
            user_rank: data.user_rank || 0,
            total_user: data.total_user || 0,
            weekly_case: data.weekly_case || [],
            // New workspace metric fields. Keep backward compatibility:
            // if month_case is missing, fallback to weekly_case.
            month_case: data.month_case || data.weekly_case || [],
            api_case_count: data.api_case_count || 0,
            functional_case_count: data.functional_case_count || 0,
            weekly_new_api_case: data.weekly_new_api_case || 0,
            weekly_new_functional_case: data.weekly_new_functional_case || 0,

          },
        });
      }
    },

    /**
     * 获取用户关注的测试计划执行数据
     * @param _
     * @param call
     * @param put
     * @returns {Generator<*, void, *>}
     */
    * queryFollowTestPlanData(_, {call, put}) {
      const response = yield call(queryFollowTestPlanData);
      if (auth.response(response)) {
        yield put({
          type: 'save',
          payload: {
            followPlan: response.data,
          },
        });
      }
    },


    * fetchCurrent(_, {call, put}) {
      const token = localStorage.getItem("pityToken")
      const userInfo = localStorage.getItem("pityUser")
      const pityExpire = localStorage.getItem("pityExpire")
      if (!token || !userInfo || (new Date().getTime() / 1000) > pityExpire) {
        // history.push("/#/user/login");
        message.info("登录信息已失效");
        localStorage.removeItem("pityToken")
        localStorage.removeItem("pityUser")
        history.replace({
          pathname: '/user/login',
          search: stringify({
            redirect: window.location.href,
          }),
        });
        return;
      }
      const info = JSON.parse(userInfo)
      yield put({
        type: 'saveCurrentUser',
        payload: info,
      });
      // const token = localStorage.getItem("pityToken")
      // // const userInfo = localStorage.getItem("pityUser")
      // if (token === null || token === '') {
      //   history.push("/#/user/login");
      //   history.replace({
      //     pathname: '/user/login',
      //     search: stringify({
      //       redirect: window.location.href,
      //     }),
      //   });
      //   return;
      // }
      // const response = yield call(queryCurrent, {token});
      // if (auth.response(response)) {
      //   yield put({
      //     type: 'saveCurrentUser',
      //     payload: response.data,
      //   });
      // } else {
      //   localStorage.removeItem("pityToken")
      //   localStorage.removeItem("pityUser")
      //   history.push("/#/user/login");
      //   history.replace({
      //     pathname: '/user/login',
      //     search: stringify({
      //       redirect: window.location.href,
      //     }),
      //   });
      // }
    },
  },
  reducers: {
    save(state, {payload}) {
      return {...state, ...payload}
    },

    saveCurrentUser(state, action) {
      localStorage.setItem("pityUser", JSON.stringify(action.payload || {}))
      return {...state, currentUser: action.payload || {}};
    },

    changeNotifyCount(
      state = {
        currentUser: {},
      },
      action,
    ) {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          notifyCount: action.payload.totalCount,
          unreadCount: action.payload.unreadCount,
        },
      };
    },
  },
};
export default UserModel;
