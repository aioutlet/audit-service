/**
 * Dapr Server Service
 * Manages Dapr server initialization and lifecycle
 */

import { DaprServer, CommunicationProtocolEnum } from '@dapr/dapr';
import logger from '../core/logger.js';
import { config } from '../config/index.js';

/**
 * Singleton Dapr Server Manager
 */
class DaprServerService {
  private static instance: DaprServerService;
  private daprServer: DaprServer | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DaprServerService {
    if (!DaprServerService.instance) {
      DaprServerService.instance = new DaprServerService();
    }
    return DaprServerService.instance;
  }

  /**
   * Initialize Dapr server for event subscriptions
   */
  public async initialize(): Promise<DaprServer> {
    if (this.daprServer) {
      logger.warn('Dapr server already initialized');
      return this.daprServer;
    }

    const appPort = config.port || 9000;
    const daprHost = config.dapr.host;
    const daprPort = config.dapr.httpPort;

    this.daprServer = new DaprServer({
      serverHost: '0.0.0.0',
      serverPort: appPort.toString(),
      clientOptions: {
        daprHost,
        daprPort: String(daprPort),
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      },
    });

    logger.info('Dapr server initialized', {
      daprHost,
      daprPort,
      appPort,
    });

    return this.daprServer;
  }

  /**
   * Get the initialized Dapr server
   */
  public getServer(): DaprServer | null {
    return this.daprServer;
  }

  /**
   * Start the Dapr server
   */
  public async start(): Promise<void> {
    if (!this.daprServer) {
      throw new Error('Dapr server not initialized. Call initialize() first.');
    }

    await this.daprServer.start();
    logger.info('Dapr server started successfully');
  }

  /**
   * Stop the Dapr server
   */
  public async stop(): Promise<void> {
    if (!this.daprServer) {
      logger.warn('Dapr server not initialized, nothing to stop');
      return;
    }

    await this.daprServer.stop();
    logger.info('Dapr server stopped');
    this.daprServer = null;
  }
}

// Export singleton instance
export default DaprServerService.getInstance();
