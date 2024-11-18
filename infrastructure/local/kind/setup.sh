#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to echo with timestamp
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${GREEN}$1${NC}"
}

# Check if cluster exists
if kind get clusters | grep -q "^uet-local$"; then
    log "Cluster 'uet-local' already exists"
else
    log "Creating KIND cluster..."
    kind create cluster --config cluster-config.yaml
fi

# Update helm dependencies
log "Updating Helm dependencies..."
cd ../helm/uet-common && helm dependency update && cd ../../local/kind

# Install infrastructure components using our Helm chart
log "Installing infrastructure components..."
helm upgrade --install uet-infra ../helm/uet-common \
    --namespace uet-system \
    --create-namespace \
    --values ../values/base/common.yaml \
    --values ../values/local/common.yaml \
    --wait

log "Waiting for all components to be ready..."
kubectl wait --namespace uet-system \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/instance=uet-infra \
    --timeout=180s

KONG_PROXY_IP=$(kubectl get svc -n kong kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
log "Kong Proxy IP: ${KONG_PROXY_IP}" 