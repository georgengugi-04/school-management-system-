import { PrismaClient, Role, Gender, Term } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==========================================
  // GRADING SCALES
  // ==========================================
  console.log('Creating grading scales...');
  const gradingScales = [
    { grade: 'A', minScore: 80, maxScore: 100, remarks: 'Excellent', points: 4.0 },
    { grade: 'B', minScore: 70, maxScore: 79, remarks: 'Very Good', points: 3.0 },
    { grade: 'C', minScore: 60, maxScore: 69, remarks: 'Good', points: 2.0 },
    { grade: 'D', minScore: 50, maxScore: 59, remarks: 'Average', points: 1.0 },
    { grade: 'E', minScore: 0, maxScore: 49, remarks: 'Below Average', points: 0.0 },
  ];

  for (const scale of gradingScales) {
    await prisma.gradingScale.upsert({
      where: { grade: scale.grade } as any,
      update: scale,
      create: scale,
    });
  }

  // ==========================================
  // ADMIN USER
  // ==========================================
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@ikonexacademy.com' },
    update: {},
    create: {
      email: 'admin@ikonexacademy.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SUPER_ADMIN,
    },
  });

  // Teacher account
  const teacherPassword = await bcrypt.hash('Teacher@123', 12);
  await prisma.user.upsert({
    where: { email: 'teacher@ikonexacademy.com' },
    update: {},
    create: {
      email: 'teacher@ikonexacademy.com',
      password: teacherPassword,
      firstName: 'Jane',
      lastName: 'Mwangi',
      role: Role.TEACHER,
    },
  });

  // ==========================================
  // CLASS STREAMS
  // ==========================================
  console.log('Creating class streams...');
  const classStreams = [
    { name: 'Form 1A', level: 1, stream: 'A', description: 'Form One Stream A' },
    { name: 'Form 1B', level: 1, stream: 'B', description: 'Form One Stream B' },
    { name: 'Form 2A', level: 2, stream: 'A', description: 'Form Two Stream A' },
    { name: 'Form 2B', level: 2, stream: 'B', description: 'Form Two Stream B' },
    { name: 'Form 3A', level: 3, stream: 'A', description: 'Form Three Stream A' },
    { name: 'Form 4A', level: 4, stream: 'A', description: 'Form Four Stream A' },
  ];

  const createdClasses: any[] = [];
  for (const cls of classStreams) {
    const created = await prisma.classStream.upsert({
      where: { name: cls.name },
      update: {},
      create: cls,
    });
    createdClasses.push(created);
  }

  // ==========================================
  // SUBJECTS
  // ==========================================
  console.log('Creating subjects...');
  const subjects = [
    { name: 'Mathematics', code: 'MATH', description: 'Pure and Applied Mathematics' },
    { name: 'English Language', code: 'ENG', description: 'English Language and Literature' },
    { name: 'Kiswahili', code: 'KSW', description: 'Kiswahili Language and Literature' },
    { name: 'Biology', code: 'BIO', description: 'Life Sciences' },
    { name: 'Chemistry', code: 'CHEM', description: 'Physical and Chemical Sciences' },
    { name: 'Physics', code: 'PHY', description: 'Physical Sciences' },
    { name: 'History', code: 'HIST', description: 'History and Government' },
    { name: 'Geography', code: 'GEO', description: 'Physical and Human Geography' },
    { name: 'Computer Studies', code: 'COMP', description: 'Information Technology' },
    { name: 'Business Studies', code: 'BST', description: 'Commerce and Business' },
  ];

  const createdSubjects: any[] = [];
  for (const sub of subjects) {
    const created = await prisma.subject.upsert({
      where: { code: sub.code },
      update: {},
      create: sub,
    });
    createdSubjects.push(created);
  }

  // ==========================================
  // ASSIGN SUBJECTS TO CLASS STREAMS
  // ==========================================
  console.log('Assigning subjects to class streams...');
  const coreSubjects = createdSubjects.slice(0, 6); // Math, Eng, Kisw, Bio, Chem, Phy
  
  for (const cls of createdClasses) {
    for (const sub of coreSubjects) {
      await prisma.classSubject.upsert({
        where: {
          classStreamId_subjectId: {
            classStreamId: cls.id,
            subjectId: sub.id,
          },
        },
        update: {},
        create: {
          classStreamId: cls.id,
          subjectId: sub.id,
        },
      });
    }
  }

  // ==========================================
  // SAMPLE STUDENTS
  // ==========================================
  console.log('Creating sample students...');
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph'];
  const lastNames = ['Kamau', 'Wanjiku', 'Ochieng', 'Otieno', 'Mwangi', 'Njoroge', 'Kipchoge', 'Akinyi', 'Waweru', 'Mutua'];

  let studentCount = 0;
  for (const cls of createdClasses.slice(0, 3)) {
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const year = new Date().getFullYear();
      const admNum = `ADM${year}${String(studentCount + 1).padStart(4, '0')}`;
      
      const student = await prisma.student.upsert({
        where: { admissionNumber: admNum },
        update: {},
        create: {
          admissionNumber: admNum,
          firstName,
          lastName,
          gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: new Date(2008 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          parentName: `Parent of ${firstName}`,
          parentPhone: `07${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.ikonex.ac.ke`,
          address: 'Nairobi, Kenya',
          classStreamId: cls.id,
        },
      });

      // Add assessments for each core subject
      for (const sub of coreSubjects.slice(0, 4)) {
        const catScore = Math.floor(Math.random() * 41);
        const examScore = Math.floor(Math.random() * 61);
        const total = catScore + examScore;

        await prisma.assessment.upsert({
          where: {
            studentId_subjectId_term_academicYear: {
              studentId: student.id,
              subjectId: sub.id,
              term: Term.TERM_1,
              academicYear: '2024',
            },
          },
          update: {},
          create: {
            studentId: student.id,
            subjectId: sub.id,
            classStreamId: cls.id,
            catScore,
            examScore,
            total,
            term: Term.TERM_1,
            academicYear: '2024',
          },
        });
      }

      studentCount++;
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin: admin@ikonexacademy.com / Admin@123');
  console.log('Teacher: teacher@ikonexacademy.com / Teacher@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
