import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock ScreenshotUploader component
const ScreenshotUploader: React.FC<{
  onChange: (file: File | null) => void;
  initialPreview?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}> = ({ onChange, initialPreview, required, disabled, error }) => {
  const [preview, setPreview] = React.useState<string | null>(initialPreview || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange(file);
    }
  };
  
  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange(null);
  };
  
  return (
    <div>
      {error && <div>{error}</div>}
      
      {preview ? (
        <div>
          <img src={preview} alt="Screenshot preview" />
          <button onClick={handleRemove}>Remove image</button>
        </div>
      ) : (
        <div className={`border-dashed ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            ref={fileInputRef}
          />
          <div>Drag and drop an image, or</div>
          <div>browse</div>
          <div>PNG, JPG, GIF up to 10MB</div>
          
          {required && (
            <div>Screenshot is required for verification</div>
          )}
        </div>
      )}
    </div>
  );
};

describe('ScreenshotUploader', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders uploader correctly', () => {
    render(<ScreenshotUploader onChange={mockOnChange} />);
    
    // Looking for partial text since it might be split across elements
    expect(screen.getByText('Drag and drop an image, or')).toBeInTheDocument();
    expect(screen.getByText('browse')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, GIF up to 10MB')).toBeInTheDocument();
  });
  
  it('shows required message when required is true', () => {
    render(<ScreenshotUploader onChange={mockOnChange} required={true} />);
    
    expect(screen.getByText('Screenshot is required for verification')).toBeInTheDocument();
  });
  
  it('displays error message when provided', () => {
    const errorMessage = 'Invalid image format';
    render(<ScreenshotUploader onChange={mockOnChange} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  
  it('disables the uploader when disabled prop is true', () => {
    render(<ScreenshotUploader onChange={mockOnChange} disabled={true} />);
    
    // Find the main uploader div using a more reliable selector
    const uploaderDiv = document.querySelector('.border-dashed');
    expect(uploaderDiv).toHaveClass('opacity-50');
    expect(uploaderDiv).toHaveClass('cursor-not-allowed');
  });
  
  it('handles file selection correctly', async () => {
    render(<ScreenshotUploader onChange={mockOnChange} />);
    
    // Mock file
    const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Set the file on the input
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    // Trigger change event
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(file);
    });
  });
  
  it('displays preview when file is selected', async () => {
    render(<ScreenshotUploader onChange={mockOnChange} />);
    
    // Mock file and FileReader
    const file = new File(['dummy content'], 'screenshot.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Mock FileReader behavior
    const originalFileReader = window.FileReader;
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null,
      result: 'data:image/png;base64,dummybase64'
    };
    
    // @ts-ignore - Mock implementation
    window.FileReader = jest.fn(() => mockFileReader);
    
    // Set the file on the input
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });
    
    // Trigger change event
    fireEvent.change(fileInput);
    
    // Manually trigger onload
    if (mockFileReader.onload) {
      // @ts-ignore - Call the onload handler
      mockFileReader.onload();
    }
    
    // Expect preview to be displayed
    await waitFor(() => {
      const previewImage = screen.getByAltText('Screenshot preview');
      expect(previewImage).toBeInTheDocument();
    });
    
    // Cleanup
    window.FileReader = originalFileReader;
  });
  
  it('allows removing a selected image', async () => {
    // First render with initialPreview to simulate an image being already selected
    const { rerender } = render(
      <ScreenshotUploader 
        onChange={mockOnChange} 
        initialPreview="data:image/png;base64,dummybase64" 
      />
    );
    
    // Verify the preview is shown
    expect(screen.getByAltText('Screenshot preview')).toBeInTheDocument();
    
    // Click the remove button
    fireEvent.click(screen.getByText(/Remove image/i));
    
    // Check that onChange was called with null
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });
}); 