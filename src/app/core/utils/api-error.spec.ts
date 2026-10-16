import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('returns a server validation error array', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { field: 'Password', errors: ['Passwords must have at least one digit.'] },
    });

    expect(apiErrorMessage(error, 'fallback')).toBe('Passwords must have at least one digit.');
  });

  it('returns validation errors from a problem-details dictionary', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'One or more validation errors occurred.',
        errors: { Email: ['Email is invalid.'], Password: ['Password is too short.'] },
      },
    });

    expect(apiErrorMessage(error, 'fallback')).toBe('Email is invalid. Password is too short.');
  });

  it('uses the fallback when the response has no readable error', () => {
    const error = new HttpErrorResponse({ status: 500, error: {} });

    expect(apiErrorMessage(error, 'fallback')).toBe('fallback');
  });
});
