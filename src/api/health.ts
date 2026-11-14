import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';

/** Response of `GET /health`. Replace with the type from `schema.d.ts` once the contract is generated. */
export interface HealthResponse {
  status: 'ok';
}

export const healthKeys = {
  all: ['health'] as const,
};

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}

export function useHealth() {
  return useQuery({ queryKey: healthKeys.all, queryFn: getHealth, retry: false });
}
