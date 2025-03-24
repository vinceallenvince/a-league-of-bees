import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Create a mock AuthProvider
import React from 'react';

// Mock Auth Context and Provider
interface AuthContextValue {
  user: {
    id: string;
    email: string;
    username: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
}

const MockAuthContext = React.createContext<AuthContextValue>({
  user: { id: '1', email: 'test@example.com', username: 'testuser' },
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  verifyOtp: async () => {},
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MockAuthContext.Provider 
      value={{
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        isAuthenticated: true,
        isLoading: false,
        login: async () => {},
        logout: async () => {},
        register: async () => {},
        verifyOtp: async () => {},
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Custom render function that includes global providers
 */
function render(ui: React.ReactElement, options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      }
    }
  });

  // Suppress console errors in tests
  const originalError = console.error;
  console.error = (...args) => {
    if (
      /Warning.*not wrapped in act/.test(args[0]) ||
      /Warning.*React Query/.test(args[0])
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          {/* Remove the Toaster component since it's causing issues */}
        </AuthProvider>
      </QueryClientProvider>
    ),
    ...options,
  });
}

export { render };
export * from '@testing-library/react';