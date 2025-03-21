import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentForm } from '@/features/tournament/components/tournament/TournamentForm';
import { TournamentFormData } from '@/features/tournament/types';

describe('TournamentForm', () => {
  const mockSubmit = jest.fn();
  const initialData: TournamentFormData = {
    name: '',
    description: '',
    durationDays: 7,
    startDate: new Date(),
    requiresVerification: false,
    timezone: 'UTC'
  };

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders form with all required fields', () => {
    render(<TournamentForm onSubmit={mockSubmit} initialData={initialData} />);
    
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration \(days\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requires Verification/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Timezone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TournamentForm onSubmit={mockSubmit} initialData={initialData} />);
    
    // Submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const testDate = new Date('2023-05-01');
    render(<TournamentForm onSubmit={mockSubmit} initialData={initialData} />);
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'New Tournament' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Tournament description' } });
    fireEvent.change(screen.getByLabelText(/Duration \(days\)/i), { target: { value: '10' } });
    
    // Simulating date picker selection is complex and might require adapter-specific handling
    // For this test, we'll just assume it works correctly
    
    fireEvent.click(screen.getByLabelText(/Requires Verification/i));
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Tournament',
        description: 'Tournament description',
        durationDays: 10,
        requiresVerification: true,
      }));
    });
  });

  it('pre-fills form with initial data when editing', () => {
    const editData: TournamentFormData = {
      name: 'Edit Tournament',
      description: 'Existing description',
      durationDays: 14,
      startDate: new Date('2023-06-01'),
      requiresVerification: true,
      timezone: 'America/New_York'
    };
    
    render(<TournamentForm onSubmit={mockSubmit} initialData={editData} isEditing={true} />);
    
    expect((screen.getByLabelText(/Name/i) as HTMLInputElement).value).toBe('Edit Tournament');
    expect((screen.getByLabelText(/Description/i) as HTMLInputElement).value).toBe('Existing description');
    expect((screen.getByLabelText(/Duration \(days\)/i) as HTMLInputElement).value).toBe('14');
    expect((screen.getByLabelText(/Requires Verification/i) as HTMLInputElement).checked).toBe(true);
    
    // Note: Testing the date picker value is more complex and might require adapter-specific code
    
    expect(screen.getByRole('button', { name: /Update/i })).toBeInTheDocument();
  });
}); 