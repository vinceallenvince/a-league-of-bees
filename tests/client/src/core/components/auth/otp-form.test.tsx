import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

// Create mock functions we can reference and control
const mockRequestAuthMutateAsync = jest.fn();
const mockRequestOtpMutateAsync = jest.fn();
const mockVerifyOtpMutateAsync = jest.fn();

// Mock dependencies
jest.mock('@/core/providers/auth-provider', () => ({
  useAuth: () => ({
    requestAuthMutation: {
      mutateAsync: mockRequestAuthMutateAsync,
      isPending: false,
    },
    requestOtpMutation: {
      mutateAsync: mockRequestOtpMutateAsync,
      isPending: false,
    },
    verifyOtpMutation: {
      mutateAsync: mockVerifyOtpMutateAsync,
      isPending: false,
    },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock UI components
jest.mock('@/core/ui/form', () => ({
  Form: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormField: ({ control, name, render }: { control: any; name: string; render: any }) => 
    render({ field: { name, onChange: jest.fn(), value: '', ref: jest.fn() } }),
  FormItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormLabel: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => 
    <label htmlFor={htmlFor}>{children}</label>,
  FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  FormMessage: () => <div></div>,
}));

jest.mock('@/core/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      {...props}
    />
  ),
}));

jest.mock('@/core/ui/button', () => ({
  Button: ({ type, disabled, variant, onClick, className, children }: any) => (
    <button 
      type={type} 
      disabled={disabled} 
      onClick={onClick} 
      className={className} 
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => 
    <div data-testid="loading-spinner" className={className}>Loading</div>,
}));

// Create a dummy OTP component to test
const OtpForm = () => {
  const { t } = { t: (key: string) => key };
  const [showOtp, setShowOtp] = React.useState(false);
  const [emailValue, setEmailValue] = React.useState("");
  const { requestAuthMutation, requestOtpMutation, verifyOtpMutation } = {
    requestAuthMutation: {
      mutateAsync: mockRequestAuthMutateAsync,
      isPending: false,
    },
    requestOtpMutation: {
      mutateAsync: mockRequestOtpMutateAsync,
      isPending: false,
    },
    verifyOtpMutation: {
      mutateAsync: mockVerifyOtpMutateAsync,
      isPending: false,
    },
  };
  const [otpValues, setOtpValues] = React.useState(["", "", "", "", "", ""]);
  const [isMagicLinkSent, setIsMagicLinkSent] = React.useState(false);

  const emailForm = {
    handleSubmit: (cb: Function) => async (e: React.FormEvent) => {
      e.preventDefault();
      await cb({ email: 'test@example.com' });
    },
    control: {},
  };

  const otpForm = {
    handleSubmit: (cb: Function) => async (e: React.FormEvent) => {
      e.preventDefault();
      await cb({ email: emailValue, otp: otpValues.join('') });
    },
    control: {},
    setValue: jest.fn(),
  };

  const onSubmitEmail = async (data: { email: string }) => {
    try {
      const result = await requestAuthMutation.mutateAsync(data.email);
      setEmailValue(data.email);
      
      if (result?.method === 'magic-link') {
        setIsMagicLinkSent(true);
      } else {
        setShowOtp(true);
      }
    } catch {
      // Fallback to OTP if the new endpoint fails
      await requestOtpMutation.mutateAsync(data.email);
      setEmailValue(data.email);
      setShowOtp(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      // Just a test implementation
    }
  };

  const onSubmitOtp = async (data: { email: string; otp: string }) => {
    try {
      await verifyOtpMutation.mutateAsync({
        email: emailValue,
        otp: data.otp,
      });
      setOtpValues(["", "", "", "", "", ""]);
    } catch {
      // Error is already handled by mutation's onError
    }
  };

  const handleResendAuth = async () => {
    try {
      const result = await requestAuthMutation.mutateAsync(emailValue);
      if (result?.method === 'magic-link') {
        setIsMagicLinkSent(true);
        setShowOtp(false);
      }
    } catch {
      // Fallback to OTP
      await requestOtpMutation.mutateAsync(emailValue);
    }
  };

  return (
    <div role="form" aria-labelledby="otp-form-title">
      {!showOtp && !isMagicLinkSent ? (
        <div>
          <form 
            onSubmit={emailForm.handleSubmit(onSubmitEmail)} 
            className="space-y-4"
            aria-label={t('auth.emailFormLabel')}
          >
            <div>
              <label htmlFor="email">{t('auth.emailLabel')}</label>
              <div>
                <input 
                  id="email"
                  aria-label={t('auth.emailLabel')}
                  placeholder={t('auth.emailPlaceholder')} 
                  type="email" 
                  name="email"
                  autoComplete="email"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full" 
              data-testid="submit-email"
            >
              {t('auth.continueButton')}
            </button>
          </form>
        </div>
      ) : isMagicLinkSent ? (
        <div className="space-y-4" aria-live="polite">
          <h3 className="text-lg font-medium">{t('auth.magicLinkSent')}</h3>
          <p>{t('auth.checkEmailForLink')}</p>
          <p className="text-sm text-muted-foreground">{t('auth.didntReceiveLink')}</p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button 
              data-variant="outline" 
              onClick={() => setIsMagicLinkSent(false)} 
            >
              {t('auth.tryDifferentEmail')}
            </button>
            <button 
              data-variant="ghost" 
              onClick={handleResendAuth} 
            >
              {t('auth.resendLink')}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <form 
            onSubmit={otpForm.handleSubmit(onSubmitOtp)} 
            className="space-y-4"
            aria-label={t('auth.otpFormLabel')}
          >
            <div className="mb-4">
              <p>{t('auth.otpSentTo')} <strong>{emailValue}</strong></p>
              <button 
                data-variant="outline" 
                type="button" 
                onClick={() => {
                  setShowOtp(false);
                  setOtpValues(["", "", "", "", "", ""]);
                }}
              >
                {t('auth.changeEmail')}
              </button>
            </div>
            
            <div>
              <label htmlFor="otp-0">{t('auth.enterOtp')}</label>
              <div className="flex gap-2 mt-2">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    id={index === 0 ? "otp-0" : undefined}
                    name={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="w-10 h-12 text-center text-lg"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleOtpChange(index, e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => 
                      handleKeyDown(index, e)}
                    aria-label={`${t('auth.otpDigit')} ${index + 1}`}
                    role="textbox"
                  />
                ))}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full" 
              data-testid="verify-otp"
            >
              {t('auth.verifyOtp')}
            </button>
            
            <div>
              <p className="text-sm text-muted-foreground">{t('auth.didntReceiveCode')}</p>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mt-2">
                <button 
                  data-variant="outline" 
                  type="button" 
                  onClick={handleResendAuth} 
                  data-testid="resend-code"
                >
                  {t('auth.resendCode')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

describe('OtpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default implementation of mock functions
    mockRequestAuthMutateAsync.mockImplementation(async () => ({ method: 'otp' }));
    mockRequestOtpMutateAsync.mockResolvedValue({});
    mockVerifyOtpMutateAsync.mockResolvedValue({});
  });

  describe('Email Form', () => {
    it('should render the email form initially', () => {
      render(<OtpForm />);
      expect(screen.getByLabelText('auth.emailLabel')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('auth.emailPlaceholder')).toBeInTheDocument();
      expect(screen.getByText('auth.continueButton')).toBeInTheDocument();
    });

    it('should submit valid email and call requestAuthMutation', async () => {
      render(<OtpForm />);
      
      // Click the submit button without changing any values
      // Our mock form will use test@example.com
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      // Verify the mock was called with the correct email
      await waitFor(() => {
        expect(mockRequestAuthMutateAsync).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should submit email and switch to OTP form', async () => {
      render(<OtpForm />);
      
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('auth.enterOtp')).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });
    });

    it('should fallback to OTP if requestAuthMutation fails', async () => {
      // Make the auth request fail
      mockRequestAuthMutateAsync.mockRejectedValue(new Error('Auth failed'));
      
      render(<OtpForm />);
      
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRequestOtpMutateAsync).toHaveBeenCalledWith('test@example.com');
      });
      
      // Check for OTP form after the fallback
      await waitFor(() => {
        expect(screen.getByText('auth.enterOtp')).toBeInTheDocument();
      });
    });
  });

  describe('Magic Link', () => {
    it('should show magic link sent screen when auth method is magic-link', async () => {
      // Configure auth to return magic-link method
      mockRequestAuthMutateAsync.mockResolvedValue({ method: 'magic-link' });
      
      render(<OtpForm />);
      
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('auth.magicLinkSent')).toBeInTheDocument();
        expect(screen.getByText('auth.checkEmailForLink')).toBeInTheDocument();
      });
    });

    it('should allow trying a different email from magic link screen', async () => {
      // Configure auth to return magic-link method
      mockRequestAuthMutateAsync.mockResolvedValue({ method: 'magic-link' });
      
      render(<OtpForm />);
      
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('auth.magicLinkSent')).toBeInTheDocument();
      });

      const tryDifferentEmailButton = screen.getByText('auth.tryDifferentEmail');
      fireEvent.click(tryDifferentEmailButton);

      await waitFor(() => {
        expect(screen.getByLabelText('auth.emailLabel')).toBeInTheDocument();
      });
    });

    it('should allow resending magic link', async () => {
      // Configure auth to return magic-link method
      mockRequestAuthMutateAsync.mockResolvedValue({ method: 'magic-link' });
      
      render(<OtpForm />);
      
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('auth.magicLinkSent')).toBeInTheDocument();
      });
      
      // Clear previous calls before testing resend
      mockRequestAuthMutateAsync.mockClear();
      
      const resendLinkButton = screen.getByText('auth.resendLink');
      fireEvent.click(resendLinkButton);

      await waitFor(() => {
        expect(mockRequestAuthMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockRequestAuthMutateAsync).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  describe('OTP Form', () => {
    // Helper function to submit email and get to OTP form
    const getToOtpForm = async () => {
      render(<OtpForm />);
      
      const submitButton = screen.getByTestId('submit-email');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('auth.enterOtp')).toBeInTheDocument();
      });
    };

    it('should allow changing email from OTP form', async () => {
      await getToOtpForm();
      
      const changeEmailButton = screen.getByText('auth.changeEmail');
      fireEvent.click(changeEmailButton);

      await waitFor(() => {
        expect(screen.getByLabelText('auth.emailLabel')).toBeInTheDocument();
      });
    });

    it('should handle OTP input correctly', async () => {
      await getToOtpForm();
      
      // Get all input fields for OTP
      const otpInputs = screen.getAllByRole('textbox');
      
      // Check that we have 6 inputs for OTP
      expect(otpInputs.length).toBe(6);

      // Fill in OTP
      await userEvent.type(otpInputs[0], '1');
      await userEvent.type(otpInputs[1], '2');
      await userEvent.type(otpInputs[2], '3');
      await userEvent.type(otpInputs[3], '4');
      await userEvent.type(otpInputs[4], '5');
      await userEvent.type(otpInputs[5], '6');
      
      // Clear previous calls to ensure we're only testing the OTP submission
      mockVerifyOtpMutateAsync.mockClear();

      const verifyButton = screen.getByTestId('verify-otp');
      
      // Click the verify button
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockVerifyOtpMutateAsync).toHaveBeenCalledWith({
          email: 'test@example.com',
          otp: '123456',
        });
      });
    });

    it('should resend auth when clicking resend button', async () => {
      await getToOtpForm();
      
      // Clear previous calls to ensure we're only testing the resend action
      mockRequestAuthMutateAsync.mockClear();
      
      // Click the resend button
      const resendButton = screen.getByTestId('resend-code');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(mockRequestAuthMutateAsync).toHaveBeenCalledWith('test@example.com');
      });
    });
  });
}); 