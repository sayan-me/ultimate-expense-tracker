import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagsInput } from '../tags-input'

describe('TagsInput Component', () => {
  const mockOnChange = vi.fn()
  const defaultProps = {
    value: [],
    onChange: mockOnChange,
    placeholder: 'Type and press Enter to add tags...',
    maxTags: 5
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders input field with placeholder', () => {
      render(<TagsInput {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Type and press Enter to add tags...')).toBeInTheDocument()
    })

    it('renders Quick add section with default tags', () => {
      render(<TagsInput {...defaultProps} />)
      
      expect(screen.getByText('Quick add:')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Essential' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Optional' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Planned' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Impulse' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Recurring' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'One-time' })).toBeInTheDocument()
    })

    it('shows only 6 quick add suggestions at most', () => {
      render(<TagsInput {...defaultProps} />)
      
      const quickAddButtons = screen.getAllByRole('button').filter(button => 
        ['Essential', 'Optional', 'Planned', 'Impulse', 'Recurring', 'One-time'].includes(button.textContent || '')
      )
      
      expect(quickAddButtons).toHaveLength(6)
    })
  })

  describe('Quick Add Functionality', () => {
    it('quick add buttons are clickable', () => {
      render(<TagsInput {...defaultProps} />)
      
      const essentialButton = screen.getByRole('button', { name: 'Essential' })
      expect(essentialButton).toBeEnabled()
      
      fireEvent.click(essentialButton)
      expect(mockOnChange).toHaveBeenCalledWith(['Essential'])
    })

    it('quick add button click updates state correctly', () => {
      render(<TagsInput {...defaultProps} />)
      
      const optionalButton = screen.getByRole('button', { name: 'Optional' })
      fireEvent.click(optionalButton)
      
      expect(mockOnChange).toHaveBeenCalledTimes(1)
      expect(mockOnChange).toHaveBeenCalledWith(['Optional'])
    })

    it('filters out already selected tags from quick add suggestions', () => {
      render(<TagsInput {...defaultProps} value={['Essential', 'Planned']} />)
      
      expect(screen.queryByRole('button', { name: 'Essential' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Planned' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Optional' })).toBeInTheDocument()
    })

    it('hides quick add section when max tags reached', () => {
      const maxTags = ['Essential', 'Optional', 'Planned', 'Impulse', 'Recurring']
      render(<TagsInput {...defaultProps} value={maxTags} />)
      
      expect(screen.queryByText('Quick add:')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'One-time' })).not.toBeInTheDocument()
    })
  })

  describe('Custom Tag Input', () => {
    it('allows typing custom tags', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, 'Custom Tag')
      
      expect(input).toHaveValue('Custom Tag')
    })

    it('adds custom tag on Enter keypress', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, 'Custom Tag{enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['Custom Tag'])
    })

    it('clears input field after adding tag', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, 'Custom Tag{enter}')
      
      expect(input).toHaveValue('')
    })

    it('trims whitespace from custom tags', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, '  Trimmed Tag  {enter}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['Trimmed Tag'])
    })

    it('ignores empty or whitespace-only tags', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, '   {enter}')
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('prevents duplicate tags', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} value={['Existing']} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, 'Existing{enter}')
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Tag Display and Removal', () => {
    it('displays selected tags as badges', () => {
      render(<TagsInput {...defaultProps} value={['Tag1', 'Tag2']} />)
      
      expect(screen.getByText('Tag1')).toBeInTheDocument()
      expect(screen.getByText('Tag2')).toBeInTheDocument()
    })

    it('selected tags have close buttons', () => {
      render(<TagsInput {...defaultProps} value={['Tag1', 'Tag2']} />)
      
      expect(screen.getByLabelText('Remove Tag1 tag')).toBeInTheDocument()
      expect(screen.getByLabelText('Remove Tag2 tag')).toBeInTheDocument()
    })

    it('close buttons are clickable and remove tags', () => {
      render(<TagsInput {...defaultProps} value={['Tag1', 'Tag2']} />)
      
      const removeButton = screen.getByLabelText('Remove Tag1 tag')
      fireEvent.click(removeButton)
      
      expect(mockOnChange).toHaveBeenCalledWith(['Tag2'])
    })

    it('backspace on empty input removes last tag', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} value={['Tag1', 'Tag2']} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.click(input)
      await user.keyboard('{Backspace}')
      
      expect(mockOnChange).toHaveBeenCalledWith(['Tag1'])
    })

    it('backspace with text does not remove tags', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} value={['Tag1', 'Tag2']} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, 'some text')
      await user.keyboard('{Backspace}')
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Max Tags Limit', () => {
    it('enforces max tags limit', async () => {
      const user = userEvent.setup()
      const maxTags = ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
      render(<TagsInput {...defaultProps} value={maxTags} />)
      
      const input = screen.getByPlaceholderText('Max 5 tags')
      await user.type(input, 'Extra Tag{enter}')
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('disables input when max tags reached', () => {
      const maxTags = ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
      render(<TagsInput {...defaultProps} value={maxTags} />)
      
      const input = screen.getByPlaceholderText('Max 5 tags')
      expect(input).toBeDisabled()
    })

    it('changes placeholder when max tags reached', () => {
      const maxTags = ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
      render(<TagsInput {...defaultProps} value={maxTags} />)
      
      expect(screen.getByPlaceholderText('Max 5 tags')).toBeInTheDocument()
    })

    it('quick add works until max limit', () => {
      const fourTags = ['Tag1', 'Tag2', 'Tag3', 'Tag4']
      render(<TagsInput {...defaultProps} value={fourTags} />)
      
      const essentialButton = screen.getByRole('button', { name: 'Essential' })
      fireEvent.click(essentialButton)
      
      expect(mockOnChange).toHaveBeenCalledWith([...fourTags, 'Essential'])
    })
  })

  describe('Edge Cases', () => {
    it('handles very long tag names', async () => {
      const user = userEvent.setup()
      const longTag = 'ThisIsAVeryLongTagNameThatMightCauseLayoutIssues'
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, `${longTag}{enter}`)
      
      expect(mockOnChange).toHaveBeenCalledWith([longTag])
    })

    it('renders very long tag names in display', () => {
      const longTag = 'ThisIsAVeryLongTagNameThatMightCauseLayoutIssues'
      render(<TagsInput {...defaultProps} value={[longTag]} />)
      
      expect(screen.getByText(longTag)).toBeInTheDocument()
    })

    it('handles special characters in tag names', async () => {
      const user = userEvent.setup()
      const specialTag = 'Tag@#$%^&*()'
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, `${specialTag}{enter}`)
      
      expect(mockOnChange).toHaveBeenCalledWith([specialTag])
    })

    it('handles rapid tag additions', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type and press Enter to add tags...')
      await user.type(input, 'Tag1{enter}Tag2{enter}Tag3{enter}')
      
      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })

    it('maintains proper state when value prop changes', () => {
      const { rerender } = render(<TagsInput {...defaultProps} value={['Initial']} />)
      expect(screen.getByText('Initial')).toBeInTheDocument()
      
      rerender(<TagsInput {...defaultProps} value={['Updated']} />)
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.queryByText('Initial')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for remove buttons', () => {
      render(<TagsInput {...defaultProps} value={['Accessible Tag']} />)
      
      const removeButton = screen.getByLabelText('Remove Accessible Tag tag')
      expect(removeButton).toHaveAttribute('aria-label', 'Remove Accessible Tag tag')
    })

    it('quick add buttons have proper button type', () => {
      render(<TagsInput {...defaultProps} />)
      
      const essentialButton = screen.getByRole('button', { name: 'Essential' })
      expect(essentialButton).toHaveAttribute('type', 'button')
    })

    it('remove buttons have proper button type', () => {
      render(<TagsInput {...defaultProps} value={['Tag1']} />)
      
      const removeButton = screen.getByLabelText('Remove Tag1 tag')
      expect(removeButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Custom Props', () => {
    it('respects custom maxTags prop', async () => {
      const user = userEvent.setup()
      render(<TagsInput {...defaultProps} maxTags={2} value={['Tag1', 'Tag2']} />)
      
      const input = screen.getByPlaceholderText('Max 2 tags')
      await user.type(input, 'Tag3{enter}')
      
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('respects custom placeholder prop', () => {
      render(<TagsInput {...defaultProps} placeholder="Custom placeholder" />)
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
    })

    it('handles undefined value prop gracefully', () => {
      render(<TagsInput onChange={mockOnChange} />)
      
      expect(screen.getByPlaceholderText('Type and press Enter to add tags...')).toBeInTheDocument()
      expect(screen.getByText('Quick add:')).toBeInTheDocument()
    })
  })
})