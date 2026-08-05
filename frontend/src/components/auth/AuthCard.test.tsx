import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthCard } from './AuthCard'
import React from 'react'

describe('AuthCard component', () => {
  it('renders title and subtitle', () => {
    render(<AuthCard title="Welcome Back" subtitle="Sign in to continue">Content</AuthCard>)
    expect(screen.getByText('Welcome Back')).toBeDefined()
    expect(screen.getByText('Sign in to continue')).toBeDefined()
  })

  it('renders children content', () => {
    render(<AuthCard title="Test" subtitle="Sub">Child Content</AuthCard>)
    expect(screen.getByText('Child Content')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(
      <AuthCard title="Test" subtitle="Sub" className="custom-class">Content</AuthCard>
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
