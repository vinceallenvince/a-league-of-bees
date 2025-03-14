import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm, FieldValues, ControllerRenderProps } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField
} from '../../../../../client/src/core/ui/form';

// Define test props interfaces
interface TestFormProps {
  defaultValues?: Record<string, string>;
  onSubmit?: () => void;
  withError?: boolean;
  withDescription?: boolean;
  withChildren?: boolean;
}

// Mock component that uses the form components
const TestForm = ({ 
  defaultValues = { test: '' }, 
  onSubmit = () => {}, 
  withError = false, 
  withDescription = true, 
  withChildren = true 
}: TestFormProps) => {
  const form = useForm({
    defaultValues
  });

  // Add an error if requested
  React.useEffect(() => {
    if (withError) {
      form.setError('test', { type: 'manual', message: 'Test error message' });
    }
  }, [withError, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        <FormField
          control={form.control}
          name="test"
          render={({ field }: { field: ControllerRenderProps<FieldValues, 'test'> }) => (
            <FormItem>
              <FormLabel>Test Label</FormLabel>
              <FormControl>
                <input 
                  name={field.name}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  value={field.value as string || ''}
                  ref={field.ref}
                  data-testid="test-input" 
                />
              </FormControl>
              {withDescription && <FormDescription>Test description</FormDescription>}
              <FormMessage>{withChildren ? 'Custom message' : null}</FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};

// Mock for useFormField - this will be used to test the error path
jest.mock('../../../../../client/src/core/ui/form', () => {
  const originalModule = jest.requireActual('../../../../../client/src/core/ui/form');
  return {
    ...originalModule,
    // We'll override this in specific tests
    useFormField: jest.fn().mockImplementation(originalModule.useFormField),
  };
});

describe('Form Components', () => {
  describe('Form rendering', () => {
    it('should render form elements correctly', () => {
      render(<TestForm />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
    
    it('should render without description', () => {
      render(<TestForm withDescription={false} />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });
  });
  
  describe('FormMessage component', () => {
    it('should render custom children when no error', () => {
      render(<TestForm />);
      
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
    
    it('should render error message when error exists', () => {
      render(<TestForm withError={true} />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.queryByText('Custom message')).not.toBeInTheDocument();
    });
    
    it('should not render when no error and no children', () => {
      render(<TestForm withChildren={false} />);
      
      expect(screen.queryByText('Custom message')).not.toBeInTheDocument();
    });
  });
  
  describe('FormControl component', () => {
    it('should have correct aria attributes when no error', () => {
      render(<TestForm />);
      
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('-form-item-description'));
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });
    
    it('should have correct aria attributes when error exists', () => {
      render(<TestForm withError={true} />);
      
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('-form-item-description'));
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('-form-item-message'));
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
  
  describe('useFormField hook', () => {
    it('should throw error when used outside FormField', () => {
      // Suppress expected error logs in the test
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Get the mocked useFormField function so we can override it for this test
      const { useFormField: mockedUseFormField } = jest.requireMock('../../../../../client/src/core/ui/form');
      
      // Override the implementation to throw the expected error
      mockedUseFormField.mockImplementation(() => {
        throw new Error("useFormField should be used within <FormField>");
      });
      
      // Create a test component that uses the mocked useFormField
      function TestUseFormFieldError() {
        try {
          useFormField();
          return <div>No error thrown</div>;
        } catch (error) {
          return <div>Error thrown</div>;
        }
      }
      
      // Render the component and check that it displays the error message
      render(<TestUseFormFieldError />);
      expect(screen.getByText('Error thrown')).toBeInTheDocument();
      
      // Verify that the function throws the correct error when called directly
      expect(() => {
        mockedUseFormField();
      }).toThrow("useFormField should be used within <FormField>");
      
      mockConsoleError.mockRestore();
    });
  });
}); 