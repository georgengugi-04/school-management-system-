import { Router } from 'express';
import {
  createClassStream, getClassStreams, getClassStreamById,
  updateClassStream, deleteClassStream, assignSubjectsToClass
} from '../controllers/classStreamController';
import { isAdmin } from '../middleware/auth';
import { body } from 'express-validator';
import { validate } from '../middleware/notFoundHandler';

const router = Router();

router.get('/', getClassStreams);
router.get('/:id', getClassStreamById);
router.post('/',
  isAdmin,
  [
    body('name').notEmpty().trim(),
    body('level').isInt({ min: 1, max: 6 }),
    body('stream').notEmpty().trim().isLength({ max: 5 }),
  ],
  validate,
  createClassStream
);
router.put('/:id', isAdmin, updateClassStream);
router.delete('/:id', isAdmin, deleteClassStream);
router.post('/:id/subjects', isAdmin, assignSubjectsToClass);

export default router;
