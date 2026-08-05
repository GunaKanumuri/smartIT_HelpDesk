import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'
import React from 'react'

describe('Modal component', () => {
  it('renders nothing when not open', () => {
    const { container } = render(<Modal onClose={vi.fn()}>Content</Modal>)
    expect(container.firstChild).toBeNull()
  })

  it('renders children and title when open', () => {
    render(<Modal open title="Test Modal" onClose={vi.fn()}>Modal Body</Modal>)
    expect(screen.getByText('Test Modal')).toBeDefined()
    expect(screen.getByText('Modal Body')).toBeDefined()
  })

  it('calls onClose when clicking backdrop', () => {
    const handleClose = vi.fn()
    render(<Modal open onClose={handleClose}>Content</Modal>)
    const backdrop = document.querySelector('.bg-black\\/60')
    if (backdrop) fireEvent.click(backdrop)
    expect(handleClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when pressing Escape key', () => {
    const handleClose = vi.fn()
    render(<Modal open onClose={handleClose}>Content</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledOnce()
  })
})
