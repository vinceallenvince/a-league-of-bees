// Mock implementation of the cn utility function
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
} 