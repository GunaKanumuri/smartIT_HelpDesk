/**
 * =============================================================================
 * types/customer.ts
 *
 * AUDIENCE: End-User (Customer)
 *
 * TABLE OF CONTENTS
 * -----------------
 * 1. WORKSPACE INFO   — Public workspace lookup
 * 2. SUBMISSION       — Ticket submission request + response
 * 3. STATUS           — Public ticket status tracking
 * =============================================================================
 */

// =============================================================================
// region 1. WORKSPACE INFO
// =============================================================================

export interface WorkspaceInfo {
  name: string
  sector: string
  sector_name: string
  business_description: string
  contact_phone: string
  contact_email: string
}
// endregion

// =============================================================================
// region 2. SUBMISSION
// =============================================================================

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
// endregion

// =============================================================================
// region 3. STATUS
// =============================================================================

export interface TicketStatus {
  ticket_id: string
  status: string
  category: string
  urgency: string
  created_at: string
  workspace_name: string
  sector?: string
  sector_name?: string
}
// endregion
