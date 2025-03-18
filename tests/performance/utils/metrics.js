/**
 * Performance Measurement Utilities
 * 
 * Tools for measuring and reporting query performance.
 */

import { performance } from 'perf_hooks';

/**
 * Measures the execution time of a database query
 * 
 * @param {string} queryName - Name of the query being measured
 * @param {Function} queryFn - Function that executes the query
 * @returns {Object} Object containing the result and execution time
 */
export async function measureQueryTime(queryName, queryFn) {
  console.log(`Running query: ${queryName}`);
  
  const start = performance.now();
  const result = await queryFn();
  const end = performance.now();
  const executionTime = end - start;
  
  console.log(`Query '${queryName}' executed in ${executionTime.toFixed(2)}ms`);
  
  return { 
    queryName,
    executionTime, 
    result 
  };
}

/**
 * Runs a query multiple times and reports average performance
 * 
 * @param {string} queryName - Name of the query being measured
 * @param {Function} queryFn - Function that executes the query
 * @param {number} iterations - Number of times to run the query (default: 5)
 * @returns {Object} Object with average execution time and all results
 */
export async function benchmarkQuery(queryName, queryFn, iterations = 5) {
  console.log(`Benchmarking query '${queryName}' (${iterations} iterations)...`);
  
  const times = [];
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const executionTime = end - start;
    
    times.push(executionTime);
    results.push(result);
    
    console.log(`  Iteration ${i + 1}: ${executionTime.toFixed(2)}ms`);
  }
  
  const averageTime = times.reduce((sum, time) => sum + time, 0) / iterations;
  console.log(`Query '${queryName}' average execution time: ${averageTime.toFixed(2)}ms`);
  
  return {
    queryName,
    averageTime,
    times,
    results
  };
}

/**
 * Formats and displays performance results in a table
 * 
 * @param {Array} results - Array of performance results to display
 */
export function displayPerformanceResults(results) {
  console.log('\n=== PERFORMANCE TEST RESULTS ===');
  console.log('| Query Name | Execution Time (ms) |');
  console.log('|------------|---------------------|');
  
  results.forEach(result => {
    console.log(`| ${result.queryName.padEnd(10)} | ${result.executionTime.toFixed(2).padStart(19)} |`);
  });
  
  console.log('===============================\n');
} 