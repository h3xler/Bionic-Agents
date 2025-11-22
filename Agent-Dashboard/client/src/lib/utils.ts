import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a date, returning fallback if invalid
 */
export function formatDate(date: Date | string | null | undefined, fallback: string = '-'): string {
  if (!date) return fallback;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return fallback;
    
    return d.toLocaleString();
  } catch {
    return fallback;
  }
}

/**
 * Safely format a number, returning fallback if invalid
 */
export function formatNumber(value: number | null | undefined, fallback: string | number = 0): string | number {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return value;
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds: number | null | undefined, fallback: string = '-'): string {
  const s = formatNumber(seconds, 0) as number;
  if (s === 0) return fallback;
  
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format bytes to GB
 */
export function formatBytes(bytes: number | null | undefined, decimals: number = 2): string {
  const b = formatNumber(bytes, 0) as number;
  if (b === 0) return '0.00 GB';
  
  const gb = b / (1024 * 1024 * 1024);
  return `${gb.toFixed(decimals)} GB`;
}

/**
 * Format currency
 */
export function formatCurrency(cents: number | null | undefined): string {
  const c = formatNumber(cents, 0) as number;
  return `$${(c / 100).toFixed(4)}`;
}
