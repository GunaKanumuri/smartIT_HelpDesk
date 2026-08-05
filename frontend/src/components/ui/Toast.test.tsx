import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast'
import React from 'react'

describe('Toast system', () => {
  it('throws error when useToast is used outside ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used within ToastProvider')
  })

  it('adds and renders toast message', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    )

    const { result } = renderHook(() => useToast(), { wrapper })

    act(() => {
      result.current.toast('Ticket updated successfully', 'success')
    })

    // The toast message should be visible in document
    const toast = document.querySelector('.fixed')
    expect(toast?.textContent).toContain('Ticket updated successfully')
  })
})
