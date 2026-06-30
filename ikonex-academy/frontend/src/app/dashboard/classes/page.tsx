'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Eye, School, X, Loader2, Users, BookOpen } from 'lucide-react';
import { classService, subjectService } from '@/lib/services';
import { ClassStream, Subject } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(2), level: z.coerce.number().min(1).max(6),
  stream: z.string().min(1), description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

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

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

export default function ClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassStream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectModalId, setSubjectModalId] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<ClassStream | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const fetchClasses = async () => {
    setLoading(true);
    try { const r = await classService.getAll(); setClasses(r.data.data); }
    catch { toast({ title: 'Failed to load classes', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); subjectService.getAll().then(r => setSubjects(r.data.data)).catch(console.error); }, []);

  const openCreate = () => { setEditingClass(null); reset({}); setModalOpen(true); };
  const openEdit = (c: ClassStream) => { setEditingClass(c); reset({ name: c.name, level: c.level, stream: c.stream, description: c.description || '' }); setModalOpen(true); };
  const openSubjects = (c: ClassStream) => {
    setSubjectModalId(c.id);
    setSelectedSubjects(c.classSubjects?.map(cs => cs.subjectId) || []);
  };

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      if (editingClass) { await classService.update(editingClass.id, data); toast({ title: 'Class updated' }); }
      else { await classService.create(data); toast({ title: 'Class created' }); }
      setModalOpen(false); fetchClasses();
    } catch (err: any) { toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await classService.delete(deleteId); toast({ title: 'Class deleted' }); setDeleteId(null); fetchClasses(); }
    catch (err: any) { toast({ title: err.response?.data?.message || 'Delete failed', variant: 'destructive' }); }
  };

  const saveSubjects = async () => {
    if (!subjectModalId) return;
    try { await classService.assignSubjects(subjectModalId, selectedSubjects); toast({ title: 'Subjects assigned' }); setSubjectModalId(null); fetchClasses(); }
    catch { toast({ title: 'Failed to assign subjects', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Class Streams</h2><p className="text-muted-foreground text-sm">Manage class streams and subject assignments</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium"><Plus className="w-4 h-4" /> New Class</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <School className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No class streams yet</p>
          <p className="text-muted-foreground text-sm mt-1">Create your first class stream</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <School className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">Form {c.level} Stream {c.stream}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1"><Users className="w-4 h-4" /></div>
                  <p className="text-xl font-bold">{c._count?.students || 0}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 mb-1"><BookOpen className="w-4 h-4" /></div>
                  <p className="text-xl font-bold">{c._count?.classSubjects || 0}</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
              </div>
              {(c as any).averagePerformance > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Avg Performance</span><span className="font-medium">{(c as any).averagePerformance}%</span></div>
                  <div className="h-1.5 bg-muted rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${(c as any).averagePerformance}%` }} /></div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => openSubjects(c)} className="flex-1 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition flex items-center justify-center gap-1"><BookOpen className="w-3 h-3" />Assign Subjects</button>
                <Link href={`/dashboard/classes/${c.id}`} className="flex-1 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition flex items-center justify-center gap-1"><Eye className="w-3 h-3" />View</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingClass ? 'Edit Class Stream' : 'Create Class Stream'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Class Name</label><input {...register('name')} className={inputCls} placeholder="Form 1A" />{errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1.5">Form Level</label>
              <select {...register('level', { valueAsNumber: true })} className={inputCls}>{[1,2,3,4,5,6].map(l => <option key={l} value={l}>Form {l}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1.5">Stream</label><input {...register('stream')} className={inputCls} placeholder="A, B, C..." /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1.5">Description (Optional)</label><textarea {...register('description')} className={cn(inputCls, 'resize-none h-16')} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{editingClass ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!subjectModalId} onClose={() => setSubjectModalId(null)} title="Assign Subjects to Class">
        <p className="text-muted-foreground text-sm mb-4">Select subjects to assign to this class stream.</p>
        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {subjects.map(s => (
            <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={selectedSubjects.includes(s.id)} onChange={e => setSelectedSubjects(e.target.checked ? [...selectedSubjects, s.id] : selectedSubjects.filter(id => id !== s.id))} className="rounded" />
              <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.code}</p></div>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setSubjectModalId(null)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
          <button onClick={saveSubjects} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Save ({selectedSubjects.length} selected)</button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
        <p className="text-muted-foreground mb-6">Delete this class stream? Students must be reassigned first.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
