'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, Edit2, Shield, Settings } from 'lucide-react';
import { reportService, authService } from '@/lib/services';
import { GradingScale } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const pwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain upper, lower and number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });
type PwForm = z.infer<typeof pwSchema>;
const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [editingScale, setEditingScale] = useState<string | null>(null);
  const [scaleEdits, setScaleEdits] = useState<Record<string, any>>({});
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  useEffect(() => { reportService.getGradingScales().then(r => setScales(r.data.data)).catch(console.error); }, []);

  const saveScale = async (id: string) => {
    try {
      await reportService.updateGradingScale(id, scaleEdits[id]);
      toast({ title: 'Grading scale updated' });
      setEditingScale(null);
      const r = await reportService.getGradingScales();
      setScales(r.data.data);
    } catch { toast({ title: 'Update failed', variant: 'destructive' }); }
  };

  const onPw = async (data: PwForm) => {
    setPwSubmitting(true);
    try { await authService.changePassword(data.currentPassword, data.newPassword); toast({ title: 'Password updated' }); reset(); }
    catch (err: any) { toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' }); }
    finally { setPwSubmitting(false); }
  };

  const gc: Record<string, string> = {
    A: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
    B: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
    C: 'bg-yellow-100 text-yellow-700', D: 'bg-orange-100 text-orange-700', E: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground text-sm">Grading scales and account settings</p></div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Settings className="w-4 h-4" />Account</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground text-xs mb-0.5">Full Name</p><p className="font-medium">{user?.firstName} {user?.lastName}</p></div>
          <div><p className="text-muted-foreground text-xs mb-0.5">Email</p><p className="font-medium">{user?.email}</p></div>
          <div><p className="text-muted-foreground text-xs mb-0.5">Role</p><span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{user?.role?.replace('_', ' ')}</span></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Grading Scale</h3>
        <div className="space-y-2">
          {scales.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0', gc[s.grade] || 'bg-muted')}>{s.grade}</span>
              {editingScale === s.id ? (
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <input type="number" defaultValue={s.minScore} onChange={e => setScaleEdits(p => ({ ...p, [s.id]: { ...(p[s.id] || {}), minScore: +e.target.value } }))} className={cn(inputCls, 'text-xs')} placeholder="Min" />
                  <input type="number" defaultValue={s.maxScore} onChange={e => setScaleEdits(p => ({ ...p, [s.id]: { ...(p[s.id] || {}), maxScore: +e.target.value } }))} className={cn(inputCls, 'text-xs')} placeholder="Max" />
                  <input defaultValue={s.remarks} onChange={e => setScaleEdits(p => ({ ...p, [s.id]: { ...(p[s.id] || {}), remarks: e.target.value } }))} className={cn(inputCls, 'text-xs')} />
                  <input type="number" step="0.1" defaultValue={s.points} onChange={e => setScaleEdits(p => ({ ...p, [s.id]: { ...(p[s.id] || {}), points: +e.target.value } }))} className={cn(inputCls, 'text-xs')} placeholder="GPA" />
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <span>Min: <strong className="text-foreground">{s.minScore}</strong></span>
                  <span>Max: <strong className="text-foreground">{s.maxScore}</strong></span>
                  <span>{s.remarks}</span>
                  <span>GPA: <strong className="text-foreground">{s.points}</strong></span>
                </div>
              )}
              <div className="flex gap-1 shrink-0">
                {editingScale === s.id ? (
                  <>
                    <button onClick={() => saveScale(s.id)} className="p-1.5 rounded bg-primary text-primary-foreground"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingScale(null)} className="p-1.5 rounded border border-border hover:bg-muted text-xs">✕</button>
                  </>
                ) : (
                  <button onClick={() => { setEditingScale(s.id); setScaleEdits(p => ({ ...p, [s.id]: {} })); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" />Change Password</h3>
        <form onSubmit={handleSubmit(onPw)} className="space-y-4 max-w-md">
          <div><label className="block text-sm font-medium mb-1.5">Current Password</label><input {...register('currentPassword')} type="password" className={inputCls} />{errors.currentPassword && <p className="text-destructive text-xs mt-1">Required</p>}</div>
          <div><label className="block text-sm font-medium mb-1.5">New Password</label><input {...register('newPassword')} type="password" className={inputCls} />{errors.newPassword && <p className="text-destructive text-xs mt-1">{errors.newPassword.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1.5">Confirm Password</label><input {...register('confirmPassword')} type="password" className={inputCls} />{errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}</div>
          <button type="submit" disabled={pwSubmitting} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60">
            {pwSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
