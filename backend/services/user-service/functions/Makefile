# Variables
PROJECT_DIR = .
NPM = npm

# Declare all phony targets at once
.PHONY: help install build serve deploy clean test

# Default target
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make build      - Build the project"
	@echo "  make serve      - Run Firebase emulators"
	@echo "  make deploy     - Deploy to Firebase"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean build artifacts"

# Install dependencies
install:
	@cd $(PROJECT_DIR) || exit 1; $(NPM) install

# Build the project
build:
	@cd $(PROJECT_DIR) || exit 1; $(NPM) run build

# Run Firebase emulators
serve: build
	@cd $(PROJECT_DIR) || exit 1; firebase emulators:start --only functions

# Deploy to Firebase
deploy: build
	@cd $(PROJECT_DIR) || exit 1; firebase deploy --only functions

# Run tests
test:
	@cd $(PROJECT_DIR) || exit 1; $(NPM) test

# Clean build artifacts
clean:
	@cd $(PROJECT_DIR) || exit 1; \
	if [ -d "lib" ]; then rm -rf lib; fi; \
	if [ -d "node_modules" ]; then rm -rf node_modules; fi 