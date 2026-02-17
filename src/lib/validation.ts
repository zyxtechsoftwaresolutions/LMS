// Centralized validation utilities
export function validateEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function validateFileSize(file: File, maxMB: number = 10): boolean {
  return file.size <= maxMB * 1024 * 1024;
}

export function validateRequired(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}
