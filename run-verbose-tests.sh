#!/bin/bash

echo "Running all tests with verbose logging enabled..."
echo "This will show all console output during tests."
echo "===================================================================="

# Set environment variables
export NODE_ENV=test
export VERBOSE_TESTS=true

# Run all tests with verbose output
npm test -- "$@"

# Exit with the exit code from Jest
exit $? 