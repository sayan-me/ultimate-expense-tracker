import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormLabel, FormControl } from './form'

const TestForm = () => {
  const form = useForm({
    defaultValues: {
      username: ''
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}

describe('Form Components', () => {
  it('renders form elements correctly', () => {
    render(<TestForm />)
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('updates input value', () => {
    render(<TestForm />)
    
    const input = screen.getByLabelText('Username')
    fireEvent.change(input, { target: { value: 'testuser' } })
    
    expect(input).toHaveValue('testuser')
  })
}) 