'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, BookOpen, X, Loader2 } from 'lucide-react';
import { subjectService } from '@/lib/services';
import { Subject } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({ name: z.string().min(2), code: z.string().min(2).max(10), description: z.string().optional() });
type Form = z.infer<typeof schema>;
const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const fetchSubjects = async () => {
    setLoading(true);
    try { const r = await subjectService.getAll({ search: search || undefined }); setSubjects(r.data.data); }
    catch { toast({ title: 'Failed to load subjects', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, [search]);

  const openCreate = () => { setEditingSubject(null); reset({}); setModalOpen(true); };
  const openEdit = (s: Subject) => { setEditingSubject(s); reset({ name: s.name, code: s.code, description: s.description || '' }); setModalOpen(true); };

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      if (editingSubject) { await subjectService.update(editingSubject.id, data); toast({ title: 'Subject updated' }); }
      else { await subjectService.create(data); toast({ title: 'Subject created' }); }
      setModalOpen(false); fetchSubjects();
    } catch (err: any) { toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await subjectService.delete(deleteId); toast({ title: 'Subject deleted' }); setDeleteId(null); fetchSubjects(); }
    catch (err: any) { toast({ title: err.response?.data?.message || 'Cannot delete', variant: 'destructive' }); }
  };

  const subjectColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Subjects</h2><p className="text-muted-foreground text-sm">Manage school subjects and curriculum</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium"><Plus className="w-4 h-4" /> Add Subject</button>
      </div>

      <div className="relative max-w-sm">
        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No subjects found</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first subject to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map((s, i) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition group">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm', subjectColors[i % subjectColors.length])}>
                  {s.code.slice(0, 3)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{s.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{s.description || 'No description'}</p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{s._count?.classSubjects || 0} classes</span>
                <span>{s._count?.assessments || 0} assessments</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSubject ? 'Edit Subject' : 'Add New Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Subject Name</label><input {...register('name')} className={inputCls} placeholder="Mathematics" />{errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1.5">Subject Code</label><input {...register('code')} className={inputCls} placeholder="MATH" />{errors.code && <p className="text-destructive text-xs mt-1">{errors.code.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1.5">Description (Optional)</label><textarea {...register('description')} className={cn(inputCls, 'resize-none h-16')} placeholder="Brief description..." /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{editingSubject ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
        <p className="text-muted-foreground mb-6">Delete this subject? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
