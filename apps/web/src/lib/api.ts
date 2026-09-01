// biome-ignore format: The package scope length changes during initialization.
import { createApiClient, fetchPublicItem } from '@starter/api-client'
import { useAuth } from '@starter/auth/react'
import { useMemo } from 'react'

const apiUrl = import.meta.env.VITE_API_URL
if (!apiUrl) throw new Error('Missing VITE_API_URL')

export function useApi() {
  const { getToken } = useAuth()
  return useMemo(() => createApiClient(apiUrl, getToken), [getToken])
}

export const publicApi = {
  item: (shareToken: string) => fetchPublicItem(apiUrl, shareToken),
}
