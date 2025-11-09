#!/bin/bash

# Run Audit Service with Dapr sidecar

APP_ID="audit-service"
APP_PORT=9000
DAPR_HTTP_PORT=3500
DAPR_GRPC_PORT=50008
COMPONENTS_PATH="./.dapr/components"
CONFIG_PATH="./.dapr/config.yaml"

echo "Starting Audit Service (Consumer) with Dapr..."

dapr run \
  --app-id $APP_ID \
  --app-port $APP_PORT \
  --dapr-http-port $DAPR_HTTP_PORT \
  --dapr-grpc-port $DAPR_GRPC_PORT \
  --components-path $COMPONENTS_PATH \
  --config $CONFIG_PATH \
  --log-level info \
  -- npm start
