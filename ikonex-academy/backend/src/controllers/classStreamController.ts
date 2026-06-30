import { Request, Response } from 'express';
import prisma from '../config/database';
import {
  sendSuccess, sendCreated, sendError, sendNotFound, sendConflict
} from '../utils/response';

export const createClassStream = async (req: Request, res: Response) => {
  try {
    const { name, level, stream, description } = req.body;

    const existing = await prisma.classStream.findUnique({ where: { name } });
    if (existing) return sendConflict(res, 'Class stream with this name already exists');

    const classStream = await prisma.classStream.create({
      data: { name, level: Number(level), stream, description },
      include: {
        _count: { select: { students: true, classSubjects: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'ClassStream',
        entityId: classStream.id,
        description: `Class stream ${classStream.name} created`,
        userId: req.user?.userId,
      },
    });

    return sendCreated(res, classStream, 'Class stream created successfully');
  } catch (error) {
    return sendError(res, 'Failed to create class stream', 500);
  }
};

export const getClassStreams = async (req: Request, res: Response) => {
  try {
    const classStreams = await prisma.classStream.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { students: true, classSubjects: true } },
        classSubjects: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: [{ level: 'asc' }, { stream: 'asc' }],
    });

    // Calculate average performance for each class
    const classesWithPerformance = await Promise.all(
      classStreams.map(async (cls) => {
        const avgResult = await prisma.assessment.aggregate({
          where: { classStreamId: cls.id },
          _avg: { total: true },
        });

        return {
          ...cls,
          averagePerformance: avgResult._avg.total
            ? Math.round(avgResult._avg.total * 10) / 10
            : 0,
        };
      })
    );

    return sendSuccess(res, classesWithPerformance);
  } catch (error) {
    return sendError(res, 'Failed to fetch class streams', 500);
  }
};

export const getClassStreamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classStream = await prisma.classStream.findUnique({
      where: { id, isActive: true },
      include: {
        students: {
          where: { isActive: true },
          select: {
            id: true, admissionNumber: true,
            firstName: true, lastName: true, gender: true,
          },
          orderBy: { firstName: 'asc' },
        },
        classSubjects: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
        _count: { select: { students: true } },
      },
    });

    if (!classStream) return sendNotFound(res, 'Class stream not found');

    const avgResult = await prisma.assessment.aggregate({
      where: { classStreamId: id },
      _avg: { total: true },
    });

    return sendSuccess(res, {
      ...classStream,
      averagePerformance: avgResult._avg.total
        ? Math.round(avgResult._avg.total * 10) / 10
        : 0,
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch class stream', 500);
  }
};

export const updateClassStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.classStream.findUnique({ where: { id, isActive: true } });
    if (!existing) return sendNotFound(res, 'Class stream not found');

    const { name, level, stream, description } = req.body;

    if (name && name !== existing.name) {
      const nameExists = await prisma.classStream.findUnique({ where: { name } });
      if (nameExists) return sendConflict(res, 'Class stream name already in use');
    }

    const classStream = await prisma.classStream.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(level && { level: Number(level) }),
        ...(stream && { stream }),
        ...(description !== undefined && { description }),
      },
    });

    return sendSuccess(res, classStream, 'Class stream updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update class stream', 500);
  }
};

export const deleteClassStream = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cls = await prisma.classStream.findUnique({ where: { id, isActive: true } });
    if (!cls) return sendNotFound(res, 'Class stream not found');

    // Check for students
    const studentCount = await prisma.student.count({
      where: { classStreamId: id, isActive: true },
    });
    if (studentCount > 0) {
      return sendError(res, `Cannot delete: ${studentCount} students are assigned to this class`);
    }

    await prisma.classStream.update({ where: { id }, data: { isActive: false } });

    return sendSuccess(res, null, 'Class stream deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete class stream', 500);
  }
};

export const assignSubjectsToClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subjectIds } = req.body;

    const cls = await prisma.classStream.findUnique({ where: { id, isActive: true } });
    if (!cls) return sendNotFound(res, 'Class stream not found');

    // Remove existing assignments
    await prisma.classSubject.deleteMany({ where: { classStreamId: id } });

    // Add new assignments
    if (subjectIds && subjectIds.length > 0) {
      await prisma.classSubject.createMany({
        data: subjectIds.map((subjectId: string) => ({
          classStreamId: id,
          subjectId,
        })),
        skipDuplicates: true,
      });
    }

    const updated = await prisma.classStream.findUnique({
      where: { id },
      include: {
        classSubjects: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    return sendSuccess(res, updated, 'Subjects assigned successfully');
  } catch (error) {
    return sendError(res, 'Failed to assign subjects', 500);
  }
};
