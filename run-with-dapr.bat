@echo off
REM Run Audit Service with Dapr sidecar

set APP_ID=audit-service
set APP_PORT=9000
set DAPR_HTTP_PORT=3500
set DAPR_GRPC_PORT=50008
set COMPONENTS_PATH=.\.dapr\components
set CONFIG_PATH=.\.dapr\config.yaml

echo Starting Audit Service (Consumer) with Dapr...

dapr run ^
  --app-id %APP_ID% ^
  --app-port %APP_PORT% ^
  --dapr-http-port %DAPR_HTTP_PORT% ^
  --dapr-grpc-port %DAPR_GRPC_PORT% ^
  --components-path %COMPONENTS_PATH% ^
  --config %CONFIG_PATH% ^
  --log-level info ^
  -- npm start
