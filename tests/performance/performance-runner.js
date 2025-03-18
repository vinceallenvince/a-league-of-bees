/**
 * Performance Test Runner
 * 
 * Main entry point for running all performance tests in isolation
 * from the regular test infrastructure.
 */

import { runPerformanceTests as runTournamentTests } from './tournament-performance.test.js';
// Other test modules will be imported here as they are created

/**
 * Run all performance tests in sequence
 */
const runAllPerformanceTests = async () => {
  console.log('=== A LEAGUE OF BEES PERFORMANCE TEST SUITE ===');
  console.log('Starting performance test suite...');
  
  try {
    // Run tournament tests
    console.log('\n=== TOURNAMENT PERFORMANCE TESTS ===');
    await runTournamentTests();
    
    // Additional test modules will be added here
    // Example:
    // console.log('\n=== PARTICIPANT PERFORMANCE TESTS ===');
    // await runParticipantTests();
    
    console.log('\n=== ALL PERFORMANCE TESTS COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\nPERFORMANCE TEST SUITE FAILED:', error);
    process.exit(1);
  }
};

// Run all tests when this file is executed directly
if (require.main === module) {
  runAllPerformanceTests().catch(console.error);
}

// Export for use in npm scripts
export { runAllPerformanceTests }; 