/**
 * Tournament Query Performance Tests
 * 
 * Tests to measure performance of tournament-related database queries.
 * Completely isolated from regular test infrastructure.
 */

import { initPerfTestDb, closePerfTestDb } from './utils/db-utils.js';
import { benchmark, saveResults } from './utils/measure-utils.js';
import { 
  createTestUser, 
  createTestTournaments, 
  createTestParticipants,
  createTestScores,
  cleanupAllTestData 
} from './utils/setup-utils.js';
import { tournamentTestConfig, defaultConfig } from './config/test-config.js';

// Import modules to test (directly from source, not from test fixtures)
import { 
  getActiveTournaments,
  getTournamentById,
  getTournamentsByUser 
} from '../../src/services/tournament-service.js';

// Test data
let testUser;
let testTournaments = [];
let tournamentWithParticipants;
let participants = [];

// Test results storage
const results = [];

/**
 * Set up test data before running performance tests
 */
const setupTestData = async () => {
  console.log('Setting up performance test data...');
  
  // Create test user
  testUser = await createTestUser();
  
  // Create multiple tournaments (some owned by test user)
  testTournaments = await createTestTournaments(10, testUser.id);
  
  // Create one tournament with many participants
  tournamentWithParticipants = await createTestTournaments(1, testUser.id);
  participants = await createTestParticipants(tournamentWithParticipants[0].id, 20);
  
  // Create scores for participants
  await createTestScores(tournamentWithParticipants[0].id, participants);
  
  console.log('Test data setup complete.');
};

/**
 * Run performance tests for tournament queries
 */
const runTests = async () => {
  // Test getActiveTournaments performance
  const activeResult = await benchmark(
    'getActiveTournaments',
    async () => {
      await getActiveTournaments();
    },
    tournamentTestConfig.benchmarkIterations,
    { threshold: tournamentTestConfig.thresholds.getactive }
  );
  results.push(activeResult);
  
  // Test getTournamentById performance
  const byIdResult = await benchmark(
    'getTournamentById',
    async () => {
      await getTournamentById(testTournaments[0].id);
    },
    tournamentTestConfig.benchmarkIterations,
    { threshold: tournamentTestConfig.thresholds.getbyid }
  );
  results.push(byIdResult);
  
  // Test getTournamentsByUser performance
  const byUserResult = await benchmark(
    'getTournamentsByUser',
    async () => {
      await getTournamentsByUser(testUser.id);
    },
    tournamentTestConfig.benchmarkIterations,
    { threshold: tournamentTestConfig.thresholds.gettournamentsbyuser }
  );
  results.push(byUserResult);
};

/**
 * Main test execution function
 */
const runPerformanceTests = async () => {
  try {
    console.log('Starting tournament performance tests...');
    
    // Initialize performance test database
    await initPerfTestDb();
    
    // Set up test data
    await setupTestData();
    
    // Run performance tests
    await runTests();
    
    // Save results
    await saveResults(results, 'tournament-perf-results.json');
    
    // Clean up test data if not skipped
    if (defaultConfig.runCleanup) {
      await cleanupAllTestData();
    }
    
    console.log('Tournament performance tests completed successfully.');
  } catch (error) {
    console.error('Error in performance tests:', error);
  } finally {
    // Close database connections
    await closePerfTestDb();
  }
};

// Run performance tests when this file is executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

// Export for use in npm scripts
export { runPerformanceTests }; 