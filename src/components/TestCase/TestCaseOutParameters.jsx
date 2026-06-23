import FormForModal from "@/components/ArgusForm/FormForModal";
import TooltipIcon from "@/components/Icon/TooltipIcon";
import NoRecord from "@/components/NotFound/NoRecord";
import fields from "@/consts/fields";
import auth from "@/utils/auth";
import { ExclamationCircleOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Modal, Row, Table } from "antd";
import React, { useState } from "react";

const SOURCE_MAP = {
  0: "Response: 正则",
  1: "Response: JSONPath",
  2: "Header: K/V",
  3: "Cookie: K/V",
  4: "响应状态码",
  5: "Body: 正则",
  6: "Body: JSONPath",
  7: "Request Header: K/V",
};

const normalizeRows = (rows = []) =>
  rows.map((item, index) => ({
    ...item,
    key: item?.key ?? item?.id ?? index,
  }));

export default ({ dispatch, testcase, caseId, createMode }) => {
  const [parameterModal, setParameterModal] = useState(false);
  const [record, setRecord] = useState({});
  const { outParameters = [] } = testcase;

  const saveRows = async (rows) => {
    await dispatch({
      type: "testcase/save",
      payload: {
        outParameters: normalizeRows(rows),
      },
    });
  };

  const validateValues = (values) => {
    if (!values.name) {
      return "请输入出参名";
    }
    if (values.source !== 4 && !values.expression) {
      return "请输入解析表达式";
    }
    if (![1, 2, 3, 4, 6, 7].includes(values.source) && !values.match_index) {
      return "请输入匹配项";
    }
    return "";
  };

  const onDeleteRemote = async (row) => {
    const res = await dispatch({
      type: "testcase/deleteTestCaseOutParameters",
      payload: { id: row.id },
    });
    if (res) {
      await saveRows(outParameters.filter((item) => item.id !== row.id));
    }
  };

  const onDeleteLocal = async (row) => {
    await saveRows(outParameters.filter((item) => item.key !== row.key));
  };

  const onSaveParameter = async (values) => {
    const payload = {
      ...values,
      name: String(values.name || "").trim(),
      expression: values.source === 4 ? "" : String(values.expression || "").trim(),
      match_index: [1, 2, 3, 4, 6, 7].includes(values.source) ? "" : String(values.match_index || "").trim(),
    };
    const errMsg = validateValues(payload);
    if (errMsg) {
      Modal.warning({ title: errMsg });
      return;
    }

    if (createMode) {
      let rows = [...outParameters];
      if (record.key !== undefined) {
        rows = rows.map((item) => (item.key === record.key ? { ...item, ...payload } : item));
      } else {
        const nextKey =
          rows.length === 0 ? 0 : Math.max(...rows.map((item) => Number(item?.key ?? -1))) + 1;
        rows.push({ ...payload, key: nextKey });
      }
      await saveRows(rows);
      setParameterModal(false);
      return;
    }

    let res;
    if (record.id) {
      res = await dispatch({
        type: "testcase/updateTestCaseOutParameters",
        payload: { ...payload, id: record.id },
      });
      if (auth.response(res, true)) {
        await saveRows(
          outParameters.map((item) =>
            item.id === record.id ? { ...item, ...res.data, key: item.key ?? item.id } : item,
          ),
        );
        setParameterModal(false);
      }
      return;
    }

    res = await dispatch({
      type: "testcase/insertTestCaseOutParameters",
      payload: { ...payload, case_id: caseId },
    });
    if (auth.response(res, true)) {
      await saveRows([...outParameters, { ...res.data, key: res.data.id ?? outParameters.length }]);
      setParameterModal(false);
    }
  };

  const columns = [
    {
      title: "#",
      key: "index",
      render: (_, __, index) => index + 1,
      width: 70,
    },
    {
      title: "出参名",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      render: (value) => SOURCE_MAP[value] || "-",
    },
    {
      title: (
        <span>
          解析表达式{" "}
          <TooltipIcon
            icon={<QuestionCircleOutlined />}
            title="JSONPath 从响应 JSON 中取值；正则用于文本匹配；响应状态码场景无需填写解析表达式。"
          />
        </span>
      ),
      dataIndex: "expression",
      key: "expression",
      render: (value, row) => (row.source === 4 ? "无需填写" : value || "-"),
    },
    {
      title: "第几个匹配项",
      dataIndex: "match_index",
      key: "match_index",
      render: (value, row) => ([1, 2, 3, 4, 6, 7].includes(row.source) ? "无需填写" : value || "-"),
    },
    {
      title: "操作",
      key: "ops",
      render: (_, row) => (
        <>
          <a
            onClick={() => {
              setRecord(row);
              setParameterModal(true);
            }}
          >
            编辑
          </a>
          <Divider type="vertical" />
          <a
            onClick={() => {
              Modal.confirm({
                title: "你确定要删除这条出参数据吗?",
                icon: <ExclamationCircleOutlined />,
                content: "删除后不可恢复，请谨慎操作。",
                okText: "确定",
                okType: "danger",
                cancelText: "点错了",
                onOk: async () => {
                  if (createMode) {
                    await onDeleteLocal(row);
                  } else {
                    await onDeleteRemote(row);
                  }
                },
              });
            }}
          >
            删除
          </a>
        </>
      ),
    },
  ];

  return (
    <Row gutter={8}>
      <Col span={24}>
        <FormForModal
          open={parameterModal}
          fields={fields.CaseOutParameters}
          title="用例出参"
          left={6}
          right={18}
          onFinish={onSaveParameter}
          onCancel={() => setParameterModal(false)}
          record={record}
        />
        <Row style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Button
              type="primary"
              onClick={() => {
                setRecord({ source: 1 });
                setParameterModal(true);
              }}
            >
              <PlusOutlined />
              添加出参
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={normalizeRows(outParameters)}
          rowKey={(row) => row.id ?? row.key}
          locale={{ emptyText: <NoRecord height={150} /> }}
          pagination={false}
        />
      </Col>
    </Row>
  );
};
