import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScoreSubmission } from '@/features/tournament/components/score/ScoreSubmission';
import { ScoreFormData } from '@/features/tournament/types';

describe('ScoreSubmission', () => {
  const mockSubmit = jest.fn();
  const currentDay = 3;
  const totalDays = 7;
  const requiresVerification = true;

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders score submission form correctly', () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={requiresVerification}
      />
    );
    
    expect(screen.getByLabelText(/Day/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Score/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Screenshot/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument();
    
    // Should show the current day by default
    expect((screen.getByLabelText(/Day/i) as HTMLSelectElement).value).toBe(currentDay.toString());
  });
  
  it('validates that score is required', async () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={requiresVerification}
      />
    );
    
    // Submit without entering a score
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Score is required/i)).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });
  
  it('validates that screenshot is required when verification is required', async () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={true}
      />
    );
    
    // Fill score but no screenshot
    fireEvent.change(screen.getByLabelText(/Score/i), { target: { value: '100' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Screenshot is required/i)).toBeInTheDocument();
    });
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });
  
  it('does not require screenshot when verification is not required', async () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={false}
      />
    );
    
    // Fill score but no screenshot
    fireEvent.change(screen.getByLabelText(/Score/i), { target: { value: '100' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
  
  it('submits form with valid data', async () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={requiresVerification}
      />
    );
    
    // Fill score
    fireEvent.change(screen.getByLabelText(/Score/i), { target: { value: '100' } });
    
    // Mock file upload (difficult to test fully in JSDOM)
    const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Screenshot/i) as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(fileInput);
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        day: 3,
        score: 100,
        screenshot: file
      }));
    });
  });
  
  it('allows selecting a different day', async () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={false}
      />
    );
    
    // Change day
    fireEvent.change(screen.getByLabelText(/Day/i), { target: { value: '2' } });
    
    // Fill score
    fireEvent.change(screen.getByLabelText(/Score/i), { target: { value: '75' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        day: 2,
        score: 75
      }));
    });
  });
  
  it('disables future days in the day selector', () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={requiresVerification}
      />
    );
    
    const daySelect = screen.getByLabelText(/Day/i) as HTMLSelectElement;
    const options = Array.from(daySelect.options);
    
    // Days up to current day should be enabled
    for (let i = 0; i < currentDay; i++) {
      expect(options[i].disabled).toBe(false);
    }
    
    // Future days should be disabled
    for (let i = currentDay; i < totalDays; i++) {
      expect(options[i].disabled).toBe(true);
    }
  });
}); 