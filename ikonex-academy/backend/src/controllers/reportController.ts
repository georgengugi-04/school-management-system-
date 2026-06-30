import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { sendError, sendNotFound } from '../utils/response';

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'Ikonex Academy';
const SCHOOL_ADDRESS = process.env.SCHOOL_ADDRESS || 'P.O. Box 1234, Nairobi, Kenya';
const SCHOOL_PHONE = process.env.SCHOOL_PHONE || '+254 700 000 000';
const SCHOOL_EMAIL = process.env.SCHOOL_EMAIL || 'info@ikonexacademy.com';
const SCHOOL_MOTTO = process.env.SCHOOL_MOTTO || 'Excellence Through Knowledge';

// Hex to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const drawPageHeader = (doc: PDFKit.PDFDocument) => {
  const [r, g, b] = hexToRgb('#1e3a5f');

  // Header background
  doc.rect(0, 0, doc.page.width, 100).fill(`rgb(${r},${g},${b})`);

  // School name
  doc.fillColor('white')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(SCHOOL_NAME, 50, 20);

  doc.fillColor('white')
    .fontSize(10)
    .font('Helvetica')
    .text(SCHOOL_ADDRESS, 50, 48)
    .text(`Tel: ${SCHOOL_PHONE} | Email: ${SCHOOL_EMAIL}`, 50, 62)
    .text(`"${SCHOOL_MOTTO}"`, 50, 76);

  doc.fillColor('black');
};

const drawDivider = (doc: PDFKit.PDFDocument, y: number) => {
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y)
    .strokeColor('#1e3a5f').lineWidth(1).stroke();
};

export const generateStudentReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) {
      return sendError(res, 'Term and academic year are required');
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId, isActive: true },
      include: {
        classStream: true,
        assessments: {
          where: { term: term as any, academicYear: String(academicYear) },
          include: { subject: true },
          orderBy: { subject: { name: 'asc' } },
        },
      },
    });

    if (!student) return sendNotFound(res, 'Student not found');

    // Calculate position in class
    const classStudents = await prisma.student.findMany({
      where: { classStreamId: student.classStreamId, isActive: true },
      include: {
        assessments: {
          where: { term: term as any, academicYear: String(academicYear) },
        },
      },
    });

    const classResults = classStudents.map((s) => ({
      id: s.id,
      total: s.assessments.reduce((sum, a) => sum + a.total, 0),
      count: s.assessments.length,
    })).sort((a, b) => b.total - a.total);

    const position = classResults.findIndex((r) => r.id === studentId) + 1;
    const totalStudents = classStudents.length;
    const studentTotal = student.assessments.reduce((sum, a) => sum + a.total, 0);
    const average = student.assessments.length > 0
      ? studentTotal / student.assessments.length : 0;

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${student.admissionNumber}_${term}_${academicYear}.pdf`);
    doc.pipe(res);

    // Header
    drawPageHeader(doc);

    // Report title
    doc.moveDown(4);
    const termLabel = String(term).replace('_', ' ');
    doc.fillColor('#1e3a5f').fontSize(16).font('Helvetica-Bold')
      .text(`STUDENT REPORT CARD - ${termLabel} ${academicYear}`, { align: 'center' });

    drawDivider(doc, doc.y + 5);
    doc.moveDown(0.5);

    // Student info
    const y = doc.y;
    doc.fillColor('#333').fontSize(10).font('Helvetica-Bold');
    doc.text('STUDENT INFORMATION', 50, y);
    doc.font('Helvetica').fontSize(10);

    const info = [
      ['Admission No:', student.admissionNumber],
      ['Full Name:', `${student.firstName} ${student.lastName}`],
      ['Class:', student.classStream.name],
      ['Gender:', student.gender],
      ['Academic Year:', String(academicYear)],
      ['Term:', termLabel],
    ];

    info.forEach(([label, value], i) => {
      const row = y + 18 + (i * 18);
      const col2 = i % 2 === 0 ? 200 : 420;
      const col1 = i % 2 === 0 ? 50 : 310;
      doc.font('Helvetica-Bold').text(label, col1, row);
      doc.font('Helvetica').text(value, col2, row);
    });

    doc.moveDown(5);
    drawDivider(doc, doc.y);
    doc.moveDown(0.5);

    // Subjects table
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold')
      .text('ACADEMIC PERFORMANCE', 50);
    doc.moveDown(0.5);

    // Table header
    const tableY = doc.y;
    const cols = { subject: 50, cat: 270, exam: 340, total: 410, grade: 490 };

    doc.rect(50, tableY, doc.page.width - 100, 20).fill('#1e3a5f');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('SUBJECT', cols.subject + 5, tableY + 5);
    doc.text('CAT (/40)', cols.cat, tableY + 5);
    doc.text('EXAM (/60)', cols.exam, tableY + 5);
    doc.text('TOTAL (/100)', cols.total, tableY + 5);
    doc.text('GRADE', cols.grade, tableY + 5);

    let rowY = tableY + 22;
    student.assessments.forEach((assessment, i) => {
      const bg = i % 2 === 0 ? '#f8f9fa' : 'white';
      doc.rect(50, rowY, doc.page.width - 100, 18).fill(bg);
      doc.fillColor('#333').fontSize(9).font('Helvetica');
      doc.text(assessment.subject.name, cols.subject + 5, rowY + 4);
      doc.text(String(assessment.catScore), cols.cat + 10, rowY + 4);
      doc.text(String(assessment.examScore), cols.exam + 10, rowY + 4);
      doc.text(String(assessment.total), cols.total + 15, rowY + 4);

      // Grade color
      const gradeColors: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#ea580c', E: '#dc2626' };
      doc.fillColor(gradeColors[assessment.grade || 'E'] || '#333');
      doc.font('Helvetica-Bold').text(assessment.grade || '-', cols.grade + 5, rowY + 4);
      doc.fillColor('#333');

      rowY += 18;
    });

    // Totals row
    doc.rect(50, rowY, doc.page.width - 100, 20).fill('#1e3a5f');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('TOTALS', cols.subject + 5, rowY + 5);
    doc.text(String(studentTotal), cols.total + 15, rowY + 5);

    doc.moveDown(2);
    rowY += 35;

    // Summary
    drawDivider(doc, rowY);
    rowY += 15;
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold')
      .text('SUMMARY', 50, rowY);
    rowY += 20;

    const summaryItems = [
      ['Total Marks:', String(studentTotal)],
      ['Average Score:', `${Math.round(average * 10) / 10}%`],
      ['Position in Class:', `${position} out of ${totalStudents}`],
      ['Subjects Offered:', String(student.assessments.length)],
    ];

    summaryItems.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fillColor('#333').text(label, 50, rowY);
      doc.font('Helvetica').text(value, 200, rowY);
      rowY += 18;
    });

    rowY += 20;
    drawDivider(doc, rowY);
    rowY += 15;

    // Footer
    doc.fillColor('#666').fontSize(8).font('Helvetica');
    doc.text('This is a computer generated report card. For any queries, contact the school administration.', 50, rowY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 50, rowY + 12, { align: 'center' });

    doc.end();
  } catch (error) {
    return sendError(res, 'Failed to generate report card', 500);
  }
};

export const generateClassReport = async (req: Request, res: Response) => {
  try {
    const { classStreamId } = req.params;
    const { term, academicYear } = req.query;

    if (!term || !academicYear) return sendError(res, 'Term and academic year are required');

    const classStream = await prisma.classStream.findUnique({
      where: { id: classStreamId },
      include: {
        classSubjects: { include: { subject: true } },
      },
    });
    if (!classStream) return sendNotFound(res, 'Class stream not found');

    const students = await prisma.student.findMany({
      where: { classStreamId, isActive: true },
      include: {
        assessments: {
          where: { term: term as any, academicYear: String(academicYear) },
          include: { subject: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    const results = students.map((student) => ({
      name: `${student.firstName} ${student.lastName}`,
      admNo: student.admissionNumber,
      total: student.assessments.reduce((s, a) => s + a.total, 0),
      average: student.assessments.length
        ? student.assessments.reduce((s, a) => s + a.total, 0) / student.assessments.length
        : 0,
    })).sort((a, b) => b.total - a.total);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=class_report_${classStream.name.replace(' ', '_')}.pdf`);
    doc.pipe(res);

    drawPageHeader(doc);
    doc.moveDown(4);

    doc.fillColor('#1e3a5f').fontSize(16).font('Helvetica-Bold')
      .text(`CLASS PERFORMANCE REPORT - ${classStream.name}`, { align: 'center' });
    doc.fillColor('#555').fontSize(10).font('Helvetica')
      .text(`${String(term).replace('_', ' ')} ${academicYear}`, { align: 'center' });

    drawDivider(doc, doc.y + 5);
    doc.moveDown();

    // Table
    const tableY = doc.y;
    doc.rect(50, tableY, doc.page.width - 100, 20).fill('#1e3a5f');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('#', 55, tableY + 5);
    doc.text('Admission No', 80, tableY + 5);
    doc.text('Student Name', 180, tableY + 5);
    doc.text('Total', 380, tableY + 5);
    doc.text('Average', 430, tableY + 5);
    doc.text('Position', 490, tableY + 5);

    let rowY = tableY + 22;
    results.forEach((r, i) => {
      const bg = i % 2 === 0 ? '#f8f9fa' : 'white';
      doc.rect(50, rowY, doc.page.width - 100, 18).fill(bg);
      doc.fillColor('#333').fontSize(9).font('Helvetica');
      doc.text(String(i + 1), 55, rowY + 4);
      doc.text(r.admNo, 80, rowY + 4);
      doc.text(r.name, 180, rowY + 4);
      doc.text(String(r.total), 380, rowY + 4);
      doc.text(`${Math.round(r.average * 10) / 10}%`, 430, rowY + 4);
      doc.text(String(i + 1), 495, rowY + 4);
      rowY += 18;
      if (rowY > 700) { doc.addPage(); drawPageHeader(doc); rowY = 120; }
    });

    doc.end();
  } catch (error) {
    return sendError(res, 'Failed to generate class report', 500);
  }
};

export const getGradingScales = async (req: Request, res: Response) => {
  try {
    const scales = await prisma.gradingScale.findMany({
      where: { isActive: true },
      orderBy: { minScore: 'desc' },
    });
    return res.json({ success: true, data: scales });
  } catch (error) {
    return sendError(res, 'Failed to fetch grading scales', 500);
  }
};

export const updateGradingScale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, minScore, maxScore, remarks, points } = req.body;

    const scale = await prisma.gradingScale.update({
      where: { id },
      data: { grade, minScore, maxScore, remarks, points },
    });

    return res.json({ success: true, data: scale, message: 'Grading scale updated' });
  } catch (error) {
    return sendError(res, 'Failed to update grading scale', 500);
  }
};
