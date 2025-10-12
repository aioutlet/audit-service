// Industry-standard initialization pattern:
// 1. Initialize observability modules (logger, tracing) - uses console.log for bootstrap
// 2. Start application

import './observability/logging/logger.js';
import './observability/tracing/setup.js';

import AuditServiceApp from './app.js';

const app = new AuditServiceApp();

app.start().catch((error: any) => {
  console.error('Failed to start audit service:', error);
  process.exit(1);
});
