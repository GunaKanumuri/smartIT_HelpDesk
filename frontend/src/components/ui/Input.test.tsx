import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'
import React from 'react'

describe('Input component', () => {
  it('renders label correctly', () => {
    render(<Input label="Email Address" />)
    expect(screen.getByLabelText('Email Address')).toBeDefined()
  })

  it('shows error message', () => {
    render(<Input error="Invalid email" />)
    expect(screen.getByText('Invalid email')).toBeDefined()
  })

  it('shows hint text', () => {
    render(<Input hint="Use your work email" />)
    expect(screen.getByText('Use your work email')).toBeDefined()
  })

  it('handles change events', () => {
    const handleChange = vi.fn()
    render(<Input label="Name" onChange={handleChange} />)
    const input = screen.getByLabelText('Name')
    fireEvent.change(input, { target: { value: 'John Doe' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies error classes to input', () => {
    render(<Input error="Error" placeholder="Test" />)
    const input = screen.getByPlaceholderText('Test')
    expect(input).toHaveClass('border-red-500/50')
  })
})
