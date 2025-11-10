/**
 * Routes Index
 * Central routing configuration
 */

import { Router } from 'express';
import homeRoutes from './home.routes.js';

const router = Router();

// Mount API routes
router.use('/home', homeRoutes);

export default router;
