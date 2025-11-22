#!/bin/bash
set -e

echo "🚀 Deploying LiveKit Dashboard to Kubernetes..."
echo ""

# Check if namespace exists
if ! kubectl get namespace livekit &>/dev/null; then
    echo "❌ Namespace 'livekit' does not exist. Creating it..."
    kubectl create namespace livekit
fi

echo "✅ Namespace 'livekit' exists"
echo ""

# Step 1: Create database secret
echo "📦 Step 1: Creating database secret..."
kubectl apply -f database-secret.yaml
kubectl get secret livekit-dashboard-db -n livekit
echo "✅ Secret created"
echo ""

# Step 2: Create postgres configmap
echo "📦 Step 2: Creating postgres configmap..."
kubectl apply -f postgres-configmap.yaml
echo "✅ ConfigMap created"
echo ""

# Step 3: Initialize database
echo "📦 Step 3: Initializing database..."
kubectl apply -f database-init-job.yaml
echo "⏳ Waiting for database init job to complete..."
if kubectl wait --for=condition=complete job/livekit-dashboard-db-init -n livekit --timeout=120s 2>/dev/null; then
    echo "✅ Database initialized"
else
    echo "⚠️  Job may have failed or already completed. Checking logs..."
    kubectl logs -n livekit job/livekit-dashboard-db-init --tail=50
fi
echo ""

# Step 4: Create migration SQL ConfigMap
echo "📦 Step 4: Creating migration SQL ConfigMap..."
kubectl apply -f database-migration-sql-configmap.yaml
echo "✅ Migration SQL ConfigMap created"
echo ""

# Step 5: Run database migrations
echo "📦 Step 5: Running database migrations..."
kubectl delete job livekit-dashboard-db-migrate -n livekit 2>/dev/null || true
kubectl apply -f database-migration-job.yaml
echo "⏳ Waiting for migration job to complete..."
if kubectl wait --for=condition=complete job/livekit-dashboard-db-migrate -n livekit --timeout=180s 2>/dev/null; then
    echo "✅ Migrations completed"
    kubectl logs -n livekit job/livekit-dashboard-db-migrate --tail=20
else
    echo "⚠️  Migration job may have failed. Checking logs..."
    kubectl logs -n livekit job/livekit-dashboard-db-migrate --tail=50
    exit 1
fi
echo ""

# Step 6: Create docker registry secret (if not exists)
echo "📦 Step 6: Creating docker registry secret..."
if ! kubectl get secret registry-bionicaisolutions-com -n livekit &>/dev/null; then
    kubectl apply -f docker-registry-secret.yaml
    echo "✅ Registry secret created"
else
    echo "✅ Registry secret already exists"
fi
echo ""

# Step 7: Deploy application
echo "📦 Step 7: Deploying application..."
kubectl apply -f app-deployment.yaml
echo "⏳ Waiting for deployment to be ready..."
if kubectl wait --for=condition=available deployment/livekit-dashboard -n livekit --timeout=300s 2>/dev/null; then
    echo "✅ Application deployed"
else
    echo "⚠️  Deployment may still be starting. Checking status..."
    kubectl get pods -n livekit -l app=livekit-dashboard
fi
echo ""

# Step 8: Create services
echo "📦 Step 8: Creating services..."
kubectl apply -f app-service.yaml
echo "✅ Services created"
echo ""

# Step 9: Show status
echo "📊 Deployment Status:"
echo ""
echo "Pods:"
kubectl get pods -n livekit -l app=livekit-dashboard
echo ""
echo "Services:"
kubectl get svc -n livekit -l app=livekit-dashboard
echo ""
echo "Deployment:"
kubectl get deployment livekit-dashboard -n livekit
echo ""

# Step 10: Show connection info
echo "🔗 Connection Information:"
echo ""
LB_IP=$(kubectl get svc livekit-dashboard-lb -n livekit -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
echo "LoadBalancer IP: $LB_IP:3000"
echo ""
echo "To access the dashboard:"
echo "  kubectl port-forward -n livekit svc/livekit-dashboard 3000:3000"
echo ""
echo "✅ Deployment complete!"
