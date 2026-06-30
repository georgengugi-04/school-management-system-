import prisma from '../config/database';

export const generateAdmissionNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `ADM${year}`;

  // Find the last admission number for this year
  const lastStudent = await prisma.student.findFirst({
    where: {
      admissionNumber: { startsWith: prefix },
    },
    orderBy: { admissionNumber: 'desc' },
  });

  let sequence = 1;
  if (lastStudent) {
    const lastNum = parseInt(lastStudent.admissionNumber.replace(prefix, ''));
    sequence = lastNum + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export const getGrade = async (score: number): Promise<{ grade: string; remarks: string }> => {
  const scale = await prisma.gradingScale.findFirst({
    where: {
      minScore: { lte: score },
      maxScore: { gte: score },
      isActive: true,
    },
  });

  if (!scale) {
    return { grade: 'E', remarks: 'Below Average' };
  }

  return { grade: scale.grade, remarks: scale.remarks };
};
