'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Download, Loader2 } from 'lucide-react';
import { studentService, reportService } from '@/lib/services';
import { Student } from '@/types';
import { formatDate, getInitials, getAvatarColor, cn, termLabel, academicYears } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const GRADE_COLORS: Record<string, string> = { A: 'text-green-600 bg-green-50', B: 'text-blue-600 bg-blue-50', C: 'text-yellow-600 bg-yellow-50', D: 'text-orange-600 bg-orange-50', E: 'text-red-600 bg-red-50' };

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('TERM_1');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    studentService.getById(id).then(r => setStudent(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try { await reportService.downloadStudentCard(id, term, year); toast({ title: 'Report card downloaded' }); }
    catch { toast({ title: 'Failed to generate report', variant: 'destructive' }); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!student) return <div className="text-center py-16"><p className="text-muted-foreground">Student not found</p></div>;

  const assessments = student.assessments || [];
  const totalMarks = assessments.reduce((s, a) => s + a.total, 0);
  const average = assessments.length > 0 ? totalMarks / assessments.length : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted transition"><ArrowLeft className="w-4 h-4" /></button>
        <div><h2 className="text-xl font-bold">Student Profile</h2><p className="text-muted-foreground text-sm">View student details and performance</p></div>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0', getAvatarColor(`${student.firstName} ${student.lastName}`))}>
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-bold">{student.firstName} {student.lastName}</h3>
                <p className="text-muted-foreground font-mono text-sm">{student.admissionNumber}</p>
                <span className="inline-flex mt-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{student.classStream?.name}</span>
              </div>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', student.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
                {student.gender}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" />{formatDate(student.dateOfBirth)}</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{student.parentPhone}</div>
              {student.email && <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3.5 h-3.5" /><span className="truncate">{student.email}</span></div>}
              {student.address && <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{student.address}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Assessments + download */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold">Academic Performance</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={term} onChange={e => setTerm(e.target.value)} className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none">
              <option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option>
            </select>
            <select value={year} onChange={e => setYear(e.target.value)} className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none">
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-60 hover:bg-primary/90 transition">
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Report Card
            </button>
          </div>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground"><User className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No assessments recorded yet</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">CAT</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Exam</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Grade</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{a.subject?.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{a.catScore}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{a.examScore}</td>
                      <td className="px-4 py-3 text-center font-semibold">{a.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-bold', GRADE_COLORS[a.grade || 'E'])}>{a.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center"><p className="text-xs text-muted-foreground">Total Marks</p><p className="text-lg font-bold">{totalMarks}</p></div>
              <div className="text-center"><p className="text-xs text-muted-foreground">Average</p><p className="text-lg font-bold">{Math.round(average * 10) / 10}%</p></div>
              <div className="text-center"><p className="text-xs text-muted-foreground">Subjects</p><p className="text-lg font-bold">{assessments.length}</p></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
