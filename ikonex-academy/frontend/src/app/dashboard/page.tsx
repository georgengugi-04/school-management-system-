'use client';

import { useEffect, useState } from 'react';
import { Users, School, BookOpen, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardService } from '@/lib/services';
import { DashboardStats } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

const GRADE_COLORS: Record<string, string> = { A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#ea580c', E: '#dc2626' };

function StatCard({ title, value, icon: Icon, color, subtitle, change }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start justify-between animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
            <ArrowUpRight className="w-3 h-3" /> +{change}% this month
          </span>
        )}
      </div>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats().then(r => setStats(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  if (!stats) return null;

  const genderData = stats.genderStats.map(g => ({
    name: g.gender === 'MALE' ? 'Boys' : 'Girls',
    value: g._count,
    color: g.gender === 'MALE' ? '#3b82f6' : '#ec4899',
  }));

  const gradeData = stats.gradeDistribution.map(g => ({
    grade: g.grade || 'N/A', count: g.count,
    fill: GRADE_COLORS[g.grade] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here is what is happening at Ikonex Academy.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.stats.totalStudents} icon={Users} color="bg-blue-500" change={4} />
        <StatCard title="Class Streams" value={stats.stats.totalClasses} icon={School} color="bg-purple-500" subtitle="Active classes" />
        <StatCard title="Total Subjects" value={stats.stats.totalSubjects} icon={BookOpen} color="bg-teal-500" subtitle="Across all classes" />
        <StatCard title="Avg Performance" value={`${stats.stats.averagePerformance}%`} icon={TrendingUp} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Student Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.enrollmentTrend}>
              <defs>
                <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorEnroll)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                {genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {genderData.map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: g.color }} />
                <span className="text-xs text-muted-foreground">{g.name}: <strong className="text-foreground">{g.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Class Performance Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.classPerformance} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="average" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            {gradeData.map((g) => {
              const total = gradeData.reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
              return (
                <div key={g.grade}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Grade {g.grade}</span>
                    <span className="text-muted-foreground">{g.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.fill }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Enrollments</h3>
            <a href="/dashboard/students" className="text-xs text-primary hover:underline">View all</a>
          </div>
          <div className="space-y-3">
            {stats.recentStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-muted-foreground">{s.admissionNumber} · {(s as any).classStream?.name}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(s.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {stats.recentActivities.slice(0, 6).map((a) => {
              const actionColors: Record<string, string> = {
                CREATE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
                UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
                DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
                LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400',
              };
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium shrink-0', actionColors[a.action] || 'bg-muted text-muted-foreground')}>
                    {a.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
