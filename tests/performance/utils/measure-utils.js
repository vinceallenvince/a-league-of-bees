/**
 * Performance measurement utilities
 * 
 * Tools for measuring, analyzing, and reporting performance metrics
 */

import fs from 'fs';
import path from 'path';
import { defaultConfig } from '../config/test-config.js';

/**
 * Run a function multiple times and measure performance
 * @param {string} name - Name of the function being benchmarked
 * @param {Function} fn - Async function to benchmark
 * @param {number} iterations - Number of iterations to run
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Performance results
 */
export const benchmark = async (name, fn, iterations = 5, options = {}) => {
  const results = {
    name,
    iterations,
    times: [],
    min: 0,
    max: 0,
    mean: 0,
    median: 0,
    passes: 0,
    fails: 0
  };
  
  const threshold = options.threshold || defaultConfig.maxAllowedQueryTime;
  const verbose = options.verbose || defaultConfig.verbose;
  
  console.log(`\nBenchmarking ${name} (${iterations} iterations)`);
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fn();
      const end = performance.now();
      const duration = end - start;
      
      results.times.push(duration);
      if (duration <= threshold) {
        results.passes++;
      } else {
        results.fails++;
      }
      
      if (verbose) {
        console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms ${duration <= threshold ? '✓' : '✗'}`);
      } else {
        process.stdout.write(duration <= threshold ? '.' : 'F');
      }
    } catch (err) {
      results.fails++;
      console.error(`\n  Error in iteration ${i + 1}:`, err);
    }
  }
  
  if (!verbose) {
    process.stdout.write('\n');
  }
  
  // Calculate statistics
  if (results.times.length > 0) {
    results.times.sort((a, b) => a - b);
    results.min = results.times[0];
    results.max = results.times[results.times.length - 1];
    results.mean = results.times.reduce((sum, time) => sum + time, 0) / results.times.length;
    
    // Calculate median
    const mid = Math.floor(results.times.length / 2);
    results.median = results.times.length % 2 === 0 
      ? (results.times[mid - 1] + results.times[mid]) / 2 
      : results.times[mid];
  }
  
  // Report results
  console.log(`\nResults for ${name}:`);
  console.log(`  Min: ${results.min.toFixed(2)}ms`);
  console.log(`  Max: ${results.max.toFixed(2)}ms`);
  console.log(`  Mean: ${results.mean.toFixed(2)}ms`);
  console.log(`  Median: ${results.median.toFixed(2)}ms`);
  console.log(`  Passes/Fails: ${results.passes}/${results.fails}`);
  
  return results;
};

/**
 * Save benchmark results to JSON file for later analysis
 * @param {Array} results - Array of benchmark results
 * @param {string} filename - Filename to save results
 * @returns {Promise<void>}
 */
export const saveResults = async (results, filename) => {
  const resultsDir = path.join(process.cwd(), 'tests', 'performance', 'results');
  
  // Ensure directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filePath = path.join(resultsDir, filename);
  const timestamp = new Date().toISOString();
  
  const data = {
    timestamp,
    environment: process.env.NODE_ENV || 'development',
    results
  };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Results saved to ${filePath}`);
};

/**
 * Compare results with previous benchmark runs
 * @param {Array} currentResults - Current benchmark results
 * @param {string} previousResultsFile - Filename of previous results
 * @returns {Object} Comparison results
 */
export const compareWithPrevious = (currentResults, previousResultsFile) => {
  const resultsDir = path.join(process.cwd(), 'tests', 'performance', 'results');
  const filePath = path.join(resultsDir, previousResultsFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`No previous results found at ${filePath}`);
    return null;
  }
  
  try {
    const previousData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const comparisons = [];
    
    for (const current of currentResults) {
      const previous = previousData.results.find(r => r.name === current.name);
      
      if (previous) {
        const percentChange = ((current.median - previous.median) / previous.median) * 100;
        
        comparisons.push({
          name: current.name,
          currentMedian: current.median,
          previousMedian: previous.median,
          change: current.median - previous.median,
          percentChange: percentChange
        });
      }
    }
    
    console.log('\nComparison with previous results:');
    for (const comp of comparisons) {
      const changeSymbol = comp.percentChange > 0 ? '🔺' : '🔽';
      console.log(`  ${comp.name}: ${comp.currentMedian.toFixed(2)}ms vs ${comp.previousMedian.toFixed(2)}ms ${changeSymbol} ${Math.abs(comp.percentChange).toFixed(2)}%`);
    }
    
    return comparisons;
  } catch (err) {
    console.error(`Error comparing with previous results:`, err);
    return null;
  }
}; 