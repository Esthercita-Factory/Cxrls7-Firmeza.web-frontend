import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    const message = readMessage(body);
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
}

function readMessage(body: unknown): string | null {
  if (typeof body === 'string') return body;
  if (typeof body !== 'object' || body === null) return null;

  if ('message' in body && typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  if ('detail' in body && typeof body.detail === 'string' && body.detail.trim()) {
    return body.detail;
  }
  if ('errors' in body) {
    const errors: unknown = body.errors;
    const messages = Array.isArray(errors)
      ? errors.filter((item): item is string => typeof item === 'string')
      : typeof errors === 'object' && errors !== null
        ? Object.values(errors)
            .flatMap((value) => Array.isArray(value) ? value : [value])
            .filter((item): item is string => typeof item === 'string')
        : [];
    if (messages.length > 0) return messages.join(' ');
  }
  if ('title' in body && typeof body.title === 'string' && body.title.trim()) {
    return body.title;
  }
  return null;
}
