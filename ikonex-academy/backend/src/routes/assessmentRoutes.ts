import { Router } from 'express';
import {
  createAssessment, updateAssessment, deleteAssessment,
  getStudentAssessments, getClassResults, bulkCreateAssessments
} from '../controllers/assessmentController';
import { isAdmin } from '../middleware/auth';
import { body } from 'express-validator';
import { validate } from '../middleware/notFoundHandler';

const router = Router();

router.get('/student/:studentId', getStudentAssessments);
router.get('/class/:classStreamId/results', getClassResults);
router.post('/',
  isAdmin,
  [
    body('studentId').notEmpty(),
    body('subjectId').notEmpty(),
    body('catScore').isFloat({ min: 0, max: 40 }),
    body('examScore').isFloat({ min: 0, max: 60 }),
    body('term').isIn(['TERM_1', 'TERM_2', 'TERM_3']),
    body('academicYear').matches(/^\d{4}$/),
  ],
  validate,
  createAssessment
);
router.post('/bulk', isAdmin, bulkCreateAssessments);
router.put('/:id', isAdmin, updateAssessment);
router.delete('/:id', isAdmin, deleteAssessment);

export default router;
