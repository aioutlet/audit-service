#!/bin/bash
# Run Audit Service with Dapr sidecar
# Usage: ./run.sh

echo "Starting Audit Service with Dapr..."
echo "Service will be available at: http://localhost:1012"
echo "Dapr HTTP endpoint: http://localhost:3512"
echo "Dapr gRPC endpoint: localhost:50012"
echo ""

dapr run \
  --app-id audit-service \
  --app-port 1012 \
  --dapr-http-port 3512 \
  --dapr-grpc-port 50012 \
  --resources-path .dapr/components \
  --config .dapr/config.yaml \
  --log-level warn \
  -- npx tsx watch src/server.ts
