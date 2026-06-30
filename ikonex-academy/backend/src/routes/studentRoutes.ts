import { Router } from 'express';
import {
  createStudent, getStudents, getStudentById,
  updateStudent, deleteStudent, getStudentsByClass
} from '../controllers/studentController';
import { body, param } from 'express-validator';
import { validate } from '../middleware/notFoundHandler';
import { isAdmin } from '../middleware/auth';

const router = Router();

const studentValidation = [
  body('firstName').notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('lastName').notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('gender').isIn(['MALE', 'FEMALE']),
  body('dateOfBirth').isISO8601(),
  body('parentName').notEmpty().trim(),
  body('parentPhone').notEmpty().matches(/^(\+254|0)[17]\d{8}$/),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('classStreamId').notEmpty().isString(),
];

router.get('/', getStudents);
router.get('/class/:classStreamId', getStudentsByClass);
router.get('/:id', [param('id').notEmpty()], validate, getStudentById);
router.post('/', isAdmin, studentValidation, validate, createStudent);
router.put('/:id', isAdmin, studentValidation, validate, updateStudent);
router.delete('/:id', isAdmin, deleteStudent);

export default router;
