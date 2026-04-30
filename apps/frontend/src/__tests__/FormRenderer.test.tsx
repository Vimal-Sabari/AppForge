import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormRenderer } from '../components/engine/FormRenderer'
import { FieldConfig } from 'shared-types'
import { expect, vi } from 'vitest'

describe('FormRenderer', () => {
  const fields: FieldConfig[] = [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'age', type: 'number', label: 'Age' },
    { name: 'role', type: 'select', label: 'Role', options: ['admin', 'user'] },
    { name: 'active', type: 'boolean', label: 'Active' },
  ]

  it('renders correct input types for each field', () => {
    render(<FormRenderer fields={fields} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/Name/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/Age/i)).toHaveAttribute('type', 'number')
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('shows validation error for required field when submitted empty', async () => {
    render(<FormRenderer fields={fields} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    // Zod's default message for required string is "Required" or "String must contain..."
    // Let's use a more flexible matcher
    expect(await screen.findByText(/required/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct data shape', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<FormRenderer fields={fields} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '30' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByLabelText(/Active/i))

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          age: 30,
          role: 'admin',
          active: true,
        }),
        expect.anything()
      )
    })
  })

  it('disables submit button when isLoading is true', () => {
    render(<FormRenderer fields={fields} onSubmit={vi.fn()} isLoading={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
