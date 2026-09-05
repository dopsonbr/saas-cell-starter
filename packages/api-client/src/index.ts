import type {
  CreateRecordInput,
  DashboardDto,
  RecordDto,
} from '@starter/contracts'

export type TokenProvider = () => Promise<string | null>

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

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      throw new Error(body?.error ?? `API request failed (${response.status})`)
    }
    return response.json() as Promise<T>
  }

  return {
    dashboard: () => request<DashboardDto>('/v1/dashboard'),
    records: () => request<RecordDto[]>('/v1/records'),
    createRecord: (input: CreateRecordInput) =>
      request<RecordDto>('/v1/records', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  }
}
