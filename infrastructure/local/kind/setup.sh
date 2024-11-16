#!/bin/bash
set -e

echo "Creating KIND cluster..."
kind create cluster --config cluster-config.yaml

echo "Adding Helm repositories..."
helm repo add kong https://charts.konghq.com
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

echo "Creating namespaces..."
kubectl create namespace kong
kubectl create namespace argocd
kubectl create namespace monitoring

echo "Cluster setup complete!" 