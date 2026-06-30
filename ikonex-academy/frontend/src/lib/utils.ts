import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date, fmt = 'dd MMM yyyy') => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return 'Invalid date';
  }
};

export const formatDateTime = (date: string | Date) =>
  formatDate(date, 'dd MMM yyyy, HH:mm');

export const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    A: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400',
    B: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    C: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
    D: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
    E: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
  };
  return colors[grade] || 'text-gray-600 bg-gray-50';
};

export const getPerformanceColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
};

export const termLabel = (term: string) => {
  const labels: Record<string, string> = {
    TERM_1: 'Term 1',
    TERM_2: 'Term 2',
    TERM_3: 'Term 3',
  };
  return labels[term] || term;
};

export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
};

export const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
    'bg-indigo-500', 'bg-rose-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

export const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const getOrdinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const currentYear = new Date().getFullYear();
export const academicYears = Array.from({ length: 5 }, (_, i) =>
  String(currentYear - i)
);
