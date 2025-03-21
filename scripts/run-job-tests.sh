#!/bin/bash

# Script for running job tests with options to prevent hanging

# Set terminal colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Navigate to the project root
cd "$(dirname "$0")/.."

echo -e "${YELLOW}Running job tests with forceExit and detectOpenHandles flags...${NC}"

# Run the test with forceExit and detectOpenHandles flags
TEST_ENV=server NODE_ENV=test node --experimental-vm-modules node_modules/jest/bin/jest.js \
  --forceExit \
  --detectOpenHandles \
  --runInBand \
  tests/server/features/tournament/jobs/

echo -e "${GREEN}Job tests completed${NC}" 