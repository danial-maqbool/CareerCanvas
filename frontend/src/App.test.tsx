import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('workspace shell', () => {
  it('offers the required workspace navigation and switches views', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Your next chapter starts here.' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Career Profile' }))
    expect(screen.getByRole('heading', { name: 'Career Profile' })).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
