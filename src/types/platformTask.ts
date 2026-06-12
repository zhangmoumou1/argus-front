export type ApiResponse<T = unknown> = {
  code: number;
  msg: string;
  data: T;
};

export type PagePayload<T = unknown> = {
  list: T[];
  total: number;
  page: number;
  size: number;
};

export type PlatformTaskType =
  | 'api_test_run'
  | 'ui_test_run'
  | 'performance_test_run'
  | 'ai_functional_case'
  | 'notification';

export type PlatformTaskStatus =
  | 'queued'
  | 'claimed'
  | 'running'
  | 'cancelling'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'skipped'
  | 'partial_success';

export type PlatformResultStatus =
  | 'none'
  | 'test_success'
  | 'test_failed'
  | 'partial_success'
  | 'skipped';

export type PlatformTask = {
  id: number;
  task_type: PlatformTaskType;
  biz_id: number;
  biz_type: string;
  project_id: number;
  plan_id: number;
  resource_key: string;
  status: PlatformTaskStatus;
  result_status: PlatformResultStatus;
  stage: string;
  stage_text: string;
  progress: number;
  priority: number;
  retry_count: number;
  max_retries: number;
  queue_name: string;
  error_message: string;
  started_at?: string;
  finished_at?: string;
  created_at?: string;
  updated_at?: string;
};
