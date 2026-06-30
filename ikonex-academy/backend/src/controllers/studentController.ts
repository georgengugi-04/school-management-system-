import { Request, Response } from 'express';
import prisma from '../config/database';
import { generateAdmissionNumber } from '../utils/helpers';
import {
  sendSuccess, sendCreated, sendError, sendNotFound,
  sendConflict, paginate, paginatedResponse
} from '../utils/response';

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, gender, dateOfBirth, parentName, parentPhone,
      email, address, classStreamId } = req.body;

    // Verify class stream exists
    const classStream = await prisma.classStream.findUnique({
      where: { id: classStreamId },
    });
    if (!classStream) return sendNotFound(res, 'Class stream not found');

    // Check email uniqueness if provided
    if (email) {
      const existing = await prisma.student.findFirst({ where: { email } });
      if (existing) return sendConflict(res, 'Student with this email already exists');
    }

    const admissionNumber = await generateAdmissionNumber();

    const student = await prisma.student.create({
      data: {
        admissionNumber,
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        parentName,
        parentPhone,
        email,
        address,
        classStreamId,
      },
      include: { classStream: { select: { id: true, name: true } } },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'Student',
        entityId: student.id,
        description: `Student ${student.firstName} ${student.lastName} (${student.admissionNumber}) enrolled`,
        userId: req.user?.userId,
      },
    });

    return sendCreated(res, student, 'Student registered successfully');
  } catch (error) {
    return sendError(res, 'Failed to create student', 500);
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, classStreamId, gender } = req.query;
    const { skip, take } = paginate(Number(page), Number(limit));

    const where: any = { isActive: true };
    if (classStreamId) where.classStreamId = classStreamId;
    if (gender) where.gender = gender;
    if (search) {
      where.OR = [
        { firstName: { contains: String(search) } },
        { lastName: { contains: String(search) } },
        { admissionNumber: { contains: String(search) } },
        { email: { contains: String(search) } },
        { parentName: { contains: String(search) } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        include: { classStream: { select: { id: true, name: true } } },
        orderBy: { admissionNumber: 'asc' },
      }),
      prisma.student.count({ where }),
    ]);

    return sendSuccess(
      res,
      paginatedResponse(students, total, Number(page), Number(take))
    );
  } catch (error) {
    return sendError(res, 'Failed to fetch students', 500);
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        classStream: { select: { id: true, name: true, level: true, stream: true } },
        assessments: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: [{ academicYear: 'desc' }, { term: 'asc' }],
        },
      },
    });

    if (!student) return sendNotFound(res, 'Student not found');
    return sendSuccess(res, student);
  } catch (error) {
    return sendError(res, 'Failed to fetch student', 500);
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.student.findUnique({ where: { id, isActive: true } });
    if (!existing) return sendNotFound(res, 'Student not found');

    const { firstName, lastName, gender, dateOfBirth, parentName, parentPhone,
      email, address, classStreamId } = req.body;

    if (classStreamId) {
      const cls = await prisma.classStream.findUnique({ where: { id: classStreamId } });
      if (!cls) return sendNotFound(res, 'Class stream not found');
    }

    if (email && email !== existing.email) {
      const emailExists = await prisma.student.findFirst({
        where: { email, id: { not: id } },
      });
      if (emailExists) return sendConflict(res, 'Email already in use');
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(gender && { gender }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(parentName && { parentName }),
        ...(parentPhone && { parentPhone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(classStreamId && { classStreamId }),
      },
      include: { classStream: { select: { id: true, name: true } } },
    });

    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Student',
        entityId: student.id,
        description: `Student ${student.firstName} ${student.lastName} updated`,
        userId: req.user?.userId,
      },
    });

    return sendSuccess(res, student, 'Student updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update student', 500);
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id, isActive: true } });
    if (!student) return sendNotFound(res, 'Student not found');

    // Soft delete
    await prisma.student.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'Student',
        entityId: id,
        description: `Student ${student.firstName} ${student.lastName} removed`,
        userId: req.user?.userId,
      },
    });

    return sendSuccess(res, null, 'Student deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete student', 500);
  }
};

export const getStudentsByClass = async (req: Request, res: Response) => {
  try {
    const { classStreamId } = req.params;
    const students = await prisma.student.findMany({
      where: { classStreamId, isActive: true },
      include: { classStream: { select: { name: true } } },
      orderBy: { firstName: 'asc' },
    });
    return sendSuccess(res, students);
  } catch (error) {
    return sendError(res, 'Failed to fetch students', 500);
  }
};
