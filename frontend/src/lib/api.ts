import type {
  WorkspaceInfo,
  TicketResponse,
  TicketStatus,
  AdminLoginResponse,
  WorkspaceAdminInfo,
  Ticket,
  Escalation,
  ModelInfo,
  TrainMetrics,
  WorkspaceUser,
  DashboardStats,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sevak_token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('sevak_token')
    localStorage.removeItem('sevak_workspace')
    window.location.href = '/login'
    throw new ApiError('Unauthorized', 401)
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.detail || `Request failed with status ${res.status}`, res.status)
  }

  return res.json()
}

// === Public (no auth) ===

export async function getWorkspaceInfo(slug: string): Promise<WorkspaceInfo> {
  return request(`/api/workspace/${encodeURIComponent(slug)}`)
}

export async function submitTicket(data: {
  workspace: string
  name: string
  email: string
  message: string
}): Promise<TicketResponse> {
  return request('/api/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTicketStatus(slug: string, ticketId: string): Promise<TicketStatus> {
  return request(`/api/status/${encodeURIComponent(slug)}/${encodeURIComponent(ticketId)}`)
}

// === Auth ===

export async function login(slug: string, password: string): Promise<AdminLoginResponse> {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ slug, password }),
  })
}

export async function signup(data: {
  slug: string
  name: string
  profile: string
  password: string
  sector?: string
  business_description?: string
  contact_phone?: string
  contact_email?: string
}): Promise<AdminLoginResponse> {
  return request('/api/admin/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function logout(): Promise<void> {
  await request('/api/admin/logout', { method: 'POST' })
}

export async function getMe(): Promise<WorkspaceAdminInfo> {
  return request('/api/admin/me')
}

// === Admin: Tickets ===

export async function getTickets(): Promise<Ticket[]> {
  return request('/api/admin/tickets')
}

export async function updateTicket(
  ticketId: string,
  data: { status: string; action_taken?: string; updated_by?: string; reassigned_to?: string }
): Promise<Ticket> {
  return request(`/api/admin/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// === Admin: Escalations ===

export async function getEscalations(): Promise<Escalation[]> {
  return request('/api/admin/escalations')
}

export async function setEscalationEmail(email: string | null): Promise<{ success: boolean; escalation_email: string | null }> {
  return request('/api/admin/escalation-email', {
    method: 'PUT',
    body: JSON.stringify({ email }),
  })
}

// === Admin: Model ===

export async function getModelInfo(): Promise<ModelInfo> {
  return request('/api/admin/model')
}

export async function setActiveModel(useCustom: boolean): Promise<{ success: boolean }> {
  return request('/api/admin/model/active', {
    method: 'PUT',
    body: JSON.stringify({ use_custom: useCustom }),
  })
}

export async function trainModel(file: File): Promise<TrainMetrics> {
  const token = localStorage.getItem('sevak_token')
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/admin/train`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(data.detail || 'Training failed', res.status)
  }

  return res.json()
}

// === Admin: Team ===

export async function getTeam(): Promise<WorkspaceUser[]> {
  return request('/api/admin/team')
}

export async function addTeamMember(data: {
  email: string
  password: string
  role?: string
  display_name?: string
}): Promise<WorkspaceUser> {
  return request('/api/admin/team', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTeamMember(
  userId: number | string,
  data: { role?: string; is_active?: boolean }
): Promise<{ success: boolean }> {
  return request(`/api/admin/team/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function removeTeamMember(userId: number | string): Promise<{ success: boolean }> {
  return request(`/api/admin/team/${userId}`, {
    method: 'DELETE',
  })
}

// === Admin: Stats ===

export async function getDashboardStats(): Promise<DashboardStats> {
  return request('/api/admin/stats')
}
