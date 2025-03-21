import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'node:util';

// Mock fetch globally
global.fetch = jest.fn();

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Polyfill setImmediate for JSDOM environment (needed by winston)
if (typeof setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: Function, ...args: any[]) => setTimeout(fn, 0, ...args);
}

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
