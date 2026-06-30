import { Router } from 'express';
import { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject } from '../controllers/subjectController';
import { isAdmin } from '../middleware/auth';
import { body } from 'express-validator';
import { validate } from '../middleware/notFoundHandler';

const router = Router();

router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/',
  isAdmin,
  [
    body('name').notEmpty().trim().isLength({ min: 2 }),
    body('code').notEmpty().trim().toUpperCase().isLength({ min: 2, max: 10 }),
    body('description').optional().trim(),
  ],
  validate,
  createSubject
);
router.put('/:id', isAdmin, updateSubject);
router.delete('/:id', isAdmin, deleteSubject);

export default router;
