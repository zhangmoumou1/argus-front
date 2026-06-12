import type { ApiResponse, PagePayload } from '@/types/platformTask';

export function unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
  if (
    response &&
    typeof response === 'object' &&
    'code' in response &&
    'data' in response
  ) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
}

export function unwrapPagePayload<T>(response: ApiResponse<PagePayload<T>> | PagePayload<T>): PagePayload<T> {
  const data = unwrapApiResponse<PagePayload<T>>(response);
  return {
    list: Array.isArray(data?.list) ? data.list : [],
    total: Number(data?.total || 0),
    page: Number(data?.page || 1),
    size: Number(data?.size || 20),
  };
}
