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

run_cloud_provider_kind() {
    log "Running cloud-provider-kind..."
    cloud-provider-kind &> /tmp/cloud-provider-kind.log & echo $! > /tmp/cloud-provider-kind.pid 
    log "cloud-provider-kind running with PID: $(cat /tmp/cloud-provider-kind.pid)"
    log "Logs: /tmp/cloud-provider-kind.log"
}
stop_cloud_provider_kind() {
    log "Stopping cloud-provider-kind..."
    kill -9 $(cat /tmp/cloud-provider-kind.pid)
    rm /tmp/cloud-provider-kind.pid
}
check_cloud_provider_kind_running() {
    if [ -f /tmp/cloud-provider-kind.pid ]; then
        if ps -p $(cat /tmp/cloud-provider-kind.pid) &> /dev/null; then
            log "cloud-provider-kind running with PID: $(cat /tmp/cloud-provider-kind.pid)"
            return 0
        else
            log "cloud-provider-kind not running"
            return 1
        fi
    else
        log "cloud-provider-kind not running"
        return 1
    fi
}

# Check if cluster exists
if kind get clusters | grep -q "^uet-local$"; then
    log "Cluster 'uet-local' already exists"
else
    log "Creating KIND cluster..."
    kind create cluster --config cluster-config.yaml
fi

if command -v cloud-provider-kind 
then
    log "cloud-provider-kind already installed"
    log "Skipping installation"
    if check_cloud_provider_kind_running; then
        log "cloud-provider-kind was running, stopping..."
        stop_cloud_provider_kind
    fi
    log "Starting cloud-provider-kind..."
    run_cloud_provider_kind
else
    # Install cloud-provider-kind
    log "Installing cloud-provider-kind..."
    go install sigs.k8s.io/cloud-provider-kind@latest 
    run_cloud_provider_kind
fi

# Update helm dependencies
log "Updating Helm dependencies..."
cd ../../helm/uet-common && helm dependency update && cd -

# Install infrastructure components
log "Installing infrastructure components..."
helm upgrade --install uet-infra ../../helm/uet-common \
    --namespace uet-system \
    --create-namespace \
    --values ../../values/base/common.yaml \
    --values ../../values/local/common.yaml \
    --debug \
    --timeout 180s \
    --wait

log "Waiting for Kong to be ready..."
kubectl wait --namespace uet-system \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/instance=uet-infra \
    --timeout=180s 