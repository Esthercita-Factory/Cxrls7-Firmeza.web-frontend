import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message ?? error.error?.detail ?? error.error?.title;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }
  }
  return fallback;
}
