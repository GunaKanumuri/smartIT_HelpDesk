import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import React from 'react'

describe('Badge component', () => {
  it('renders content correctly', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeDefined()
  })

  it('applies variant styles', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    expect(container.firstChild).toHaveClass('bg-emerald-500/15')
  })

  it('renders a dot when dot prop is true', () => {
    const { container } = render(<Badge dot>With Dot</Badge>)
    const dot = container.querySelector('span > span')
    expect(dot).toBeDefined()
    expect(dot).toHaveClass('rounded-full')
  })
})
