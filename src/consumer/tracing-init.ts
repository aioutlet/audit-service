// This file must be imported FIRST, before any other modules
// OpenTelemetry auto-instrumentation needs to be loaded before the application code

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Check if tracing should be enabled
const environment = process.env.NODE_ENV || 'development';
const enableTracing = process.env.ENABLE_TRACING !== 'false' && environment !== 'test';

if (enableTracing) {
  console.log('Initializing OpenTelemetry tracing for audit-service...');

  try {
    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: {},
      }),
      serviceName: process.env.NAME || process.env.OTEL_SERVICE_NAME || 'audit-service',
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable file system instrumentation that can be noisy
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });

    sdk.start();
    console.log('✅ OpenTelemetry tracing initialized successfully for audit-service');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(() => console.log('Audit service tracing terminated'))
        .catch((error) => console.error('Error terminating audit service tracing', error))
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.warn('⚠️ Failed to initialize OpenTelemetry for audit-service:', (error as Error).message);
  }
} else {
  console.log('Tracing disabled for audit-service environment:', environment);
}
