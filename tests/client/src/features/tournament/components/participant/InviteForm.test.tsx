import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteForm } from '@/features/tournament/components/participant/InviteForm';

// Mock functions
const mockOnInvite = jest.fn().mockResolvedValue(undefined);
const mockOnCancel = jest.fn();

describe('InviteForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByLabelText('Invite by Email')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByLabelText('Bulk Add (separated by commas, semicolons, or new lines)')).toBeInTheDocument();
    expect(screen.getByText('Process Bulk Emails')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Send Invitations')).toBeInTheDocument();
    expect(screen.getByText('Send Invitations')).toBeDisabled();
  });

  it('allows adding a single valid email', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const input = screen.getByLabelText('Invite by Email');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Email List (1)')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Send Invitations')).not.toBeDisabled();
  });

  it('shows error for invalid email format', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const input = screen.getByLabelText('Invite by Email');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format: invalid-email')).toBeInTheDocument();
  });

  it('prevents adding duplicate emails', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const input = screen.getByLabelText('Invite by Email');
    const addButton = screen.getByText('Add');
    
    // Add first email
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addButton);
    
    // Try to add same email again
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Email already added: test@example.com')).toBeInTheDocument();
  });

  it('allows adding email with Enter key', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const input = screen.getByLabelText('Invite by Email');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(screen.getByText('Email List (1)')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('processes bulk emails correctly', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const textarea = screen.getByLabelText('Bulk Add (separated by commas, semicolons, or new lines)');
    const processButton = screen.getByText('Process Bulk Emails');
    
    fireEvent.change(textarea, { 
      target: { value: 'test1@example.com, test2@example.com; test3@example.com\ntest4@example.com' } 
    });
    fireEvent.click(processButton);
    
    expect(screen.getByText('Email List (4)')).toBeInTheDocument();
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    expect(screen.getByText('test3@example.com')).toBeInTheDocument();
    expect(screen.getByText('test4@example.com')).toBeInTheDocument();
  });

  it('shows error for invalid bulk emails', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const textarea = screen.getByLabelText('Bulk Add (separated by commas, semicolons, or new lines)');
    const processButton = screen.getByText('Process Bulk Emails');
    
    fireEvent.change(textarea, { 
      target: { value: 'test1@example.com, invalid-email, test3@example.com' } 
    });
    fireEvent.click(processButton);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format: invalid-email')).toBeInTheDocument();
  });

  it('allows removing emails from the list', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    // Add email
    const input = screen.getByLabelText('Invite by Email');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addButton);
    
    // Verify email is in the list
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Remove email
    const removeButton = screen.getByText('✕');
    fireEvent.click(removeButton);
    
    // Verify email is removed
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Email List')).not.toBeInTheDocument();
  });

  it('submits the form with the email list', async () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    // Add email
    const input = screen.getByLabelText('Invite by Email');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addButton);
    
    // Submit form
    const submitButton = screen.getByText('Send Invitations');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith(['test@example.com']);
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInvite}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );
    
    expect(screen.getByText('Sending Invites...')).toBeInTheDocument();
    expect(screen.getByLabelText('Invite by Email')).toBeDisabled();
    expect(screen.getByText('Add')).toBeDisabled();
    expect(screen.getByLabelText('Bulk Add (separated by commas, semicolons, or new lines)')).toBeDisabled();
    expect(screen.getByText('Process Bulk Emails')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('shows error message when form submission fails', async () => {
    const mockOnInviteError = jest.fn().mockRejectedValue(new Error('Failed to send invitations'));
    
    render(
      <InviteForm
        tournamentId="test-id"
        onInvite={mockOnInviteError}
        onCancel={mockOnCancel}
      />
    );
    
    // Add email
    const input = screen.getByLabelText('Invite by Email');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(addButton);
    
    // Submit form
    const submitButton = screen.getByText('Send Invitations');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send invitations. Please try again.')).toBeInTheDocument();
    });
  });
}); 