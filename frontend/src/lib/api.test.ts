import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from './api'

// Global fetch mock
const globalFetch = vi.fn()
global.fetch = globalFetch

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('getWorkspaceInfo fetches workspace details', async () => {
    const mockData = { name: 'Acme Corp', sector: 'saas' }
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const result = await api.getWorkspaceInfo('acme')

    expect(globalFetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/workspace/acme',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    )
    expect(result).toEqual(mockData)
  })

  it('submitTicket sends POST request with body', async () => {
    const submissionData = {
      workspace: 'acme',
      name: 'John',
      email: 'john@example.com',
      message: 'Network issue in office',
    }
    const mockResponse = { success: true, ticket_id: 'TCK1001' }

    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await api.submitTicket(submissionData)

    expect(globalFetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/submit',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(submissionData),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('attaches Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('sevak_token', 'test_token_xyz')

    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    await api.getTickets()

    expect(globalFetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/admin/tickets',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test_token_xyz',
        }),
      })
    )
  })

  it('throws ApiError on non-ok response', async () => {
    globalFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Workspace not found' }),
    })

    await expect(api.getWorkspaceInfo('unknown')).rejects.toThrow('Workspace not found')
  })
})
