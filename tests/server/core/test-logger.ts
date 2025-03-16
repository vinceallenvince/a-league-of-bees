/**
 * Test Logger Utility
 * 
 * This utility provides functions to control logging output during tests.
 * It allows suppressing console messages except for critical information.
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Track if logging is currently suppressed
let isLoggingSuppressed = false;

/**
 * Suppress all console output except errors
 * @param keepTiming If true, keeps performance timing messages (default: true)
 */
export function suppressConsoleOutput(keepTiming = true) {
  if (isLoggingSuppressed) return;
  
  isLoggingSuppressed = true;
  
  // Override console.log to filter messages
  console.log = (...args) => {
    // Allow performance timing messages to pass through if keepTiming is true
    if (keepTiming && args[0] && typeof args[0] === 'string' && 
        (args[0].includes('executed in') || args[0].includes('Query '))) {
      originalConsole.log(...args);
    }
    // Suppress all other logs
  };
  
  // Suppress info and debug entirely
  console.info = () => {};
  console.debug = () => {};
  
  // Keep warnings and errors intact
  // console.warn remains the same
  // console.error remains the same
}

/**
 * Restore normal console output
 */
export function restoreConsoleOutput() {
  if (!isLoggingSuppressed) return;
  
  // Restore original console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  
  isLoggingSuppressed = false;
}

/**
 * Run a function with suppressed console output
 * @param fn Function to run
 * @param keepTiming If true, keeps performance timing messages
 * @returns Return value of the function
 */
export async function runWithSuppressedLogs<T>(fn: () => Promise<T>, keepTiming = true): Promise<T> {
  suppressConsoleOutput(keepTiming);
  try {
    return await fn();
  } finally {
    restoreConsoleOutput();
  }
} 