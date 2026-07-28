export interface WorkspaceInfo {
  name: string
  sector: string
  sector_name: string
  business_description: string
  contact_phone: string
  contact_email: string
}

export interface TicketSubmission {
  workspace: string
  name: string
  email: string
  message: string
}

export interface TicketResponse {
  success: boolean
  ticket_id?: string
  category?: string
  urgency?: string
  message: string
  duplicate?: boolean
  existing_ticket_id?: string
}

export interface TicketStatus {
  ticket_id: string
  status: string
  category: string
  urgency: string
  created_at: string
  workspace_name: string
}

export interface WorkspaceAdminInfo {
  id: number
  slug: string
  name: string
  profile: string
  sector: string
  business_description: string
  contact_phone: string
  contact_email: string
  uses_custom_model: boolean
  escalation_email: string | null
}

export interface AdminLoginResponse {
  token: string
  workspace: WorkspaceAdminInfo
}

export interface Ticket {
  ticket_id: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  user_id: string
  user_email: string
  issue_description: string
  category: string
  confidence: number
  secondary_category: string | null
  secondary_confidence: number | null
  raw_category: string | null
  urgency: string
  status: string
  action_taken: string
  updated_by: string
  reassigned_to: string
  duplicate_count: number
  last_duplicate_at: string | null
}

export interface Escalation {
  ticket_id: string
  created_at: string
  reason: string
  channel: string
  recipient: string | null
  status: string
  detail: string | null
}

export interface ModelInfo {
  label: string
  categories: string[]
  accuracy: number | null
  is_custom_active: boolean
  has_custom_model: boolean
  custom_metrics: Record<string, any> | null
}

export interface TrainMetrics {
  workspace_slug: string
  test_accuracy: number
  evaluation_method: string
  classification_report: Record<string, any>
  n_samples: number
  categories: string[]
}

export interface WorkspaceUser {
  id: number
  workspace_id: number
  email: string
  display_name: string
  role: string
  is_active: number
  created_at: string
  last_login_at: string | null
}

export interface DashboardStats {
  total_tickets: number
  open_tickets: number
  high_urgency: number
  needs_review: number
  avg_confidence: number
  total_users: number
}
