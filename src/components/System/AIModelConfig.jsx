import {Button, Empty, Form, Input, List, Modal, Popconfirm, Select, Space, Switch, Tag, Typography, message} from "antd";
import {DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined} from "@ant-design/icons";
import {useEffect, useMemo, useState} from "react";

const {Text} = Typography;

const localProviderFallbacks = [
  {
    provider_type: "kimi",
    provider_name: "Kimi",
    base_url: "https://api.moonshot.cn/v1",
    model: "kimi-k2.6",
    model_options: ["kimi-k2.6"],
    builtin: true,
  },
  {
    provider_type: "qwen",
    provider_name: "Qwen",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3.6-plus",
    model_options: ["qwen3.6-plus"],
    builtin: true,
  },
  {
    provider_type: "deepseek",
    provider_name: "DeepSeek",
    base_url: "https://api.deepseek.com",
    model: "deepseek-v4-pro",
    model_options: ["deepseek-v4-pro", "deepseek-v4-flash"],
    builtin: true,
  },
  {
    provider_type: "openai",
    provider_name: "OpenAI",
    base_url: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    model_options: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"],
    builtin: true,
  },
  {
    provider_type: "minimax",
    provider_name: "MiniMax",
    base_url: "https://api.minimaxi.com/anthropic",
    model: "",
    model_options: [],
    builtin: true,
  },
  {
    provider_type: "zhipu_glm",
    provider_name: "ZhiPu GLM",
    base_url: "https://open.bigmodel.cn",
    model: "",
    model_options: [],
    builtin: true,
  },
  {
    provider_type: "xiaomi_mimo",
    provider_name: "XiaoMi MiMo",
    base_url: "https://api.xiaomimimo.com/anthropic",
    model: "",
    model_options: [],
    builtin: true,
  },
  {
    provider_type: "custom",
    provider_name: "自定义供应商",
    base_url: "",
    model: "",
    model_options: [],
    builtin: false,
  },
];

const createModelConfigId = () => `ai_model_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeProviderOptions = (providers) => {
  const fallbackMap = localProviderFallbacks.reduce((acc, item) => {
    acc[item.provider_type] = item;
    return acc;
  }, {});
  const remoteList = Array.isArray(providers) ? providers : [];
  const source = remoteList.length
    ? [
        ...localProviderFallbacks.map((item) => {
          const remote = remoteList.find((provider) => String(provider?.provider_type || provider?.provider || "").trim() === item.provider_type);
          if (!remote) return item;
          return {
            ...item,
            ...remote,
            model_options: Array.from(
              new Set([...(item.model_options || []), ...((remote?.model_options || remote?.models || []).map((model) => String(model || "").trim()).filter(Boolean))]),
            ),
          };
        }),
        ...remoteList.filter((item) => !fallbackMap[String(item?.provider_type || item?.provider || "").trim()]),
      ]
    : localProviderFallbacks;
  return source.map((item) => ({
    provider_type: String(item?.provider_type || item?.provider || "custom").trim() || "custom",
    provider_name: String(item?.provider_name || item?.name || "自定义供应商").trim() || "自定义供应商",
    base_url: String(item?.base_url || "").trim(),
    model: String(item?.model || "").trim(),
    model_options: Array.from(new Set((item?.model_options || item?.models || []).map((model) => String(model || "").trim()).filter(Boolean))),
    builtin: item?.builtin !== false && String(item?.provider_type || item?.provider || "custom") !== "custom",
  }));
};

const buildProviderConfigFromPreset = (preset) => ({
  id: createModelConfigId(),
  provider_type: preset.provider_type,
  provider: preset.provider_type,
  provider_name: preset.provider_name,
  name: preset.provider_name,
  base_url: preset.base_url,
  model: preset.model,
  model_options: Array.isArray(preset.model_options) ? [...preset.model_options] : [],
  api_key: "",
  api_key_masked: "",
  has_api_key: false,
  enabled: false,
});

const normalizeDraftConfig = (config) => ({
  active_model_id: String(config?.active_model_id || "").trim(),
  providers: Array.isArray(config?.providers) ? config.providers.map((item) => ({
    ...item,
    id: String(item?.id || createModelConfigId()),
    provider_type: String(item?.provider_type || item?.provider || "custom").trim() || "custom",
    provider: String(item?.provider_type || item?.provider || "custom").trim() || "custom",
    provider_name: String(item?.provider_name || item?.name || "自定义供应商").trim() || "自定义供应商",
    name: String(item?.provider_name || item?.name || "自定义供应商").trim() || "自定义供应商",
    base_url: String(item?.base_url || "").trim(),
    model: String(item?.model || "").trim(),
    model_options: Array.from(new Set((item?.model_options || item?.models || []).map((model) => String(model || "").trim()).filter(Boolean))),
    api_key: "",
    api_key_masked: String(item?.api_key_masked || ""),
    has_api_key: Boolean(item?.has_api_key),
    enabled: Boolean(item?.enabled),
  })) : [],
});

const buildConfigToSave = (draft) => ({
  active_model_id: draft.active_model_id,
  providers: (draft.providers || []).map((item) => ({
    id: item.id,
    provider_type: item.provider_type,
    provider_name: String(item.provider_name || "").trim(),
    base_url: String(item.base_url || "").trim(),
    model: String(item.model || "").trim(),
    model_options: Array.from(new Set((item.model_options || []).map((model) => String(model || "").trim()).filter(Boolean))),
    api_key: String(item.api_key || "").trim(),
  })),
});

const buildReadonlyItems = (item) => ([
  {label: "供应商名称", value: item.provider_name || "-"},
  {label: "供应商类型", value: item.provider_type || "-"},
  {label: "模型版本", value: item.model || "-"},
  {label: "请求地址", value: item.base_url || "-"},
  {label: "API Key", value: item.api_key_masked || (item.has_api_key ? "已配置" : "未配置")},
]);

export default ({dispatch, aiModelConfig, aiModelProviders, loading}) => {
  const [draft, setDraft] = useState({active_model_id: "", providers: []});
  const [modalState, setModalState] = useState({open: false, mode: "create", id: ""});
  const [form] = Form.useForm();

  const providerOptions = useMemo(() => normalizeProviderOptions(aiModelProviders), [aiModelProviders]);
  const providerPresetMap = useMemo(
    () => providerOptions.reduce((acc, item) => {
      acc[item.provider_type] = item;
      return acc;
    }, {}),
    [providerOptions],
  );

  useEffect(() => {
    dispatch({type: "gconfig/fetchAiModelConfig"});
    dispatch({type: "gconfig/fetchAiModelProviders"});
  }, []);

  useEffect(() => {
    const normalized = normalizeDraftConfig(aiModelConfig);
    if (!normalized.active_model_id && normalized.providers[0]) {
      normalized.active_model_id = normalized.providers[0].id;
    }
    normalized.providers = normalized.providers.map((item) => ({
      ...item,
      enabled: item.id === normalized.active_model_id,
    }));
    setDraft(normalized);
  }, [aiModelConfig]);

  const currentItem = useMemo(
    () => (draft.providers || []).find((item) => item.id === modalState.id) || null,
    [draft.providers, modalState.id],
  );

  useEffect(() => {
    if (!modalState.open) return;
    if (modalState.mode === "create") {
      const preset = providerOptions[0] || localProviderFallbacks[0];
      form.setFieldsValue({
        provider_type: preset.provider_type,
        provider_name: preset.provider_name,
        base_url: preset.base_url,
        model: "",
        api_key: "",
        model_options: preset.model_options || [],
      });
      return;
    }
    if (modalState.mode === "edit" && currentItem) {
      form.setFieldsValue({
        provider_type: currentItem.provider_type,
        provider_name: currentItem.provider_name,
        base_url: currentItem.base_url,
        model: currentItem.model || "",
        api_key: currentItem.api_key,
        model_options: currentItem.model_options || [],
      });
    }
  }, [modalState, currentItem, form, providerOptions]);

  const persistDraft = async (nextDraft, successText) => {
    const result = await dispatch({
      type: "gconfig/updateAiModelConfig",
      payload: buildConfigToSave(nextDraft),
    });
    if (result === false) {
      return false;
    }
    if (successText) {
      message.success(successText);
    }
    return true;
  };

  const handleProviderTypeChange = (providerType) => {
    const preset = providerPresetMap[providerType] || providerPresetMap.custom || localProviderFallbacks[localProviderFallbacks.length - 1];
    form.setFieldsValue({
      provider_type: preset.provider_type,
      provider_name: preset.provider_name,
      base_url: preset.base_url,
      model: "",
      model_options: preset.model_options || [],
    });
  };

  const openCreate = () => {
    setModalState({open: true, mode: "create", id: ""});
  };

  const openDetail = (id) => {
    setModalState({open: true, mode: "detail", id});
  };

  const openEdit = (id) => {
    setModalState({open: true, mode: "edit", id});
  };

  const closeModal = () => {
    setModalState({open: false, mode: "create", id: ""});
    form.resetFields();
  };

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (error) {
      return;
    }
    const nextModel = String(values.model || "").trim();
    const nextModelOptions = Array.from(new Set([...(values.model_options || []), nextModel].map((model) => String(model || "").trim()).filter(Boolean)));
    const nextItem = {
      id: modalState.mode === "create" ? createModelConfigId() : currentItem.id,
      provider_type: values.provider_type,
      provider: values.provider_type,
      provider_name: values.provider_name,
      name: values.provider_name,
      base_url: values.base_url,
      model: nextModel,
      model_options: nextModelOptions,
      api_key: values.api_key || "",
      api_key_masked: modalState.mode === "edit" ? currentItem?.api_key_masked || "" : "",
      has_api_key: modalState.mode === "edit" ? currentItem?.has_api_key || false : false,
      enabled: modalState.mode === "edit" ? currentItem?.enabled || false : false,
    };
    const nextDraft = modalState.mode === "create"
      ? {
          ...draft,
          providers: [nextItem, ...(draft.providers || [])],
        }
      : {
          ...draft,
          providers: (draft.providers || []).map((item) => item.id === currentItem.id ? {...currentItem, ...nextItem} : item),
        };
    const ok = await persistDraft(nextDraft, modalState.mode === "create" ? "模型配置已新增" : "模型配置已保存");
    if (ok) {
      closeModal();
    }
  };

  const handleEnable = async (id, checked) => {
    if (!checked) {
      message.info("平台始终需要保留一个启用模型");
      return;
    }
    const nextDraft = {
      ...draft,
      active_model_id: id,
      providers: (draft.providers || []).map((item) => ({
        ...item,
        enabled: item.id === id,
      })),
    };
    await persistDraft(nextDraft, "启用模型已更新，其他模型已自动关闭");
  };

  const handleDelete = async (id) => {
    if ((draft.providers || []).length <= 1) {
      message.warning("请至少保留一个模型配置");
      return;
    }
    const nextProviders = (draft.providers || []).filter((item) => item.id !== id);
    const nextActiveId = draft.active_model_id === id ? nextProviders[0]?.id || "" : draft.active_model_id;
    const nextDraft = {
      ...draft,
      active_model_id: nextActiveId,
      providers: nextProviders.map((item) => ({
        ...item,
        enabled: item.id === nextActiveId,
      })),
    };
    const ok = await persistDraft(nextDraft, "模型配置已删除");
    if (ok && modalState.id === id) {
      closeModal();
    }
  };

  const renderSummary = (item) => (
    <Space size={[8, 8]} wrap>
      <Tag color={item.enabled ? "green" : "default"}>{item.enabled ? "已启用" : "未启用"}</Tag>
      <Tag color="blue">{item.provider_type || "custom"}</Tag>
      <Text type="secondary">模型：{item.model || "-"}</Text>
      <Text type="secondary">API Key：{item.has_api_key || item.api_key_masked ? "已配置" : "未配置"}</Text>
    </Space>
  );

  return (
    <>
      <Space wrap style={{marginBottom: 16}}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增
        </Button>
      </Space>

      {(draft.providers || []).length === 0 ? (
        <Empty description="暂未配置模型供应商" />
      ) : (
        <List
          itemLayout="horizontal"
          bordered
          dataSource={draft.providers || []}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Switch
                  key="enable"
                  checked={item.enabled}
                  checkedChildren="已启用"
                  unCheckedChildren="启用"
                  loading={loading.effects["gconfig/updateAiModelConfig"]}
                  onChange={(checked) => handleEnable(item.id, checked)}
                />,
                <Button key="detail" type="link" icon={<EyeOutlined />} onClick={() => openDetail(item.id)}>
                  详情
                </Button>,
                <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openEdit(item.id)}>
                  编辑
                </Button>,
                <Popconfirm key="delete" title="确认删除这条模型配置？" onConfirm={() => handleDelete(item.id)}>
                  <Button danger type="link" icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={(
                  <Space size={8} wrap>
                    <span>{item.provider_name || "模型配置"}</span>
                    {renderSummary(item)}
                  </Space>
                )}
                description={item.base_url || "未配置请求地址"}
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        width={640}
        open={modalState.open}
        title={modalState.mode === "create" ? "新增模型配置" : modalState.mode === "edit" ? "编辑模型配置" : "模型配置详情"}
        onCancel={closeModal}
        onOk={modalState.mode === "detail" ? closeModal : handleSave}
        okText={modalState.mode === "detail" ? "关闭" : "保存"}
        confirmLoading={loading.effects["gconfig/updateAiModelConfig"]}
        destroyOnClose
      >
        {modalState.mode === "detail" ? (
          <Space direction="vertical" size={16} style={{width: "100%"}}>
            {buildReadonlyItems(currentItem || {}).map((entry) => (
              <div key={entry.label}>
                <div style={{color: "#6b7280", marginBottom: 6}}>{entry.label}</div>
                <div style={{padding: "10px 12px", border: "1px solid #f0f0f0", borderRadius: 8, background: "#fafafa"}}>
                  {entry.value}
                </div>
              </div>
            ))}
          </Space>
        ) : (
          <Form layout="vertical" form={form}>
            <Form.Item label="供应商" name="provider_type" rules={[{required: true, message: "请选择供应商"}]}>
              <Select
                options={providerOptions.map((option) => ({
                  label: option.provider_type === "custom" ? "自定义供应商" : option.provider_name,
                  value: option.provider_type,
                }))}
                onChange={handleProviderTypeChange}
              />
            </Form.Item>
            <Form.Item label="供应商名称" name="provider_name" rules={[{required: true, message: "请输入供应商名称"}]}>
              <Input placeholder="请输入供应商名称" />
            </Form.Item>
            <Form.Item label="API Key" name="api_key" extra={modalState.mode === "edit" && currentItem?.has_api_key ? `${currentItem.api_key_masked || "已配置API Key"}，留空则保持不变` : ""}>
              <Input.Password placeholder="请输入 API Key" />
            </Form.Item>
            <Form.Item label="请求地址" name="base_url" rules={[{required: true, message: "请输入请求地址"}]}>
              <Input placeholder="请输入兼容 OpenAI Chat Completions 的请求地址" />
            </Form.Item>
            <Form.Item label="模型版本" name="model" rules={[{required: true, message: "请输入模型版本"}]}>
              <Input placeholder="请输入模型版本" />
            </Form.Item>
            <Form.Item name="model_options" hidden>
              <Input />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
};
