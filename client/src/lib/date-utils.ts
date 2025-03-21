/**
 * Format a date to a human-readable string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a date with time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate days between two dates
 * @param start Start date
 * @param end End date
 * @returns Number of days between dates
 */
export function daysBetween(start: Date, end: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((end.getTime() - start.getTime()) / millisecondsPerDay));
}

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Add days to a date
 * @param date Base date
 * @param days Number of days to add
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a relative time (e.g., "2 days ago", "in 3 hours")
 * @param date Date to format relative to now
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // In the future
  if (diffInSeconds < 0) {
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) return `in ${absDiff} seconds`;
    if (absDiff < 3600) return `in ${Math.floor(absDiff / 60)} minutes`;
    if (absDiff < 86400) return `in ${Math.floor(absDiff / 3600)} hours`;
    if (absDiff < 2592000) return `in ${Math.floor(absDiff / 86400)} days`;
    if (absDiff < 31536000) return `in ${Math.floor(absDiff / 2592000)} months`;
    return `in ${Math.floor(absDiff / 31536000)} years`;
  }
  
  // In the past
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
} 