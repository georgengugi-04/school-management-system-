'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen,
  ClipboardList, BarChart3, FileText, Settings,
  ChevronLeft, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/students', icon: Users, label: 'Students' },
  { href: '/dashboard/classes', icon: BookOpen, label: 'Class Streams' },
  { href: '/dashboard/subjects', icon: ClipboardList, label: 'Subjects' },
  { href: '/dashboard/assessments', icon: BarChart3, label: 'Assessments' },
  { href: '/dashboard/results', icon: BarChart3, label: 'Results' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  isOpen: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isOpen, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full z-30 hidden lg:flex flex-col',
        'bg-sidebar border-r border-sidebar-border transition-all duration-200',
        isOpen ? 'w-64' : 'w-16'
      )}>
        <SidebarContent isOpen={isOpen} pathname={pathname} user={user} />
      </aside>

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col lg:hidden w-64',
        'bg-sidebar border-r border-sidebar-border transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex justify-end p-4">
          <button onClick={onMobileClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent isOpen={true} pathname={pathname} user={user} />
      </aside>
    </>
  );
}

function SidebarContent({ isOpen, pathname, user }: any) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        !isOpen && 'justify-center'
      )}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {isOpen && (
          <div>
            <p className="text-sidebar-foreground font-bold text-sm leading-none">Ikonex Academy</p>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">SMS v1.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {isOpen && (
          <p className="text-sidebar-foreground/40 text-xs font-medium uppercase tracking-wider px-2 mb-3">
            Main Menu
          </p>
        )}
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
                isActive
                  ? 'bg-sidebar-primary text-white'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                !isOpen && 'justify-center'
              )}
              title={!isOpen ? label : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-white')} />
              {isOpen && (
                <span className="text-sm font-medium">{label}</span>
              )}
              {isOpen && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div className={cn(
          'border-t border-sidebar-border p-4',
          !isOpen && 'flex justify-center'
        )}>
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sidebar-foreground/50 text-xs truncate">{user.role}</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
