'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Loader2, Users, X } from 'lucide-react';
import { studentService, classService } from '@/lib/services';
import { Student, ClassStream, PaginatedData } from '@/types';
import { formatDate, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const studentSchema = z.object({
  firstName: z.string().min(2), lastName: z.string().min(2),
  gender: z.enum(['MALE', 'FEMALE']), dateOfBirth: z.string().min(1),
  parentName: z.string().min(2), parentPhone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(), classStreamId: z.string().min(1),
});
type StudentForm = z.infer<typeof studentSchema>;

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

export default function StudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<PaginatedData<Student> | null>(null);
  const [classes, setClasses] = useState<ClassStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({ resolver: zodResolver(studentSchema) });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({ page, limit: 10, search: search || undefined, classStreamId: classFilter || undefined });
      setStudents(res.data.data);
    } catch { toast({ title: 'Error fetching students', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [page, search, classFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { classService.getAll().then(r => setClasses(r.data.data)).catch(console.error); }, []);

  const openCreate = () => { setEditingStudent(null); reset({}); setModalOpen(true); };
  const openEdit = (s: Student) => {
    setEditingStudent(s);
    reset({ firstName: s.firstName, lastName: s.lastName, gender: s.gender, dateOfBirth: s.dateOfBirth.split('T')[0], parentName: s.parentName, parentPhone: s.parentPhone, email: s.email || '', address: s.address || '', classStreamId: s.classStreamId });
    setModalOpen(true);
  };

  const onSubmit = async (data: StudentForm) => {
    setSubmitting(true);
    try {
      if (editingStudent) { await studentService.update(editingStudent.id, data); toast({ title: 'Student updated' }); }
      else { await studentService.create(data); toast({ title: 'Student registered' }); }
      setModalOpen(false); fetchStudents();
    } catch (err: any) { toast({ title: err.response?.data?.message || 'Operation failed', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await studentService.delete(deleteId); toast({ title: 'Student deleted' }); setDeleteId(null); fetchStudents(); }
    catch (err: any) { toast({ title: err.response?.data?.message || 'Delete failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground text-sm">Manage student records and enrollments</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> Register Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none w-full sm:w-48">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || classFilter) && (
          <button onClick={() => { setSearch(''); setClassFilter(''); setPage(1); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : students?.data.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No students found</p>
            <p className="text-muted-foreground text-sm mt-1">Register a new student to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Adm No</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Class</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Gender</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Parent</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Enrolled</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0', getAvatarColor(`${s.firstName} ${s.lastName}`))}>
                          {getInitials(s.firstName, s.lastName)}
                        </div>
                        <div>
                          <p className="font-medium">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{s.admissionNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-muted-foreground">{s.admissionNumber}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{s.classStream?.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', s.gender === 'MALE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400' : 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-400')}>
                        {s.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">{s.parentName}</td>
                    <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">{formatDate(s.admissionDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/students/${s.id}`} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {students && students.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, students.pagination.total)} of {students.pagination.total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={!students.pagination.hasPrev} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-medium">{page} / {students.pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!students.pagination.hasNext} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingStudent ? 'Edit Student' : 'Register New Student'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">First Name</label><input {...register('firstName')} className={inputCls} placeholder="James" />{errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}</div>
            <div><label className="block text-sm font-medium mb-1.5">Last Name</label><input {...register('lastName')} className={inputCls} placeholder="Kamau" />{errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Gender</label>
              <select {...register('gender')} className={inputCls}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
              {errors.gender && <p className="text-destructive text-xs mt-1">{errors.gender.message}</p>}</div>
            <div><label className="block text-sm font-medium mb-1.5">Date of Birth</label><input {...register('dateOfBirth')} type="date" className={inputCls} />{errors.dateOfBirth && <p className="text-destructive text-xs mt-1">{errors.dateOfBirth.message}</p>}</div>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">Class Stream</label>
            <select {...register('classStreamId')} className={inputCls}><option value="">Select class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            {errors.classStreamId && <p className="text-destructive text-xs mt-1">{errors.classStreamId.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Parent Name</label><input {...register('parentName')} className={inputCls} placeholder="John Kamau" />{errors.parentName && <p className="text-destructive text-xs mt-1">{errors.parentName.message}</p>}</div>
            <div><label className="block text-sm font-medium mb-1.5">Parent Phone</label><input {...register('parentPhone')} className={inputCls} placeholder="0712345678" />{errors.parentPhone && <p className="text-destructive text-xs mt-1">{errors.parentPhone.message}</p>}</div>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">Email (Optional)</label><input {...register('email')} type="email" className={inputCls} placeholder="james@school.ac.ke" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Address (Optional)</label><textarea {...register('address')} className={cn(inputCls, 'resize-none h-16')} placeholder="Nairobi, Kenya" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{editingStudent ? 'Update' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
        <p className="text-muted-foreground mb-6">Are you sure you want to delete this student? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition text-sm">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
