import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/core/providers/auth-provider';
// Remove the Toaster import since we're mocking it
// import { Toaster } from '@/core/ui/toaster';

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