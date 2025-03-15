import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Mock fetch globally
global.fetch = jest.fn();

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Reset all mocks after each test
afterEach(() => {
  jest.resetAllMocks();
});

// Add custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
  toHaveAttribute(received, attr) {
    const pass = received.hasAttribute(attr);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to have attribute ${attr}`,
      pass,
    };
  },
});
