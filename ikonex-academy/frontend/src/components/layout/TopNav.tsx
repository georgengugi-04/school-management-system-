'use client';

import { useRouter } from 'next/navigation';
import { Menu, Bell, Search, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { cn, getInitials } from '@/lib/utils';

interface TopNavProps {
  onMenuClick: () => void;
  onMobileMenuClick: () => void;
}

export default function TopNav({ onMenuClick, onMobileMenuClick }: TopNavProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    logout();
    toast({ title: 'Signed out', description: 'You have been logged out successfully.' });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-background border-b border-border flex items-center px-4 gap-4">
      {/* Desktop menu toggle */}
      <button
        onClick={onMenuClick}
        className="hidden lg:flex p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search students, classes..."
          className="bg-transparent text-sm w-full focus:outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user ? getInitials(user.firstName, user.lastName) : 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.role}</p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setProfileOpen(false); router.push('/dashboard/settings'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition"
                  >
                    <User className="w-4 h-4" /> Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 hover:text-destructive transition text-destructive"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
