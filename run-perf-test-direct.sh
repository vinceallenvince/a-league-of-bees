#!/bin/bash

echo "Running performance tests directly (output will be shown in terminal)..."
echo "======================================================================"

# Set environment to test
export NODE_ENV=test

# Run the performance test directly
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/server/features/tournament/query-performance.test.ts --testPathIgnorePatterns=[] --detectOpenHandles --testTimeout=120000

# Exit with the exit code from Jest
exit $? 