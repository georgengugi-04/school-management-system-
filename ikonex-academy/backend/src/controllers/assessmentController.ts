import { Request, Response } from 'express';
import prisma from '../config/database';
import { getGrade } from '../utils/helpers';
import {
  sendSuccess, sendCreated, sendError, sendNotFound, sendConflict,
  paginate, paginatedResponse
} from '../utils/response';

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, catScore, examScore, term, academicYear, remarks } = req.body;

    // Validate score ranges
    if (catScore < 0 || catScore > 40) {
      return sendError(res, 'CAT score must be between 0 and 40');
    }
    if (examScore < 0 || examScore > 60) {
      return sendError(res, 'Exam score must be between 0 and 60');
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { id: studentId, isActive: true } });
    if (!student) return sendNotFound(res, 'Student not found');

    // Verify subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId, isActive: true } });
    if (!subject) return sendNotFound(res, 'Subject not found');

    // Check for duplicate
    const existing = await prisma.assessment.findUnique({
      where: {
        studentId_subjectId_term_academicYear: {
          studentId, subjectId, term, academicYear,
        },
      },
    });
    if (existing) {
      return sendConflict(res, 'Assessment already exists for this student, subject, term and year');
    }

    const total = Number(catScore) + Number(examScore);
    const { grade, remarks: gradeRemarks } = await getGrade(total);

    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        subjectId,
        classStreamId: student.classStreamId,
        catScore: Number(catScore),
        examScore: Number(examScore),
        total,
        grade,
        term,
        academicYear,
        remarks: remarks || gradeRemarks,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        subject: { select: { id: true, name: true, code: true } },
        classStream: { select: { id: true, name: true } },
      },
    });

    return sendCreated(res, assessment, 'Assessment created successfully');
  } catch (error) {
    return sendError(res, 'Failed to create assessment', 500);
  }
};

export const updateAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { catScore, examScore, remarks } = req.body;

    const existing = await prisma.assessment.findUnique({ where: { id } });
    if (!existing) return sendNotFound(res, 'Assessment not found');

    const newCat = catScore !== undefined ? Number(catScore) : existing.catScore;
    const newExam = examScore !== undefined ? Number(examScore) : existing.examScore;

    if (newCat < 0 || newCat > 40) return sendError(res, 'CAT score must be 0-40');
    if (newExam < 0 || newExam > 60) return sendError(res, 'Exam score must be 0-60');

    const total = newCat + newExam;
    const { grade, remarks: gradeRemarks } = await getGrade(total);

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        catScore: newCat,
        examScore: newExam,
        total,
        grade,
        remarks: remarks || gradeRemarks,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return sendSuccess(res, assessment, 'Assessment updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update assessment', 500);
  }
};

export const deleteAssessment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assessment = await prisma.assessment.findUnique({ where: { id } });
    if (!assessment) return sendNotFound(res, 'Assessment not found');

    await prisma.assessment.delete({ where: { id } });
    return sendSuccess(res, null, 'Assessment deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete assessment', 500);
  }
};

export const getStudentAssessments = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;

    const student = await prisma.student.findUnique({
      where: { id: studentId, isActive: true },
    });
    if (!student) return sendNotFound(res, 'Student not found');

    const where: any = { studentId };
    if (term) where.term = term;
    if (academicYear) where.academicYear = String(academicYear);

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ academicYear: 'desc' }, { term: 'asc' }, { subject: { name: 'asc' } }],
    });

    // Calculate summary
    if (assessments.length > 0) {
      const total = assessments.reduce((sum, a) => sum + a.total, 0);
      const average = total / assessments.length;
      return sendSuccess(res, {
        assessments,
        summary: {
          totalSubjects: assessments.length,
          totalMarks: total,
          average: Math.round(average * 10) / 10,
        },
      });
    }

    return sendSuccess(res, { assessments, summary: null });
  } catch (error) {
    return sendError(res, 'Failed to fetch assessments', 500);
  }
};

export const getClassResults = async (req: Request, res: Response) => {
  try {
    const { classStreamId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) {
      return sendError(res, 'Term and academic year are required');
    }

    const students = await prisma.student.findMany({
      where: { classStreamId, isActive: true },
      include: {
        assessments: {
          where: { term: term as any, academicYear: String(academicYear) },
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    // Calculate results with positions
    const results = students.map((student) => {
      const totalMarks = student.assessments.reduce((sum, a) => sum + a.total, 0);
      const average = student.assessments.length > 0
        ? totalMarks / student.assessments.length
        : 0;
      return {
        student: {
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
        },
        assessments: student.assessments,
        totalMarks,
        average: Math.round(average * 10) / 10,
        subjects: student.assessments.length,
      };
    });

    // Rank by average
    results.sort((a, b) => b.average - a.average);
    const rankedResults = results.map((r, i) => ({ ...r, position: i + 1 }));

    // Subject statistics
    const subjects = await prisma.classSubject.findMany({
      where: { classStreamId },
      include: { subject: { select: { id: true, name: true, code: true } } },
    });

    const subjectStats = await Promise.all(
      subjects.map(async ({ subject }) => {
        const stats = await prisma.assessment.aggregate({
          where: { classStreamId, subjectId: subject.id, term: term as any, academicYear: String(academicYear) },
          _avg: { total: true },
          _max: { total: true },
          _min: { total: true },
          _count: true,
        });
        return {
          subject,
          average: stats._avg.total ? Math.round(stats._avg.total * 10) / 10 : 0,
          highest: stats._max.total || 0,
          lowest: stats._min.total || 0,
          count: stats._count,
        };
      })
    );

    return sendSuccess(res, { results: rankedResults, subjectStats });
  } catch (error) {
    return sendError(res, 'Failed to get class results', 500);
  }
};

export const bulkCreateAssessments = async (req: Request, res: Response) => {
  try {
    const { assessments } = req.body;

    if (!Array.isArray(assessments) || assessments.length === 0) {
      return sendError(res, 'Assessments array is required');
    }

    const results = [];
    const errors = [];

    for (const item of assessments) {
      try {
        const { studentId, subjectId, catScore, examScore, term, academicYear } = item;

        if (catScore < 0 || catScore > 40 || examScore < 0 || examScore > 60) {
          errors.push({ ...item, error: 'Invalid score range' });
          continue;
        }

        const student = await prisma.student.findUnique({ where: { id: studentId, isActive: true } });
        if (!student) { errors.push({ ...item, error: 'Student not found' }); continue; }

        const total = Number(catScore) + Number(examScore);
        const { grade, remarks } = await getGrade(total);

        const assessment = await prisma.assessment.upsert({
          where: {
            studentId_subjectId_term_academicYear: { studentId, subjectId, term, academicYear },
          },
          update: { catScore: Number(catScore), examScore: Number(examScore), total, grade, remarks },
          create: {
            studentId, subjectId,
            classStreamId: student.classStreamId,
            catScore: Number(catScore),
            examScore: Number(examScore),
            total, grade, remarks, term, academicYear,
          },
        });
        results.push(assessment);
      } catch (e) {
        errors.push({ ...item, error: 'Failed to process' });
      }
    }

    return sendSuccess(res, {
      created: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    }, `${results.length} assessments processed`);
  } catch (error) {
    return sendError(res, 'Bulk import failed', 500);
  }
};
