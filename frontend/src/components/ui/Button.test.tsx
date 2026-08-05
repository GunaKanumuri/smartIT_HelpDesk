import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'
import React from 'react'

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    expect(container.firstChild).toHaveClass('bg-red-500/10')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('shows loading spinner when loading prop is true', () => {
    render(<Button loading>Submit</Button>)
    expect(document.querySelector('svg.animate-spin')).toBeDefined()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
