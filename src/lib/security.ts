// Security and authorization utilities
export function isAuthorized(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function rateLimitCheck(userId: string, action: string): boolean {
  // TODO: Implement rate limiting logic (stub)
  return true;
}

export function sanitizeInput(input: string): string {
  // Basic sanitization
  return input.replace(/[<>"'`]/g, '');
}
