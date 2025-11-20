import { Router } from 'express';
import {health, readiness, liveness, metrics} from '../controllers/operational.controller.js';

const router = Router();

// Health endpoints
router.get('/health', health as any);
router.get('/readiness', readiness as any);
router.get('/liveness', liveness as any);
router.get('/metrics', metrics as any);

export default router;
