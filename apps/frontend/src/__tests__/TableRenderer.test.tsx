import { render, screen, fireEvent, within } from '@testing-library/react'
import { TableRenderer } from '../components/engine/TableRenderer'
import { TableConfig } from 'shared-types'
import { expect, vi } from 'vitest'

describe('TableRenderer', () => {
  const tableConfig: TableConfig = {
    name: 'tasks',
    displayName: 'My Tasks',
    fields: [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'status', type: 'text', label: 'Status' },
    ],
  }

  const data = [
    { id: '1', title: 'Task 1', status: 'Pending' },
    { id: '2', title: 'Task 2', status: 'Completed' },
  ]

  it('renders column headers from config', () => {
    render(<TableRenderer tableConfig={tableConfig} data={data} isLoading={false} />)

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
  })

  it('shows skeleton when isLoading is true', () => {
    render(<TableRenderer tableConfig={tableConfig} data={[]} isLoading={true} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when data is empty', () => {
    render(<TableRenderer tableConfig={tableConfig} data={[]} isLoading={false} />)

    expect(screen.getByText(/empty/i)).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(
      <TableRenderer
        tableConfig={tableConfig}
        data={data}
        isLoading={false}
        onEdit={onEdit}
        actions={['update']}
      />
    )

    const editButtons = screen.getAllByTitle(/edit/i)
    fireEvent.click(editButtons[0])

    expect(onEdit).toHaveBeenCalledWith(data[0])
  })

  it('shows confirmation dialog before calling onDelete', () => {
    const onDelete = vi.fn()
    render(
      <TableRenderer
        tableConfig={tableConfig}
        data={data}
        isLoading={false}
        onDelete={onDelete}
        actions={['delete']}
      />
    )

    const deleteButton = screen.getAllByTitle(/delete/i)[0]
    fireEvent.click(deleteButton)

    expect(screen.getByText(/confirmDelete/i)).toBeInTheDocument()

    expect(screen.getByText(/confirmDelete/i)).toBeInTheDocument()

    // Find the button specifically inside the confirmation container
    const confirmDialog = screen.getByText(/confirmDelete/i).parentElement!
    const confirmButton = within(confirmDialog).getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
