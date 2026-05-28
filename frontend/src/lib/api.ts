import type { User, Task, CreateTaskPayload, UpdateTaskPayload } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

// Client-side API client for use in client components
export function createApiClient(accessToken: string | null) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }

  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`)
    }

    return res.json()
  }

  return {
    // Tasks
    getTasks: (params?: {
      status?: string
      priority?: string
      search?: string
    }) => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set('status', params.status)
      if (params?.priority) searchParams.set('priority', params.priority)
      if (params?.search) searchParams.set('search', params.search)
      const qs = searchParams.toString()
      return request<{ data: Task[] }>(`/api/tasks${qs ? `?${qs}` : ''}`)
    },

    getTask: (id: string) =>
      request<{ data: Task }>(`/api/tasks/${id}`),

    createTask: (payload: CreateTaskPayload) =>
      request<{ data: Task; message: string }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    updateTask: (id: string, payload: UpdateTaskPayload) =>
      request<{ data: Task; message: string }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    updateTaskStatus: (id: string, status: string) =>
      request<{ data: Task; message: string }>(`/api/tasks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    deleteTask: (id: string) =>
      request<{ message: string }>(`/api/tasks/${id}`, {
        method: 'DELETE',
      }),

    // Users
    getUsers: () =>
      request<{ data: User[] }>('/api/users'),

    getMe: () =>
      request<{ data: User }>('/api/users/me'),
  }
}
