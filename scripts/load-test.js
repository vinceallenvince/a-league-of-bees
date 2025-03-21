/**
 * Load Testing Script for Tournament Feature API
 * 
 * This script runs load tests against the optimized tournament feature APIs to measure
 * performance under various load conditions.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const dashboardRequests = new Counter('dashboard_requests');
const leaderboardRequests = new Counter('leaderboard_requests');
const tournamentListRequests = new Counter('tournament_list_requests');
const scoreSubmissionRequests = new Counter('score_submission_requests');

// Response time trends
const dashboardTrend = new Trend('dashboard_response_time');
const leaderboardTrend = new Trend('leaderboard_response_time');
const tournamentListTrend = new Trend('tournament_list_response_time');
const scoreSubmissionTrend = new Trend('score_submission_response_time');

// Test configuration
export const options = {
  scenarios: {
    // Constant load test
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 requests per second
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20, // Initial pool of virtual users
      maxVUs: 100, // Maximum virtual users if needed
    },
    // Ramp-up load test
    ramp_up: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 200,
      stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 requests per second
        { duration: '1m', target: 50 },  // Stay at 50 requests per second
        { duration: '30s', target: 100 }, // Ramp up to 100 requests per second
        { duration: '1m', target: 100 },  // Stay at 100 requests per second
        { duration: '30s', target: 0 },   // Ramp down to 0 requests per second
      ],
    },
    // Peak load test - simulate tournament end day with many score submissions
    peak_load: {
      executor: 'constant-arrival-rate',
      rate: 200, // 200 requests per second
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 50,
      maxVUs: 300,
      startTime: '4m', // Start after other scenarios
    },
  },
  thresholds: {
    'dashboard_response_time': ['p95<500'], // 95% of requests should be below 500ms
    'leaderboard_response_time': ['p95<500'],
    'tournament_list_response_time': ['p95<300'],
    'http_req_failed': ['rate<0.01'], // Error rate should be below 1%
    'http_req_duration': ['p95<800'], // All API calls should be below 800ms for 95% of requests
  },
};

// User session data - to simulate real user behavior
const testUsers = [
  { id: 'test-user-1', token: 'test-token-1' },
  { id: 'test-user-2', token: 'test-token-2' },
  { id: 'test-user-3', token: 'test-token-3' },
  { id: 'test-user-4', token: 'test-token-4' },
  { id: 'test-user-5', token: 'test-token-5' },
];

const testTournaments = [
  { id: 'tournament-1', name: 'Tournament 1' },
  { id: 'tournament-2', name: 'Tournament 2' },
  { id: 'tournament-3', name: 'Tournament 3' },
];

// Helper functions
function getRandomUser() {
  return testUsers[randomIntBetween(0, testUsers.length - 1)];
}

function getRandomTournament() {
  return testTournaments[randomIntBetween(0, testTournaments.length - 1)];
}

function getRandomDay() {
  return randomIntBetween(0, 6); // 0-6 for a week-long tournament
}

function getRandomScore() {
  return randomIntBetween(1, 10000);
}

// Default request params
const params = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Main test function
export default function() {
  const user = getRandomUser();
  params.headers['x-test-user-id'] = user.id;
  
  // Randomly choose which API to test based on realistic user patterns
  const apiChoice = randomIntBetween(1, 10);
  
  if (apiChoice <= 3) {
    // 30% chance - Dashboard API
    dashboardTest(user);
  } else if (apiChoice <= 6) {
    // 30% chance - Tournament listing API
    tournamentListTest(user);
  } else if (apiChoice <= 9) {
    // 30% chance - Leaderboard API
    leaderboardTest(user);
  } else {
    // 10% chance - Score submission API
    scoreSubmissionTest(user);
  }
  
  // Add random sleep to simulate realistic user behavior
  sleep(randomIntBetween(1, 5) / 10);
}

// Dashboard API test
function dashboardTest(user) {
  group('Dashboard API', () => {
    const startTime = new Date();
    const response = http.get('http://localhost:3000/api/dashboard', params);
    const duration = new Date() - startTime;
    
    dashboardRequests.add(1);
    dashboardTrend.add(duration);
    
    check(response, {
      'Dashboard status is 200': (r) => r.status === 200,
      'Dashboard has tournament summary': (r) => r.json('tournamentSummary') !== undefined,
      'Dashboard has participation data': (r) => r.json('participation') !== undefined,
      'Dashboard response time is acceptable': (r) => duration < 500,
    });
  });
}

// Tournament listing API test
function tournamentListTest(user) {
  group('Tournament Listing API', () => {
    // Test pagination with varying page sizes
    const page = randomIntBetween(1, 3);
    const pageSize = randomIntBetween(10, 50);
    
    const startTime = new Date();
    const response = http.get(
      `http://localhost:3000/api/tournaments?page=${page}&pageSize=${pageSize}`, 
      params
    );
    const duration = new Date() - startTime;
    
    tournamentListRequests.add(1);
    tournamentListTrend.add(duration);
    
    check(response, {
      'Tournament list status is 200': (r) => r.status === 200,
      'Tournament list has results': (r) => Array.isArray(r.json('tournaments')),
      'Tournament list has pagination': (r) => r.json('pagination') !== undefined,
      'Tournament list response time is acceptable': (r) => duration < 300,
    });
  });
}

// Leaderboard API test
function leaderboardTest(user) {
  group('Leaderboard API', () => {
    const tournament = getRandomTournament();
    
    const startTime = new Date();
    const response = http.get(
      `http://localhost:3000/api/tournaments/${tournament.id}/leaderboard`, 
      params
    );
    const duration = new Date() - startTime;
    
    leaderboardRequests.add(1);
    leaderboardTrend.add(duration);
    
    check(response, {
      'Leaderboard status is 200': (r) => r.status === 200,
      'Leaderboard is an array': (r) => Array.isArray(r.json()),
      'Leaderboard response time is acceptable': (r) => duration < 500,
    });
  });
}

// Score submission API test
function scoreSubmissionTest(user) {
  group('Score Submission API', () => {
    const tournament = getRandomTournament();
    const day = getRandomDay();
    const score = getRandomScore();
    
    const payload = JSON.stringify({
      day: day,
      score: score
    });
    
    const startTime = new Date();
    const response = http.post(
      `http://localhost:3000/api/tournaments/${tournament.id}/scores`,
      payload,
      params
    );
    const duration = new Date() - startTime;
    
    scoreSubmissionRequests.add(1);
    scoreSubmissionTrend.add(duration);
    
    // For score submission, we're ok with 201 (created) or 400 (already exists)
    check(response, {
      'Score submission response is valid': (r) => r.status === 201 || r.status === 400,
      'Score submission response time is acceptable': (r) => duration < 500,
    });
  });
} 