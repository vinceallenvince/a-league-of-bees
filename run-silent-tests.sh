#!/bin/bash

echo "Running tests in silent mode (suppressing all console output)..."
echo "Only errors will be displayed."
echo "===================================================================="

# Set environment variables
export NODE_ENV=test
export SILENT_TESTS=true

# Run all tests with minimal output
npm test -- "$@"

# Capture the exit code
EXIT_CODE=$?

# Display the final result
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed successfully."
else
  echo "❌ Tests failed with exit code $EXIT_CODE."
fi

# Exit with the exit code from Jest
exit $EXIT_CODE 