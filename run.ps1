#!/usr/bin/env pwsh
# Run Audit Service with Dapr sidecar
# Usage: .\run.ps1

Write-Host "Starting Audit Service with Dapr..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:1012" -ForegroundColor Cyan
Write-Host "Dapr HTTP endpoint: http://localhost:3512" -ForegroundColor Cyan
Write-Host "Dapr gRPC endpoint: localhost:50012" -ForegroundColor Cyan
Write-Host ""

dapr run `
  --app-id audit-service `
  --app-port 1012 `
  --dapr-http-port 3512 `
  --dapr-grpc-port 50012 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- npx tsx watch src/server.ts
