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

// Additional configuration options
interface LoggerOptions {
  keepTiming?: boolean;       // Keep query timing logs (default: true)
  keepErrors?: boolean;       // Keep error logs (default: true)
  keepWarnings?: boolean;     // Keep warning logs (default: true)
  keepSetupTeardown?: boolean; // Keep setup and teardown logs (default: false)
  keepTestResults?: boolean;  // Keep test completion logs (default: true)
}

// Default options
const defaultOptions: LoggerOptions = {
  keepTiming: true,
  keepErrors: true,
  keepWarnings: true,
  keepSetupTeardown: false,
  keepTestResults: true
};

/**
 * Suppress console output with configurable options
 * @param options Configuration options for what to keep
 */
export function suppressConsoleOutput(optionsOrKeepTiming: LoggerOptions | boolean = defaultOptions) {
  if (isLoggingSuppressed) return;
  
  // Handle backward compatibility with boolean parameter
  const options: LoggerOptions = typeof optionsOrKeepTiming === 'boolean'
    ? { ...defaultOptions, keepTiming: optionsOrKeepTiming }
    : { ...defaultOptions, ...optionsOrKeepTiming };
  
  isLoggingSuppressed = true;
  
  // Override console.log to filter messages
  console.log = (...args) => {
    const message = args[0];
    
    if (typeof message === 'string') {
      // Keep query timing logs if enabled
      if (options.keepTiming && (message.includes('executed in') || message.includes('Query '))) {
        originalConsole.log(...args);
        return;
      }
      
      // Keep setup/teardown logs if enabled
      if (options.keepSetupTeardown && (
          message.includes('Setting up') || 
          message.includes('Cleaning up') ||
          message.includes('teardown') ||
          message.includes('setup')
      )) {
        originalConsole.log(...args);
        return;
      }
      
      // Keep test results logs if enabled
      if (options.keepTestResults && (
          message.includes('Ran all test suites') || 
          message.includes('PASS') ||
          message.includes('FAIL')
      )) {
        originalConsole.log(...args);
        return;
      }
    }
    
    // Suppress all other logs
  };
  
  // Conditionally override console.warn
  if (!options.keepWarnings) {
    console.warn = () => {};
  }
  
  // Suppress info and debug entirely
  console.info = () => {};
  console.debug = () => {};
  
  // Keep errors intact by default, unless explicitly disabled
  if (!options.keepErrors) {
    console.error = () => {};
  }
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
 * @param options Configuration options for what to keep
 * @returns Return value of the function
 */
export async function runWithSuppressedLogs<T>(
  fn: () => Promise<T>, 
  options: LoggerOptions | boolean = defaultOptions
): Promise<T> {
  suppressConsoleOutput(options);
  try {
    return await fn();
  } finally {
    restoreConsoleOutput();
  }
} 