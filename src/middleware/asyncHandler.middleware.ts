/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors and pass them to error middleware
 * Eliminates need for try-catch blocks in every controller function
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async function to catch any errors and pass them to next()
 * @param fn - Async route handler function
 * @returns Express middleware function
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
): (req: T, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
