import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type FreshnessState = 'fresh' | 'stale' | 'updating'

export function formatIST(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return formatter.format(date).toUpperCase() + ' IST'
}

export function computeFreshness(
  lastSync: Date | null | undefined,
  syncing: boolean,
  staleThresholdMs: number = 60_000,
): FreshnessState {
  if (syncing || !lastSync) return 'updating'
  const ageMs = Date.now() - lastSync.getTime()
  return ageMs > staleThresholdMs ? 'stale' : 'fresh'
}
