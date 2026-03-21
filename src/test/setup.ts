import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, afterAll, beforeAll, vi } from 'vitest'

// Clean up after each test
afterEach(cleanup)

// Mock Supabase (never makes real network calls in tests)
vi.mock('../lib/supabaseClient', () => ({
  supabase: null,
  isSupabaseAvailable: () => false,
  default: null,
}))

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
}))

// Silence console.error for expected React warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0])
    if (msg.includes('React.act') || msg.includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
