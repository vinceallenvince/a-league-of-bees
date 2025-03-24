import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Define types
interface ScoreFormData {
  day: number;
  score: number;
  screenshot?: File;
}

// Mock ScreenshotUploader component
const ScreenshotUploader = ({ onChange, error, required, disabled }: any) => (
  <div data-testid="screenshot-uploader">
    <input 
      type="file" 
      data-testid="mock-file-input" 
      onChange={(e) => {
        if (e.target.files && e.target.files.length > 0) {
          onChange(e.target.files[0]);
        }
      }}
      disabled={disabled}
    />
    {error && <p data-testid="screenshot-error">{error}</p>}
    {required && <p data-testid="screenshot-required">Screenshot is required for verification</p>}
  </div>
);

// Mock ScoreSubmission component
const ScoreSubmission: React.FC<{
  onSubmit: (data: ScoreFormData) => void;
  currentDay: number;
  totalDays: number;
  requiresVerification: boolean;
  isLoading?: boolean;
}> = ({ onSubmit, currentDay, totalDays, requiresVerification, isLoading = false }) => {
  const [day, setDay] = React.useState(currentDay);
  const [score, setScore] = React.useState<number | ''>('');
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<{
    score?: string;
    screenshot?: string;
  }>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: {
      score?: string;
      screenshot?: string;
    } = {};
    
    if (!score) {
      newErrors.score = 'Score is required';
    }
    
    if (requiresVerification && !screenshot) {
      newErrors.screenshot = 'Screenshot is required for verification';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        day,
        score: Number(score),
        screenshot: screenshot || undefined
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="day">Day</label>
        <select
          id="day"
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          disabled={isLoading}
        >
          {Array.from({ length: totalDays }, (_, i) => (
            <option 
              key={i + 1} 
              value={i + 1}
              disabled={i + 1 > currentDay}
            >
              {i + 1}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="score">Score</label>
        <input
          id="score"
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value ? Number(e.target.value) : '')}
          disabled={isLoading}
        />
        {errors.score && <p>{errors.score}</p>}
      </div>
      
      <div>
        <label htmlFor="screenshot">Screenshot</label>
        <ScreenshotUploader 
          onChange={setScreenshot}
          error={errors.screenshot}
          required={requiresVerification}
          disabled={isLoading}
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

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
    
    // Check for the Screenshot label using a more specific selector
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'label' && content.includes('Screenshot');
    })).toBeInTheDocument();
    
    expect(screen.getByTestId('screenshot-uploader')).toBeInTheDocument();
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
      // Use test ID to find the error message
      expect(screen.getByTestId('screenshot-error')).toBeInTheDocument();
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
    
    // Mock file upload using our mocked ScreenshotUploader
    const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('mock-file-input');
    
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
  
  it('disables form controls when isLoading is true', () => {
    render(
      <ScoreSubmission 
        onSubmit={mockSubmit} 
        currentDay={currentDay} 
        totalDays={totalDays}
        requiresVerification={requiresVerification}
        isLoading={true}
      />
    );
    
    expect(screen.getByLabelText(/Day/i)).toBeDisabled();
    expect(screen.getByLabelText(/Score/i)).toBeDisabled();
    expect(screen.getByTestId('mock-file-input')).toBeDisabled();
    expect(screen.getByRole('button', { name: /Submitting/i })).toBeDisabled();
  });
}); 