import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth'
import React from 'react'

// Mock the API module
vi.mock('@/lib/api', () => ({
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
}))

import * as api from '@/lib/api'

const mockedApi = api as any

function TestComponent() {
  const { workspace, token, login, signup, logout } = useAuth()
  return (
    <div>
      <div data-testid="workspace">{workspace?.slug || 'none'}</div>
      <div data-testid="token">{token || 'none'}</div>
      <button onClick={() => login('test-ws', 'password123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button
        onClick={() =>
          signup({
            slug: 'new-ws',
            name: 'New Co',
            profile: 'customer_support',
            password: 'password123',
          })
        }
      >
        Signup
      </button>
    </div>
  )
}

describe('AuthProvider integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('logs in and stores token + workspace', async () => {
    mockedApi.login.mockResolvedValueOnce({
      token: 'abc123',
      workspace: { slug: 'test-ws', name: 'Test WS' },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('abc123')
      expect(screen.getByTestId('workspace').textContent).toBe('test-ws')
    })

    expect(localStorage.getItem('sevak_token')).toBe('abc123')
  })

  it('rehydrates session from localStorage on mount', async () => {
    localStorage.setItem('sevak_token', 'stored-token')
    localStorage.setItem('sevak_workspace', JSON.stringify({ slug: 'stored-ws' }))

    mockedApi.getMe.mockResolvedValueOnce({ slug: 'stored-ws', name: 'Stored' })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('stored-token')
      expect(screen.getByTestId('workspace').textContent).toBe('stored-ws')
    })
  })

  it('logs out and clears stored session', async () => {
    localStorage.setItem('sevak_token', 'token-to-clear')
    localStorage.setItem('sevak_workspace', JSON.stringify({ slug: 'ws' }))
    mockedApi.getMe.mockResolvedValueOnce({ slug: 'ws' })

    mockedApi.logout.mockResolvedValueOnce({})

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => screen.getByText('Logout'))
    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('none')
      expect(screen.getByTestId('workspace').textContent).toBe('none')
    })

    expect(localStorage.getItem('sevak_token')).toBeNull()
  })

  it('signs up a new workspace', async () => {
    mockedApi.signup.mockResolvedValueOnce({
      token: 'signup-token',
      workspace: { slug: 'new-ws', name: 'New Co' },
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Signup'))

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('signup-token')
      expect(screen.getByTestId('workspace').textContent).toBe('new-ws')
    })
  })
})
