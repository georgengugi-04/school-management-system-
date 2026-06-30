'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, UserPlus } from 'lucide-react';
import { studentService } from '@/lib/services';
import { Student, ClassStream } from '@/types';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  firstName: z.string().min(2, 'First name required').max(50),
  lastName: z.string().min(2, 'Last name required').max(50),
  gender: z.enum(['MALE', 'FEMALE']),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  parentName: z.string().min(2, 'Parent name required'),
  parentPhone: z.string().min(10, 'Valid phone required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  classStreamId: z.string().min(1, 'Class is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: ClassStream[];
  student?: Student;
}

export default function StudentFormModal({ open, onClose, onSuccess, classes, student }: Props) {
  const { toast } = useToast();
  const isEdit = !!student;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      if (student) {
        reset({
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth?.split('T')[0],
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          email: student.email || '',
          address: student.address || '',
          classStreamId: student.classStreamId,
        });
      } else {
        reset({
          firstName: '', lastName: '', gender: 'MALE',
          dateOfBirth: '', parentName: '', parentPhone: '',
          email: '', address: '', classStreamId: '',
        });
      }
    }
  }, [open, student, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit && student) {
        await studentService.update(student.id, data);
        toast({ title: 'Student updated', description: `${data.firstName} ${data.lastName} updated successfully` });
      } else {
        await studentService.create(data);
        toast({ title: 'Student registered', description: `${data.firstName} ${data.lastName} enrolled successfully` });
      }
      onSuccess();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save student',
        variant: 'destructive',
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{isEdit ? 'Edit Student' : 'Register Student'}</h2>
              <p className="text-xs text-muted-foreground">
                {isEdit ? `Editing ${student?.firstName} ${student?.lastName}` : 'Add a new student to the system'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" error={errors.firstName?.message}>
              <input {...register('firstName')} placeholder="e.g. James" className={inputClass} />
            </Field>
            <Field label="Last Name" error={errors.lastName?.message}>
              <input {...register('lastName')} placeholder="e.g. Kamau" className={inputClass} />
            </Field>
          </div>

          {/* Gender and DOB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gender" error={errors.gender?.message}>
              <select {...register('gender')} className={inputClass}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
              <input {...register('dateOfBirth')} type="date" className={inputClass} />
            </Field>
          </div>

          {/* Class */}
          <Field label="Class Stream" error={errors.classStreamId?.message}>
            <select {...register('classStreamId')} className={inputClass}>
              <option value="">Select a class stream...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          {/* Parent info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Parent/Guardian Name" error={errors.parentName?.message}>
              <input {...register('parentName')} placeholder="e.g. John Kamau" className={inputClass} />
            </Field>
            <Field label="Parent Phone" error={errors.parentPhone?.message}>
              <input {...register('parentPhone')} placeholder="e.g. 0712345678" className={inputClass} />
            </Field>
          </div>

          {/* Email and Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email Address (Optional)" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="student@email.com" className={inputClass} />
            </Field>
            <Field label="Address (Optional)" error={errors.address?.message}>
              <input {...register('address')} placeholder="e.g. Nairobi, Kenya" className={inputClass} />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}
