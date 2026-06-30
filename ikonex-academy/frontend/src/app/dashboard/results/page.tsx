'use client';
import { useEffect, useState } from 'react';
import { BarChart3, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { assessmentService, classService } from '@/lib/services';
import { ClassStream } from '@/types';
import { cn, academicYears } from '@/lib/utils';

const sel = "px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function ResultsPage() {
  const [classes, setClasses] = useState<ClassStream[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cls, setCls] = useState('');
  const [term, setTerm] = useState('TERM_1');
  const [year, setYear] = useState(String(new Date().getFullYear()));

  useEffect(() => { classService.getAll().then(r => setClasses(r.data.data)).catch(console.error); }, []);
  useEffect(() => {
    if (!cls) return;
    setLoading(true);
    assessmentService.getClassResults(cls, { term, academicYear: year })
      .then(r => setResults(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, [cls, term, year]);

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold">Results & Rankings</h2><p className="text-muted-foreground text-sm">Class results and student rankings</p></div>
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-wrap gap-3 mb-5">
          <select value={cls} onChange={e => setCls(e.target.value)} className={sel}>
            <option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={term} onChange={e => setTerm(e.target.value)} className={sel}>
            <option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option>
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} className={sel}>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {!cls ? (
          <div className="text-center py-16 text-muted-foreground"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Select a class to view results</p></div>
        ) : loading ? (
          <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : results ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Subject Performance</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {results.subjectStats?.map((s: any) => (
                  <div key={s.subject.id} className="bg-muted/40 rounded-xl p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 truncate">{s.subject.name}</p>
                    <p className="text-2xl font-bold">{s.average}%</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-0.5 text-green-600"><TrendingUp className="w-3 h-3" />{s.highest}</span>
                      <span className="flex items-center gap-0.5 text-red-600"><TrendingDown className="w-3 h-3" />{s.lowest}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Class Rankings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pos</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Adm No</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Subjects</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Average</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {results.results?.map((r: any) => (
                      <tr key={r.student.id} className={cn('hover:bg-muted/30', r.position <= 3 && 'bg-yellow-50/50 dark:bg-yellow-900/10')}>
                        <td className="px-4 py-3">
                          {r.position <= 3 ? <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white', r.position===1?'bg-yellow-500':r.position===2?'bg-gray-400':'bg-amber-600')}>{r.position}</div>
                          : <span className="text-muted-foreground font-mono text-xs">{r.position}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium">{r.student.firstName} {r.student.lastName}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground font-mono text-xs">{r.student.admissionNumber}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.subjects}</td>
                        <td className="px-4 py-3 text-center font-semibold">{r.totalMarks}</td>
                        <td className="px-4 py-3 text-center"><span className={cn('font-semibold', r.average>=80?'text-green-600':r.average>=60?'text-yellow-600':'text-red-600')}>{r.average}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
