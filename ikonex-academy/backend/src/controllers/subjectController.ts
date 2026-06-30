import { Request, Response } from 'express';
import prisma from '../config/database';
import {
  sendSuccess, sendCreated, sendError, sendNotFound, sendConflict
} from '../utils/response';

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;
    const upperCode = code.toUpperCase();

    const nameExists = await prisma.subject.findUnique({ where: { name } });
    if (nameExists) return sendConflict(res, 'Subject with this name already exists');

    const codeExists = await prisma.subject.findUnique({ where: { code: upperCode } });
    if (codeExists) return sendConflict(res, 'Subject code already in use');

    const subject = await prisma.subject.create({
      data: { name, code: upperCode, description },
    });

    return sendCreated(res, subject, 'Subject created successfully');
  } catch (error) {
    return sendError(res, 'Failed to create subject', 500);
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { code: { contains: String(search) } },
      ];
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        _count: { select: { classSubjects: true, assessments: true } },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, subjects);
  } catch (error) {
    return sendError(res, 'Failed to fetch subjects', 500);
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        classSubjects: {
          include: { classStream: { select: { id: true, name: true } } },
        },
      },
    });

    if (!subject) return sendNotFound(res, 'Subject not found');
    return sendSuccess(res, subject);
  } catch (error) {
    return sendError(res, 'Failed to fetch subject', 500);
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.subject.findUnique({ where: { id, isActive: true } });
    if (!existing) return sendNotFound(res, 'Subject not found');

    const { name, code, description } = req.body;
    const upperCode = code ? code.toUpperCase() : undefined;

    if (name && name !== existing.name) {
      const nameExists = await prisma.subject.findUnique({ where: { name } });
      if (nameExists) return sendConflict(res, 'Subject name already in use');
    }

    if (upperCode && upperCode !== existing.code) {
      const codeExists = await prisma.subject.findUnique({ where: { code: upperCode } });
      if (codeExists) return sendConflict(res, 'Subject code already in use');
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(upperCode && { code: upperCode }),
        ...(description !== undefined && { description }),
      },
    });

    return sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update subject', 500);
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.findUnique({ where: { id, isActive: true } });
    if (!subject) return sendNotFound(res, 'Subject not found');

    const assessmentCount = await prisma.assessment.count({ where: { subjectId: id } });
    if (assessmentCount > 0) {
      return sendError(res, `Cannot delete: ${assessmentCount} assessments exist for this subject`);
    }

    await prisma.subject.update({ where: { id }, data: { isActive: false } });
    return sendSuccess(res, null, 'Subject deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete subject', 500);
  }
};
