import AuditServiceApp from './app';

const app = new AuditServiceApp();

app.start().catch((error: any) => {
  console.error('Failed to start audit service:', error);
  process.exit(1);
});
