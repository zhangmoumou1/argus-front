import request from '@/utils/request';
import CONFIG from '@/consts/config';
import auth from '@/utils/auth';

export async function listEnvironment(params) {
  return request(`${CONFIG.URL}/config/environment/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertEnvironment(params) {
  return request(`${CONFIG.URL}/config/environment/insert`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function updateEnvironment(params) {
  return request(`${CONFIG.URL}/config/environment/update`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function deleteEnvironment(params) {
  return request(`${CONFIG.URL}/config/environment/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}


export async function insertGConfig(params) {
  return request(`${CONFIG.URL}/config/gconfig/insert`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

// 获取gconfig列表
export async function listGConfig(params) {
  return request(`${CONFIG.URL}/config/gconfig/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

// 获取gconfig列表
export async function listDbConfig(params) {
  return request(`${CONFIG.URL}/config/dbconfig/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertDbConfig(params) {
  return request(`${CONFIG.URL}/config/dbconfig/insert`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function updateDbConfig(params) {
  return request(`${CONFIG.URL}/config/dbconfig/update`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function onTestDbConfig(params) {
  return request(`${CONFIG.URL}/config/dbconfig/connect`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function deleteDbConfig(params) {
  return request(`${CONFIG.URL}/config/dbconfig/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function updateGConfig(params) {
  return request(`${CONFIG.URL}/config/gconfig/update`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}


export async function deleteGConfig(params) {
  return request(`${CONFIG.URL}/config/gconfig/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

// redis配置
export async function listRedisConfig(params) {
  return request(`${CONFIG.URL}/config/redis/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertRedisConfig(params) {
  return request(`${CONFIG.URL}/config/redis/insert`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

/**
 * 获取网关地址
 * @param params
 * @returns {Promise<any>}
 */
export async function listGateway(params) {
  return request(`${CONFIG.URL}/config/gateway/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

/**
 * 添加服务地址
 * @param data
 * @returns {Promise<any>}
 */
export async function insertGateway(data) {
  return request(`${CONFIG.URL}/config/gateway/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

/**
 * 修改服务地址
 * @param data
 * @returns {Promise<any>}
 */
export async function updateGateway(data) {
  return request(`${CONFIG.URL}/config/gateway/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteGateway(params) {
  return request(`${CONFIG.URL}/config/gateway/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}


export async function updateRedisConfig(params) {
  return request(`${CONFIG.URL}/config/redis/update`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function deleteRedisConfig(params) {
  return request(`${CONFIG.URL}/config/redis/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function onlineRedisCommand(params) {
  return request(`${CONFIG.URL}/config/redis/command`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listMQConfig(params) {
  return request(`${CONFIG.URL}/config/mq/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function insertMQConfig(params) {
  return request(`${CONFIG.URL}/config/mq/insert`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function updateMQConfig(params) {
  return request(`${CONFIG.URL}/config/mq/update`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function deleteMQConfig(params) {
  return request(`${CONFIG.URL}/config/mq/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function testMQConnect(params) {
  return request(`${CONFIG.URL}/config/mq/connect`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function testMQConnectByForm(params) {
  return request(`${CONFIG.URL}/config/mq/connect/test`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function publishMQMessage(params) {
  return request(`${CONFIG.URL}/config/mq/publish`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function consumeMQMessage(params) {
  return request(`${CONFIG.URL}/config/mq/consume`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listMQConsumers(params) {
  return request(`${CONFIG.URL}/config/mq/consumers`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listKafkaTopics(params) {
  return request(`${CONFIG.URL}/config/mq/kafka/topics`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listKafkaTopicMessages(params) {
  return request(`${CONFIG.URL}/config/mq/kafka/topic/messages`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listKafkaTopicPartitions(params) {
  return request(`${CONFIG.URL}/config/mq/kafka/topic/partitions`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listKafkaConsumerGroups(params) {
  return request(`${CONFIG.URL}/config/mq/kafka/consumer-groups`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function getKafkaConsumerGroupDetail(params) {
  return request(`${CONFIG.URL}/config/mq/kafka/consumer-group/detail`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function listRabbitQueues(params) {
  return request(`${CONFIG.URL}/config/mq/rabbit/queues`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function rabbitGetMessages(params) {
  return request(`${CONFIG.URL}/config/mq/rabbit/get-messages`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function rabbitPurgeQueue(params) {
  return request(`${CONFIG.URL}/config/mq/rabbit/purge`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function rabbitDeleteQueue(params) {
  return request(`${CONFIG.URL}/config/mq/rabbit/delete-queue`, {
    method: 'POST',
    data: params,
    headers: auth.headers(),
  });
}

export async function uploadFile(params) {
  const formData = new FormData();
  formData.append("file", params.files[0].originFileObj)
  return request(`${CONFIG.URL}/oss/upload`, {
    method: 'POST',
    params: {filepath: params.filepath},
    data: formData,
    requestType: 'form',
    headers: auth.headers(false),
  });
}

export async function uploadKnowledgeFile(params) {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('kind', params.kind || 'file');
  return request(`${CONFIG.URL}/config/knowledge/upload`, {
    method: 'POST',
    data: formData,
    requestType: 'form',
    headers: auth.headers(false),
  });
}

export async function listFile() {
  return request(`${CONFIG.URL}/oss/list`, {
    method: 'GET',
    headers: auth.headers(),
  });
}

export async function deleteFile(params) {
  return request(`${CONFIG.URL}/oss/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function getSystemConfig() {
  return request(`${CONFIG.URL}/config/system`, {
    method: 'GET',
    headers: auth.headers(),
  });
}

export async function updateSystemConfig(data) {
  return request(`${CONFIG.URL}/config/system/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function getAiModelConfig() {
  return request(`${CONFIG.URL}/config/ai-model/config`, {
    method: 'GET',
    headers: auth.headers(),
  });
}

export async function updateAiModelConfig(data) {
  return request(`${CONFIG.URL}/config/ai-model/config/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function listKnowledge(params) {
  return request(`${CONFIG.URL}/config/knowledge/list`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listPublicKnowledge(params) {
  return request(`${CONFIG.URL}/config/knowledge/public/list`, {
    method: 'GET',
    params,
  });
}

export async function insertKnowledge(data) {
  return request(`${CONFIG.URL}/config/knowledge/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updateKnowledge(data) {
  return request(`${CONFIG.URL}/config/knowledge/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteKnowledge(params) {
  return request(`${CONFIG.URL}/config/knowledge/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}

export async function listKnowledgeCategory() {
  return request(`${CONFIG.URL}/config/knowledge/category/list`, {
    method: 'GET',
    headers: auth.headers(),
  });
}

export async function listPublicKnowledgeCategory() {
  return request(`${CONFIG.URL}/config/knowledge/category/public/list`, {
    method: 'GET',
  });
}

export async function insertKnowledgeCategory(data) {
  return request(`${CONFIG.URL}/config/knowledge/category/insert`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function updateKnowledgeCategory(data) {
  return request(`${CONFIG.URL}/config/knowledge/category/update`, {
    method: 'POST',
    data,
    headers: auth.headers(),
  });
}

export async function deleteKnowledgeCategory(params) {
  return request(`${CONFIG.URL}/config/knowledge/category/delete`, {
    method: 'GET',
    params,
    headers: auth.headers(),
  });
}
