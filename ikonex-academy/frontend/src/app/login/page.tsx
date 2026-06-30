'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data.email, data.password);
      const { user, accessToken, refreshToken } = res.data.data;
      login(user, accessToken, refreshToken);
      toast({ title: 'Welcome back!', description: `Hello, ${user.firstName}` });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Ikonex Academy</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Student Management System</h1>
          <p className="text-blue-200 text-lg">Manage students, track performance, and generate comprehensive reports.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[{ label: 'Students', value: '500+' },{ label: 'Classes', value: '12' },{ label: 'Subjects', value: '10' },{ label: 'Reports', value: '∞' }].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} Ikonex Academy. Excellence Through Knowledge.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Ikonex Academy</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sign in to your account</h2>
          <p className="text-muted-foreground mb-8">Enter your credentials to access the dashboard</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email address</label>
              <input {...register('email')} type="email" placeholder="admin@ikonexacademy.com"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <div className="mt-6 p-4 rounded-lg bg-muted text-sm">
            <p className="font-medium mb-2">Demo Credentials</p>
            <p className="text-muted-foreground">Admin: <span className="font-mono text-foreground">admin@ikonexacademy.com</span></p>
            <p className="text-muted-foreground">Password: <span className="font-mono text-foreground">Admin@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
