/**
 * Performance Test Configuration
 * 
 * Contains configuration settings for all performance tests.
 */

// Determine if running in CI environment
export const isCI = process.env.CI === 'true' || process.env.CI_ENVIRONMENT === 'true';

// Configuration for tournament query tests
export const tournamentTestConfig = {
  // Number of iterations for benchmark tests
  benchmarkIterations: isCI ? 3 : 5,
  
  // Timeout for queries in milliseconds
  queryTimeout: isCI ? 10000 : 5000,
  
  // Acceptable thresholds for query performance (in ms)
  thresholds: {
    // Tournament queries
    getactive: 100,
    getbyid: 50,
    gettournamentsbyuser: 100,
    
    // Participant queries
    getparts: 100,
    countbystatus: 50,
    
    // Score queries
    getleaderboardfortournament: 150,
    getuserscoresfortournament: 50
  }
};

// Default settings for all performance tests
export const defaultConfig = {
  // Use verbose logging
  verbose: process.env.VERBOSE_PERF_TESTS === 'true' || false,
  
  // Run cleanup after tests
  runCleanup: process.env.SKIP_PERF_CLEANUP !== 'true',
  
  // Maximum allowed query time in ms (used for pass/fail decision)
  maxAllowedQueryTime: isCI ? 1000 : 500,
}; 