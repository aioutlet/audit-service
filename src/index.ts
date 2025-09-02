// Initialize tracing FIRST - this must be the very first import
import { initializeTracing } from './observability/tracing/setup.js';

// Initialize OpenTelemetry before anything else
initializeTracing();

import AuditServiceApp from './app.js';

const app = new AuditServiceApp();

app.start().catch((error: any) => {
  console.error('Failed to start audit service:', error);
  process.exit(1);
});
