.PHONY: test test-coverage test-integration

test:
	go test ./... -v

test-coverage:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out

test-integration:
	go test ./tests/integration/... -v -tags=integration

lint:
	golangci-lint run
