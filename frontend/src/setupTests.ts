import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock next/navigation (used by many components)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  useParams: () => ({}),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    return props
  },
}))
