// Initialize tracing FIRST - this must be the very first import
import './tracing-init.js';

import AuditServiceApp from './app.js';

const app = new AuditServiceApp();

app.start().catch((error: any) => {
  console.error('Failed to start audit service:', error);
  process.exit(1);
});
