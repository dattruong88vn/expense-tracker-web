import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import type { HealthResponse } from './types';

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
