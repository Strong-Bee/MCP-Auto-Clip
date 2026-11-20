// MCP Auto Clipper - Main entry point

import { config } from './config';
import { initializeDatabase, closeDatabase, startAutoPersist } from './config/database';
import { migrate } from './database/migrate';
import { startWorker } from './workers/jobWorker';
import { startMCPServer } from './mcp/server';

async function main(): Promise<void> {
  console.log('MCP Auto Clipper Starting...');
  console.log(`Version: ${config.mcpServerVersion}`);
  console.log(`Environment: ${config.nodeEnv}`);

  // Initialize database
  await initializeDatabase();
  console.log('Database initialized');

  // Run migrations
  await migrate();
  console.log('Migrations completed');

  // Start auto-persist
  startAutoPersist(30000);
  console.log('Auto-persist started');

  // Determine mode from command line args
  const args = process.argv.slice(2);
  const mode = args[0] || 'mcp';

  switch (mode) {
    case 'worker':
      console.log('Starting worker mode...');
      await startWorker();
      break;

    case 'mcp':
    default:
      console.log('Starting MCP server mode...');
      await startMCPServer();
      break;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  closeDatabase();
  process.exit(0);
});

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  closeDatabase();
  process.exit(1);
});