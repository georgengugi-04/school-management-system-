import { Router } from 'express';
import {
  generateStudentReportCard, generateClassReport,
  getGradingScales, updateGradingScale
} from '../controllers/reportController';

const router = Router();

router.get('/student/:studentId/card', generateStudentReportCard);
router.get('/class/:classStreamId', generateClassReport);
router.get('/grading-scales', getGradingScales);
router.put('/grading-scales/:id', updateGradingScale);

export default router;
