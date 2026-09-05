import type {
  ContentItemDto,
  CreateContentItemInput,
  DashboardDto,
  PublicContentItemDto,
  ShareContentItemResult,
  UpdateContentItemInput,
} from '@starter/contracts'

export type TokenProvider = () => Promise<string | null>

async function responseError(response: Response): Promise<Error> {
  const body = (await response.json().catch(() => null)) as {
    error?: string
  } | null
  return new Error(body?.error ?? `API request failed (${response.status})`)
}

export function createApiClient(baseUrl: string, getToken: TokenProvider) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken()
    if (!token) throw new Error('Authentication required')

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    })
    if (!response.ok) throw await responseError(response)
    return response.json() as Promise<T>
  }

  return {
    dashboard: () => request<DashboardDto>('/v1/dashboard'),
    items: () => request<ContentItemDto[]>('/v1/items'),
    item: (id: string) => request<ContentItemDto>(`/v1/items/${id}`),
    createItem: (input: CreateContentItemInput) =>
      request<ContentItemDto>('/v1/items', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    updateItem: (id: string, input: UpdateContentItemInput) =>
      request<ContentItemDto>(`/v1/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    shareItem: (id: string) =>
      request<ShareContentItemResult>(`/v1/items/${id}/share`, {
        method: 'POST',
      }),
    revokeItem: (id: string) =>
      request<ContentItemDto>(`/v1/items/${id}/share`, { method: 'DELETE' }),
    archiveItem: (id: string) =>
      request<ContentItemDto>(`/v1/items/${id}/archive`, { method: 'POST' }),
  }
}

export async function fetchPublicItem(baseUrl: string, shareToken: string) {
  const response = await fetch(`${baseUrl}/public/v1/items/${shareToken}`)
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<PublicContentItemDto>
}
