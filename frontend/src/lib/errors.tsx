/**
 * =============================================================================
 * lib/errors.tsx
 *
 * TABLE OF CONTENTS
 * -----------------
 * 1. ERROR UTILITIES      — Human-friendly error messages from API failures
 * 2. useApiError HOOK      — Wire any promise into loading/error state with a message
 * 3. ErrorBanner COMPONENT — Reusable inline error display for all audiences
 * =============================================================================
 */

import { useCallback, useState } from 'react'

// =============================================================================
// region 1. ERROR UTILITIES
// =============================================================================

/** Convert any thrown value into a human-friendly message. */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.detail === 'string') return e.detail
    if (typeof e.message === 'string') return e.message
    if (typeof e.error === 'string') return e.error
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

/** Build a user-friendly summary for ticket submission results. */
export function summarizeTicketResponse(res: {
  success?: boolean
  duplicate?: boolean
  relevant?: boolean
  ticket_id?: string
  existing_ticket_id?: string
  message?: string
}): string {
  if (res?.message) return res.message
  if (res?.ticket_id) return `Your issue was logged. Ticket: ${res.ticket_id}`
  if (res?.duplicate && res?.existing_ticket_id) {
    return `This matches an existing ticket (${res.existing_ticket_id}). We've noted it.`
  }
  return 'We received your request.'
}
// endregion

// =============================================================================
// region 2. useApiError HOOK
// =============================================================================

/**
 * Run an async API call with standard loading + error state.
 * Every failure surfaces a human-readable message — no silent failures.
 *
 * @example
 *   const { loading, error, run } = useApiError()
 *   const handleSave = () => run(() => updateTicket(...))
 */
export function useApiError() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(getErrorMessage(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, run, clearError }
}
// endregion

// =============================================================================
// region 3. ErrorBanner COMPONENT
// =============================================================================

/**
 * Inline, audience-agnostic error banner. Use it in any page/form to
 * display the error state from useApiError.
 */
export function ErrorBanner({ message, onDismiss }: { message: string | null; onDismiss?: () => void }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start justify-between gap-3"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400/70 hover:text-red-400 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  )
}
// endregion
