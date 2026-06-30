import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      totalClasses,
      totalSubjects,
      avgPerformance,
      recentStudents,
      recentActivities,
      genderStats,
      classPerformance,
    ] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.classStream.count({ where: { isActive: true } }),
      prisma.subject.count({ where: { isActive: true } }),
      prisma.assessment.aggregate({ _avg: { total: true } }),
      prisma.student.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { classStream: { select: { name: true } } },
        select: {
          id: true, admissionNumber: true,
          firstName: true, lastName: true,
          classStream: true, createdAt: true,
        },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.groupBy({
        by: ['gender'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.classStream.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { students: true } },
        },
        take: 6,
        orderBy: [{ level: 'asc' }, { stream: 'asc' }],
      }),
    ]);

    // Get performance per class
    const classesWithPerf = await Promise.all(
      classPerformance.map(async (cls) => {
        const perf = await prisma.assessment.aggregate({
          where: { classStreamId: cls.id },
          _avg: { total: true },
        });
        return {
          name: cls.name,
          students: cls._count.students,
          average: perf._avg.total ? Math.round(perf._avg.total * 10) / 10 : 0,
        };
      })
    );

    // Monthly enrollment trend (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await prisma.student.count({
        where: {
          isActive: true,
          createdAt: { gte: start, lte: end },
        },
      });

      months.push({
        month: start.toLocaleString('default', { month: 'short' }),
        count,
      });
    }

    // Grade distribution
    const gradeDistribution = await prisma.assessment.groupBy({
      by: ['grade'],
      _count: true,
      orderBy: { grade: 'asc' },
    });

    return sendSuccess(res, {
      stats: {
        totalStudents,
        totalClasses,
        totalSubjects,
        averagePerformance: avgPerformance._avg.total
          ? Math.round(avgPerformance._avg.total * 10) / 10
          : 0,
      },
      recentStudents,
      recentActivities,
      genderStats,
      classPerformance: classesWithPerf,
      enrollmentTrend: months,
      gradeDistribution: gradeDistribution.map((g) => ({
        grade: g.grade || 'N/A',
        count: g._count,
      })),
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch dashboard stats', 500);
  }
};
