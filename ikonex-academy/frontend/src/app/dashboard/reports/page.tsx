'use client';
import { useEffect, useState } from 'react';
import { Download, Loader2, Users, User } from 'lucide-react';
import { classService, studentService, reportService } from '@/lib/services';
import { ClassStream, Student } from '@/types';
import { academicYears } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function ReportsPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassStream[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState('TERM_1');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [dlStudent, setDlStudent] = useState(false);
  const [dlClass, setDlClass] = useState(false);

  useEffect(() => { classService.getAll().then(r => setClasses(r.data.data)).catch(console.error); }, []);
  useEffect(() => {
    if (classId) studentService.getByClass(classId).then(r => setStudents(r.data.data)).catch(console.error);
    else setStudents([]);
  }, [classId]);

  const studentReport = async () => {
    if (!studentId) return toast({ title: 'Select a student', variant: 'destructive' });
    setDlStudent(true);
    try { await reportService.downloadStudentCard(studentId, term, year); toast({ title: 'Report downloaded!' }); }
    catch { toast({ title: 'Failed to generate report', variant: 'destructive' }); }
    finally { setDlStudent(false); }
  };

  const classReport = async () => {
    if (!classId) return toast({ title: 'Select a class', variant: 'destructive' });
    setDlClass(true);
    try { await reportService.downloadClassReport(classId, term, year); toast({ title: 'Class report downloaded!' }); }
    catch { toast({ title: 'Failed to generate report', variant: 'destructive' }); }
    finally { setDlClass(false); }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold">Reports</h2><p className="text-muted-foreground text-sm">Generate PDF reports and report cards</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
            <div><h3 className="font-semibold">Student Report Card</h3><p className="text-xs text-muted-foreground">Individual academic report</p></div>
          </div>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Class</label>
              <select value={classId} onChange={e => { setClassId(e.target.value); setStudentId(''); }} className={inputCls}>
                <option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Student</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls} disabled={!classId}>
                <option value="">Select student</option>{students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Term</label>
                <select value={term} onChange={e => setTerm(e.target.value)} className={inputCls}><option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option></select></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} className={inputCls}>{academicYears.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>
            <button onClick={studentReport} disabled={!studentId || dlStudent}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition">
              {dlStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Download Report Card
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <div><h3 className="font-semibold">Class Performance Report</h3><p className="text-xs text-muted-foreground">Full class rankings and stats</p></div>
          </div>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Class</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className={inputCls}>
                <option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Term</label>
                <select value={term} onChange={e => setTerm(e.target.value)} className={inputCls}><option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option></select></div>
              <div><label className="block text-xs font-medium mb-1 text-muted-foreground">Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} className={inputCls}>{academicYears.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">Includes student rankings, per-subject stats, and class averages.</div>
            <button onClick={classReport} disabled={!classId || dlClass}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition">
              {dlClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Download Class Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
