'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Users, BookOpen, School, ClipboardList,
  BarChart3, FileText, Settings, LogOut, Menu, X, Sun, Moon,
  GraduationCap, Bell, ChevronDown, User
} from 'lucide-react';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import { authService } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Students', href: '/dashboard/students', icon: Users },
  { label: 'Classes', href: '/dashboard/classes', icon: School },
  { label: 'Subjects', href: '/dashboard/subjects', icon: BookOpen },
  { label: 'Assessments', href: '/dashboard/assessments', icon: ClipboardList },
  { label: 'Results', href: '/dashboard/results', icon: BarChart3 },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    router.push('/login');
    toast({ title: 'Signed out successfully' });
  };

  if (!isAuthenticated || !user) return null;

  const avatarColor = getAvatarColor(`${user.firstName} ${user.lastName}`);
  const initials = getInitials(user.firstName, user.lastName);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground sidebar-transition lg:relative lg:translate-x-0',
        sidebarOpen ? 'w-64' : 'w-16',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Ikonex Academy</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">SMS v1.0</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  active ? 'bg-sidebar-primary text-white' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white'
                )}>
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/60 hover:text-white transition">
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-foreground hidden sm:block">
              {navItems.find(n => n.href === pathname || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', avatarColor)}>
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-tight">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.role.replace('_', ' ')}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition">
                      <User className="w-4 h-4" /> Profile Settings
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
