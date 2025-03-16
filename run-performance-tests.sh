#!/bin/bash

echo "Running tournament query performance tests..."
echo "This test will create test data and measure query execution times."
echo "===================================================================="

# Set environment to test
export NODE_ENV=test

# Run the performance tests with increased timeout and detectOpenHandles flag
npm run test:performance -- --testTimeout=120000 > performance-test-output.log 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Performance tests failed! Showing last 20 lines of the log:"
  tail -n 20 performance-test-output.log
  echo ""
  echo "Check the full log in performance-test-output.log for more details."
else
  echo "✅ Performance tests succeeded!"
  
  # Extract and display performance results
  echo "===================================================================="
  echo "📊 PERFORMANCE TEST RESULTS:"
  echo "===================================================================="
  grep "Query '.*' executed in" performance-test-output.log
  echo "===================================================================="
  
  # Show test summary
  echo "TEST SUMMARY:"
  grep -A 3 "Test Suites:" performance-test-output.log || echo "No test summary found."
fi

exit $EXIT_CODE 