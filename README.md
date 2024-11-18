# Ultimate Expense Tracker

A Progressive Web Application for tracking personal and group expenses.

## Project Structure
- `frontend/`: React PWA frontend application
- `backend/`: Microservices backend
  - `services/`: Individual microservices
  - `proto/`: Protocol buffer definitions
  - `pkg/`: Shared packages
- `ml/`: Machine Learning components
  - `receipt-scanner/`: Receipt scanning service
  - `expense-suggester/`: Expense suggestion service
- `infrastructure/`: Infrastructure and deployment configurations
  - `helm/`: Helm charts
    - `uet-common/`: Infrastructure components
    - `uet-apps/`: Application services
  - `terraform/`: Cloud infrastructure
    - `aws/`: AWS specific
    - `gcp/`: GCP specific
  - `values/`: Environment values
    - `base/`: Base configurations
    - `local/`: Local environment
    - `cloud/`: Cloud environments
  - `local/`: Local development
    - `kind/`: KIND cluster setup
- `docker/`: Dockerfile and compose files
- `docs/`: Project documentation

## Prerequisites
- Docker
- kubectl
- Helm
- KIND
- Terraform (for cloud deployment)

## Local Development Setup
1. Clone the repository
2. Run infrastructure setup:
   ```bash
   cd infrastructure/local/kind
   ./setup.sh
   ```
3. Access services:
   - Kong Admin: http://localhost:8001
   - ArgoCD: http://localhost/argocd
   - Grafana: http://localhost/grafana

## Features
[To be added]
