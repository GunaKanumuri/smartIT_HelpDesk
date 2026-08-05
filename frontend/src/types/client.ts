/**
 * =============================================================================
 * types/client.ts
 *
 * AUDIENCE: Client Admin/Staff (workspace owners + team)
 *
 * TABLE OF CONTENTS
 * -----------------
 * 1. WORKSPACE ADMIN   — Authenticated workspace info
 * 2. TICKET            — Ticket record + update payload
 * 3. ESCALATION        — Escalation audit trail
 * 4. MODEL & TRAINING  — ML model info + train metrics
 * 5. TEAM              — Workspace users / team members
 * 6. DASHBOARD STATS   — Workspace metrics
 * =============================================================================
 */

// =============================================================================
// region 1. WORKSPACE ADMIN
// =============================================================================

export interface WorkspaceAdminInfo {
  id: number
  slug: string
  name: string
  profile: string
  sector: string
  business_description: string
  contact_phone: string
  contact_email: string
  ticket_prefix: string
  uses_custom_model: boolean
  escalation_email: string | null
}

export interface AdminLoginResponse {
  token: string
  workspace: WorkspaceAdminInfo
}
// endregion

// =============================================================================
// region 2. TICKET
// =============================================================================

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
  assigned_to_user_id: number | null
  duplicate_count: number
  last_duplicate_at: string | null
}
// endregion

// =============================================================================
// region 3. ESCALATION
// =============================================================================

export interface Escalation {
  ticket_id: string
  created_at: string
  reason: string
  channel: string
  recipient: string | null
  status: string
  detail: string | null
}
// endregion

// =============================================================================
// region 4. MODEL & TRAINING
// =============================================================================

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
// endregion

// =============================================================================
// region 5. TEAM
// =============================================================================

export interface WorkspaceUser {
  id: number | string
  workspace_id: number
  email: string
  display_name: string
  role: string
  is_active: boolean | number
  created_at: string
  last_login_at: string | null
}
// endregion

// =============================================================================
// region 6. DASHBOARD STATS
// =============================================================================

export interface DashboardStats {
  total_tickets: number
  open_tickets: number
  high_urgency: number
  needs_review: number
  avg_confidence: number
  total_users: number
}
// endregion
