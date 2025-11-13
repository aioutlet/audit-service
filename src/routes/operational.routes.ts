/**
 * Operational Routes
 * Routes for health, readiness, liveness, and metrics endpoints
 */

import { Router } from 'express';
import * as operationalController from '../controllers/operational.controller.js';

const router = Router();

// Health endpoints
router.get('/health', operationalController.health as any);
router.get('/health/readiness', operationalController.readiness as any);
router.get('/health/liveness', operationalController.liveness as any);

// Metrics endpoint
router.get('/metrics', operationalController.metrics as any);

export default router;
