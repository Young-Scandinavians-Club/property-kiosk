import useSWR from 'swr';

import { api } from '@/api';
import type { PropertyInfo, PropertySlug } from '@/api';

export function usePropertyInfo(property: PropertySlug = 'tahoe') {
  const { data, error, isLoading, mutate } = useSWR(['propertyInfo', property], () =>
    api.propertyInfo(property).then((res) => res.data)
  );

  return {
    data: data as PropertyInfo | undefined,
    error,
    isLoading,
    mutate,
  };
}
