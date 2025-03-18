#!/usr/bin/env node

/**
 * Tournament Query Performance Tests
 * 
 * This standalone script tests the performance of tournament-related database queries.
 * It connects directly to the test database, runs queries, and properly cleans up.
 */

// Set environment to test
process.env.NODE_ENV = 'test';
process.env.TEST_ENV = 'performance';

// Import required modules and utilities
import { perfDb, cleanupPerformanceDb } from './utils/db-connection.js';
import { createPerformanceTestData, cleanPerformanceTestData } from './utils/test-data.js';
import { measureQueryTime, benchmarkQuery, displayPerformanceResults } from './utils/metrics.js';
import { tournamentTestConfig, defaultConfig } from './config/test-config.js';

// Test result tracking
const results = [];
let hasFailures = false;

/**
 * Main test execution function
 */
async function runPerformanceTests() {
  console.log('\n=== STARTING TOURNAMENT QUERY PERFORMANCE TESTS ===\n');
  
  try {
    // Setup test data
    await createPerformanceTestData();
    
    // Get tournament with most participants for test queries
    const tournamentResult = await perfDb.execute(`
      SELECT t.id, t.name, COUNT(tp.id) as participant_count 
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      GROUP BY t.id, t.name
      ORDER BY participant_count DESC
      LIMIT 1
    `);
    
    if (!tournamentResult.rows.length) {
      throw new Error('No tournaments found in test data');
    }
    
    const testTournamentId = tournamentResult.rows[0].id;
    console.log(`Using tournament "${tournamentResult.rows[0].name}" (ID: ${testTournamentId}) with ${tournamentResult.rows[0].participant_count} participants for testing`);
    
    // Test 1: Get all active tournaments
    const activeTournamentsResult = await measureQueryTime('GetActive', async () => {
      return perfDb.execute(`
        SELECT * FROM tournaments 
        WHERE status = 'pending' OR status = 'in_progress'
        ORDER BY start_date DESC
      `);
    });
    results.push(activeTournamentsResult);
    
    // Test 2: Get tournament by ID
    const tournamentByIdResult = await measureQueryTime('GetByID', async () => {
      return perfDb.execute(`
        SELECT * FROM tournaments WHERE id = '${testTournamentId}'
      `);
    });
    results.push(tournamentByIdResult);
    
    // Test 3: Get tournament participants
    const participantsResult = await measureQueryTime('GetParts', async () => {
      return perfDb.execute(`
        SELECT tp.*, u.email
        FROM tournament_participants tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.tournament_id = '${testTournamentId}'
        ORDER BY tp.status
      `);
    });
    results.push(participantsResult);
    
    // Test 4: Get participant count by status
    const participantCountResult = await measureQueryTime('CountByStatus', async () => {
      return perfDb.execute(`
        SELECT status, COUNT(*) as count
        FROM tournament_participants
        WHERE tournament_id = '${testTournamentId}'
        GROUP BY status
      `);
    });
    results.push(participantCountResult);
    
    // Display consolidated results
    displayPerformanceResults(results);
    
    // Check if any query exceeded thresholds
    results.forEach(result => {
      const thresholdKey = result.queryName.toLowerCase().replace(/\s+/g, '');
      const threshold = tournamentTestConfig.thresholds[thresholdKey] || defaultConfig.maxAllowedQueryTime;
      
      if (result.executionTime > threshold) {
        console.log(`❌ Query "${result.queryName}" exceeded threshold: ${result.executionTime.toFixed(2)}ms > ${threshold}ms`);
        hasFailures = true;
      } else {
        console.log(`✅ Query "${result.queryName}" within threshold: ${result.executionTime.toFixed(2)}ms <= ${threshold}ms`);
      }
    });
    
    console.log('\n=== PERFORMANCE TESTS COMPLETED ===\n');
    
    if (hasFailures) {
      console.log('❌ Some performance tests failed threshold checks.');
    } else {
      console.log('✅ All performance tests passed threshold checks.');
    }
    
  } catch (error) {
    console.error('Performance test failed:', error);
    hasFailures = true;
  } finally {
    // Cleanup test database
    if (defaultConfig.runCleanup) {
      try {
        await cleanPerformanceTestData();
      } catch (error) {
        console.error('Error cleaning up test data:', error);
      }
    }
    
    // Always close database connection
    try {
      await cleanupPerformanceDb();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
    
    // Exit with appropriate code
    process.exit(hasFailures ? 1 : 0);
  }
}

// Run the tests
runPerformanceTests(); 