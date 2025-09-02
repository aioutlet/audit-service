/**
 * Correlation ID helper utilities for distributed tracing
 */

class CorrelationIdHelper {
  /**
   * Extract correlation ID from request object
   * @param req - Express request object
   * @returns Correlation ID string
   */
  static getCorrelationId(req: any): string {
    return req.correlationId || 'unknown';
  }

  /**
   * Create headers object with correlation ID for service-to-service calls
   * @param req - Express request object
   * @returns Headers object with correlation ID
   */
  static createHeaders(req: any): Record<string, string> {
    return {
      'X-Correlation-ID': this.getCorrelationId(req),
      'Content-Type': 'application/json',
    };
  }

  /**
   * Log message with correlation ID context
   * @param req - Express request object
   * @param message - Log message
   * @param logData - Additional log data
   * @param level - Log level (default: 'info')
   */
  static log(req: any, message: string, logData: any = {}, level: string = 'info'): void {
    const correlationId = this.getCorrelationId(req);

    const logEntry = {
      correlationId,
      message,
      ...logData,
    };

    // Use console methods directly based on level
    switch (level) {
      case 'error':
        console.error(`[${correlationId}] ${message}`, logData);
        break;
      case 'warn':
        console.warn(`[${correlationId}] ${message}`, logData);
        break;
      case 'debug':
        console.debug(`[${correlationId}] ${message}`, logData);
        break;
      default:
        console.log(`[${correlationId}] ${message}`, logData);
    }
  }
}

export default CorrelationIdHelper;
