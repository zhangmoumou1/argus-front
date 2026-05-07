import {generateCase, importFile, queryRecordStatus, removeRecord, removeRecords, startRecord, stopRecord} from "@/services/testcase";
import auth from "@/utils/auth";

const getRequestMeta = (url = '') => {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    return {
      host: parsed.host || 'unknown-host',
      pathSegments: segments,
      fullPath: `${parsed.pathname || '/'}${parsed.search || ''}`,
      query: parsed.search ? parsed.search.slice(1) : '',
    }
  } catch (e) {
    const pure = String(url || '').replace(/^https?:\/\//, '')
    const [hostWithPath, query = ''] = pure.split('?')
    const parts = hostWithPath.split('/').filter(Boolean)
    const host = parts[0] || 'unknown-host'
    const pathSegments = parts.slice(1)
    return {
      host,
      pathSegments,
      fullPath: `/${pathSegments.join('/')}${query ? `?${query}` : ''}` || '/',
      query,
    }
  }
}

const enrichRecord = (record, index) => {
  const meta = getRequestMeta(record.url)
  const responseHeadersObject = record.response_headers || {}
  const requestHeadersObject = record.request_headers || {}
  const statusCode = Number(record.status_code || 0)
  return {
    ...record,
    index,
    created_at: record.created_at || '',
    cookies: JSON.stringify(record.cookies, null, 2),
    request_cookies: JSON.stringify(record.request_cookies, null, 2),
    response_headers: JSON.stringify(responseHeadersObject, null, 2),
    request_headers: JSON.stringify(requestHeadersObject, null, 2),
    __host: meta.host,
    __pathSegments: meta.pathSegments,
    __fullPath: meta.fullPath,
    __query: meta.query,
    __statusCode: statusCode,
    __statusGroup: statusCode >= 500 ? '5xx' : statusCode >= 400 ? '4xx' : statusCode >= 300 ? '3xx' : statusCode >= 200 ? '2xx' : 'other',
    __hasBody: !!String(record.body || '').trim(),
    __isError: statusCode >= 400,
    __responseSize: String(record.response_content || '').length,
    __requestContentType: requestHeadersObject['Content-Type'] || requestHeadersObject['content-type'] || '-',
    __responseContentType: responseHeadersObject['Content-Type'] || responseHeadersObject['content-type'] || '-',
    __normalized: true,
    __isLatestFlash: false,
  }
}

export default {
  namespace: "recorder",
  state: {
    // 录制用例数据
    recordStatus: false,
    recordLists: [],
    regex: ''
  },
  reducers: {
    save(state, {payload}) {
      return {
        ...state,
        ...payload,
      }
    },
    readRecord(state, {payload}) {
      return {
        ...state,
        recordLists: [...state.recordLists, {
          ...enrichRecord(payload.data, state.recordLists.length),
          __isLatestFlash: true,
        }]
      }
    }
  },
  effects: {

    * queryRecordStatus({payload}, {call, put}) {
      const res = yield call(queryRecordStatus, payload);
      if (auth.response(res)) {
        yield put({
          type: 'save',
          payload: {
            recordStatus: res.data.status,
            recordLists: res.data.data.map((v, idx) => enrichRecord(v, idx)),
            regex: res.data.regex,
          }
        })
      }
    },

    * startRecord({payload}, {call, put}) {
      yield put({
        type: 'save',
        payload: {
          recordLists: [],
        }
      })
      const res = yield call(startRecord, payload);
      if (auth.response(res, true)) {
        yield put({
          type: 'save',
          payload: {
            recordStatus: true,
            recordLists: [],
          }
        })
      }
    },

    * stopRecord({payload}, {call, put}) {
      const res = yield call(stopRecord, payload);
      if (auth.response(res, true)) {
        yield put({
          type: 'save',
          payload: {
            recordStatus: false,
          }
        })
      }
    },

    * generateCase({payload}, {call, put}) {
      const res = yield call(generateCase, payload);
      if (auth.response(res)) {
        return res
      }
      return false
    },

    * import({payload}, {call, put}) {
      const res = yield call(importFile, payload)
      if (auth.response(res)) {
        return res.data.map((v, index) => enrichRecord(v, index));
      }
      return [];
    },

    * remove({payload}, {call, put, select}) {
      const recorder = yield select(state => state.recorder)
      const res = yield call(removeRecord, payload)
      if (auth.response(res, true)) {
        const data = recorder.recordLists.filter((v, idx) => idx !== payload).map((item, k) => enrichRecord(item, k))
        yield put({
          type: "save",
          payload: {
            recordLists: data
          }
        })
      }
    },

    * removeBatch({payload}, {call, put}) {
      const res = yield call(removeRecords, payload)
      if (!auth.response(res, true)) {
        return false
      }
      yield put({
        type: 'queryRecordStatus',
      })
      return true
    }
  }
}
