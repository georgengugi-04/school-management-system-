import { Router } from 'express';
import authRoutes from './authRoutes';
import studentRoutes from './studentRoutes';
import classStreamRoutes from './classStreamRoutes';
import subjectRoutes from './subjectRoutes';
import assessmentRoutes from './assessmentRoutes';
import reportRoutes from './reportRoutes';
import dashboardRoutes from './dashboardRoutes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/students', authenticate, studentRoutes);
router.use('/classes', authenticate, classStreamRoutes);
router.use('/subjects', authenticate, subjectRoutes);
router.use('/assessments', authenticate, assessmentRoutes);
router.use('/reports', authenticate, reportRoutes);

export default router;
