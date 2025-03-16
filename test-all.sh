#!/bin/bash
echo "Running all tests with NODE_ENV=test..."
export NODE_ENV=test
npm test > all-tests-output.log 2>&1
EXIT_CODE=$?
echo "All tests finished with exit code $EXIT_CODE"
if [ $EXIT_CODE -ne 0 ]; then
  echo "Some tests failed! Showing last 20 lines of the log:"
  tail -n 20 all-tests-output.log
else
  echo "All tests succeeded! Checking for 'Jest did not exit' message:"
  if grep -q "Jest did not exit" all-tests-output.log; then
    echo "Warning: Jest did not exit properly. Showing relevant lines:"
    grep -A 10 "Jest did not exit" all-tests-output.log
  else
    echo "No 'Jest did not exit' message found. All tests completed properly!"
    grep -A 10 "Test Suites:" all-tests-output.log | head -n 5
  fi
fi
exit $EXIT_CODE 