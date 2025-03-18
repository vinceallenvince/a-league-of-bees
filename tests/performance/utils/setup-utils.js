/**
 * Performance test setup and teardown utilities
 * 
 * Handles test data creation and cleanup specific to performance testing
 */

import { v4 as uuidv4 } from 'uuid';
import { query, cleanupTestData } from './db-utils.js';

// Store created test entities for later cleanup
const createdEntities = {
  users: [],
  tournaments: [],
  participants: [],
  scores: []
};

/**
 * Create a test user for performance testing
 * @param {Object} userData - Optional user data overrides
 * @returns {Promise<Object>} Created user object
 */
export const createTestUser = async (userData = {}) => {
  const testId = uuidv4();
  const defaultUser = {
    username: `perf_test_user_${testId}`,
    email: `perf_test_${testId}@example.com`,
    password: 'password123',
    display_name: `Performance Test User ${testId}`
  };
  
  const user = { ...defaultUser, ...userData };
  
  const result = await query(
    'INSERT INTO users(username, email, password, display_name) VALUES($1, $2, $3, $4) RETURNING *',
    [user.username, user.email, user.password, user.display_name]
  );
  
  const createdUser = result.rows[0];
  createdEntities.users.push(createdUser);
  
  return createdUser;
};

/**
 * Create a test tournament for performance testing
 * @param {Object} tournamentData - Optional tournament data overrides
 * @param {string} creatorId - User ID of tournament creator
 * @returns {Promise<Object>} Created tournament object
 */
export const createTestTournament = async (tournamentData = {}, creatorId) => {
  const testId = uuidv4();
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const defaultTournament = {
    name: `Performance Test Tournament ${testId}`,
    description: 'Tournament created for performance testing',
    start_date: now.toISOString(),
    end_date: oneWeekLater.toISOString(),
    status: 'active',
    created_by: creatorId || null,
    max_participants: 100,
    game_type: 'test_game'
  };
  
  const tournament = { ...defaultTournament, ...tournamentData };
  
  const result = await query(
    `INSERT INTO tournaments(
      name, description, start_date, end_date, status, 
      created_by, max_participants, game_type
    ) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      tournament.name, tournament.description, tournament.start_date,
      tournament.end_date, tournament.status, tournament.created_by,
      tournament.max_participants, tournament.game_type
    ]
  );
  
  const createdTournament = result.rows[0];
  createdEntities.tournaments.push(createdTournament);
  
  return createdTournament;
};

/**
 * Create multiple test tournaments with the specified count
 * @param {number} count - Number of tournaments to create
 * @param {string} creatorId - User ID of tournament creator
 * @returns {Promise<Array>} Array of created tournaments
 */
export const createTestTournaments = async (count, creatorId) => {
  const tournaments = [];
  
  for (let i = 0; i < count; i++) {
    const tournament = await createTestTournament({
      name: `Performance Test Tournament ${i}`,
      status: i % 3 === 0 ? 'active' : (i % 3 === 1 ? 'pending' : 'completed')
    }, creatorId);
    
    tournaments.push(tournament);
  }
  
  return tournaments;
};

/**
 * Create test participants for a tournament
 * @param {string} tournamentId - Tournament ID
 * @param {number} count - Number of participants to create
 * @returns {Promise<Array>} Array of created participants
 */
export const createTestParticipants = async (tournamentId, count) => {
  const participants = [];
  
  for (let i = 0; i < count; i++) {
    // Create a user for each participant
    const user = await createTestUser({
      username: `perf_participant_${i}_${uuidv4()}`,
      email: `perf_participant_${i}_${uuidv4()}@example.com`
    });
    
    // Add participant
    const result = await query(
      'INSERT INTO participants(tournament_id, user_id, status) VALUES($1, $2, $3) RETURNING *',
      [tournamentId, user.id, i % 2 === 0 ? 'active' : 'pending']
    );
    
    const participant = result.rows[0];
    createdEntities.participants.push(participant);
    participants.push(participant);
  }
  
  return participants;
};

/**
 * Create test scores for participants
 * @param {string} tournamentId - Tournament ID
 * @param {Array} participants - Array of participant objects
 * @returns {Promise<Array>} Array of created scores
 */
export const createTestScores = async (tournamentId, participants) => {
  const scores = [];
  
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    
    // Create 1-3 scores per participant
    const scoreCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < scoreCount; j++) {
      const score = Math.floor(Math.random() * 1000);
      
      const result = await query(
        'INSERT INTO scores(tournament_id, user_id, score, recorded_at) VALUES($1, $2, $3, $4) RETURNING *',
        [tournamentId, participant.user_id, score, new Date().toISOString()]
      );
      
      const createdScore = result.rows[0];
      createdEntities.scores.push(createdScore);
      scores.push(createdScore);
    }
  }
  
  return scores;
};

/**
 * Clean up all test data created during performance tests
 * @returns {Promise<void>}
 */
export const cleanupAllTestData = async () => {
  // Clean up in reverse order to avoid foreign key constraints
  await cleanupTestData('scores', "id IN ('" + createdEntities.scores.map(s => s.id).join("','") + "')");
  await cleanupTestData('participants', "id IN ('" + createdEntities.participants.map(p => p.id).join("','") + "')");
  await cleanupTestData('tournaments', "id IN ('" + createdEntities.tournaments.map(t => t.id).join("','") + "')");
  await cleanupTestData('users', "id IN ('" + createdEntities.users.map(u => u.id).join("','") + "')");
  
  // Reset the tracking arrays
  createdEntities.scores = [];
  createdEntities.participants = [];
  createdEntities.tournaments = [];
  createdEntities.users = [];
  
  console.log('All performance test data cleaned up');
}; 