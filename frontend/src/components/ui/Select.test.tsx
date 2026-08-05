import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from './Select'
import { Textarea } from './Textarea'
import React from 'react'

describe('Select component', () => {
  it('renders label and options', () => {
    render(
      <Select
        label="Profile"
        options={[
          { value: 'it_support', label: 'IT Support' },
          { value: 'customer_support', label: 'Customer Support' },
        ]}
      />
    )
    expect(screen.getByLabelText('Profile')).toBeDefined()
    expect(screen.getByRole('option', { name: 'IT Support' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Customer Support' })).toBeDefined()
  })

  it('shows placeholder option', () => {
    render(
      <Select
        placeholder="Select profile"
        options={[{ value: 'it_support', label: 'IT Support' }]}
      />
    )
    expect(screen.getByRole('option', { name: 'Select profile' })).toBeDefined()
  })

  it('handles selection change', () => {
    const handleChange = vi.fn()
    render(
      <Select
        label="Profile"
        onChange={handleChange}
        options={[
          { value: 'it_support', label: 'IT Support' },
          { value: 'customer_support', label: 'Customer Support' },
        ]}
      />
    )
    fireEvent.change(screen.getByLabelText('Profile'), { target: { value: 'customer_support' } })
    expect(handleChange).toHaveBeenCalled()
  })
})

describe('Textarea component', () => {
  it('renders label and placeholder', () => {
    render(<Textarea label="Message" placeholder="Describe your issue" />)
    expect(screen.getByLabelText('Message')).toBeDefined()
    expect(screen.getByPlaceholderText('Describe your issue')).toBeDefined()
  })

  it('displays error message', () => {
    render(<Textarea error="Message is required" />)
    expect(screen.getByText('Message is required')).toBeDefined()
  })

  it('shows character count', () => {
    render(<Textarea value="Hello World" maxLength={100} showCount />)
    expect(screen.getByText('11/100')).toBeDefined()
  })
})
