import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`
}

export function formatDb(gainLinear: number): string {
  if (gainLinear <= 0.0001) return '-∞ dB'
  const db = 20 * Math.log10(gainLinear)
  return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}

export function linearToDb(linear: number): number {
  if (linear <= 0.0001) return -60
  return 20 * Math.log10(linear)
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
}
