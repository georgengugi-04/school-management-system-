'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ClipboardList, X, Loader2 } from 'lucide-react';
import { assessmentService, studentService, subjectService, classService } from '@/lib/services';
import { Student, Subject, ClassStream } from '@/types';
import { cn, academicYears } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  studentId: z.string().min(1), subjectId: z.string().min(1),
  catScore: z.coerce.number().min(0).max(40), examScore: z.coerce.number().min(0).max(60),
  term: z.enum(['TERM_1','TERM_2','TERM_3']), academicYear: z.string().min(4),
});
type Form = z.infer<typeof schema>;
const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassStream[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('TERM_1');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { term: 'TERM_1', academicYear: String(new Date().getFullYear()) },
  });

  const cat = watch('catScore') || 0;
  const exam = watch('examScore') || 0;
  const total = Number(cat) + Number(exam);

  useEffect(() => {
    classService.getAll().then(r => setClasses(r.data.data)).catch(console.error);
    subjectService.getAll().then(r => setSubjects(r.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) studentService.getByClass(selectedClass).then(r => setStudents(r.data.data)).catch(console.error);
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedStudent) return;
    setLoading(true);
    assessmentService.getStudentAssessments(selectedStudent, { term: selectedTerm, academicYear: selectedYear })
      .then(r => setAssessments(r.data.data.assessments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStudent, selectedTerm, selectedYear]);

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      await assessmentService.create(data);
      toast({ title: 'Assessment saved' });
      setModalOpen(false);
      if (selectedStudent) {
        const r = await assessmentService.getStudentAssessments(selectedStudent, { term: selectedTerm, academicYear: selectedYear });
        setAssessments(r.data.data.assessments || []);
      }
    } catch (err: any) { toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const gc: Record<string, string> = { A: 'text-green-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-600', E: 'text-red-600' };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Assessments</h2><p className="text-muted-foreground text-sm">Record CAT and exam scores</p></div>
        <button onClick={() => { reset(); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium"><Plus className="w-4 h-4" /> Add Score</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">View Student Scores</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }} className={inputCls}>
            <option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className={inputCls} disabled={!selectedClass}>
            <option value="">Select Student</option>{students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
          </select>
          <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className={inputCls}>
            <option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option>
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={inputCls}>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {!selectedStudent ? (
          <div className="text-center py-12 text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Select a class and student</p></div>
        ) : loading ? (
          <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No scores for this period</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">CAT (/40)</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Exam (/60)</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Grade</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {assessments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{a.subject?.name}</td>
                    <td className="px-4 py-3 text-center">{a.catScore}</td>
                    <td className="px-4 py-3 text-center">{a.examScore}</td>
                    <td className="px-4 py-3 text-center font-semibold">{a.total}</td>
                    <td className="px-4 py-3 text-center"><span className={cn('font-bold text-base', gc[a.grade || 'E'])}>{a.grade}</span></td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-center">{assessments.reduce((s: number, a: any) => s + a.catScore, 0)}</td>
                  <td className="px-4 py-3 text-center">{assessments.reduce((s: number, a: any) => s + a.examScore, 0)}</td>
                  <td className="px-4 py-3 text-center">{assessments.reduce((s: number, a: any) => s + a.total, 0)}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">Avg: {assessments.length > 0 ? Math.round(assessments.reduce((s: number, a: any) => s + a.total, 0) / assessments.length) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Assessment Score">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Class</label>
            <select className={inputCls} onChange={e => setSelectedClass(e.target.value)} defaultValue="">
              <option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium mb-1.5">Student</label>
            <select {...register('studentId')} className={inputCls}><option value="">Select student</option>{students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}</select>
            {errors.studentId && <p className="text-destructive text-xs mt-1">Required</p>}</div>
          <div><label className="block text-sm font-medium mb-1.5">Subject</label>
            <select {...register('subjectId')} className={inputCls}><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            {errors.subjectId && <p className="text-destructive text-xs mt-1">Required</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">CAT Score (0-40)</label>
              <input {...register('catScore')} type="number" min="0" max="40" className={inputCls} />
              {errors.catScore && <p className="text-destructive text-xs mt-1">{errors.catScore.message}</p>}</div>
            <div><label className="block text-sm font-medium mb-1.5">Exam Score (0-60)</label>
              <input {...register('examScore')} type="number" min="0" max="60" className={inputCls} />
              {errors.examScore && <p className="text-destructive text-xs mt-1">{errors.examScore.message}</p>}</div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-xl">{total}</span><span className="text-muted-foreground">/ 100</span>
            <span className={cn('ml-auto font-bold text-lg', total >= 80 ? 'text-green-600' : total >= 60 ? 'text-yellow-600' : 'text-red-600')}>
              {total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'E'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Term</label>
              <select {...register('term')} className={inputCls}><option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option></select></div>
            <div><label className="block text-sm font-medium mb-1.5">Academic Year</label>
              <select {...register('academicYear')} className={inputCls}>{academicYears.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}Save Score
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
