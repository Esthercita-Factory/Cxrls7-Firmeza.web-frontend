import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CsrfTokenService } from '../services/csrf-token.service';

const authenticationRoutes = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/customer/login',
]);
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) return next(request);

  const auth = inject(AuthService);
  const router = inject(Router);
  const csrf = inject(CsrfTokenService);
  const isCustomerRequest = request.url.startsWith('/api/client/') ||
    (request.url === '/api/auth/csrf' && !router.url.startsWith('/admin'));
  const token = isCustomerRequest ? auth.getAccessToken() : null;
  const outgoing = request.clone({
    withCredentials: true,
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

  const request$ = safeMethods.has(request.method.toUpperCase())
    ? next(outgoing)
    : csrf.refreshToken().pipe(
      switchMap((csrfToken) =>
        next(outgoing.clone({ setHeaders: { 'X-CSRF-TOKEN': csrfToken } })),
      ),
    );

  return request$.pipe(
    catchError((error: unknown) => {
      if (!isCsrfValidationError(error) || safeMethods.has(request.method.toUpperCase())) {
        return throwError(() => error);
      }

      return csrf.refreshToken().pipe(
        switchMap((csrfToken) =>
          next(outgoing.clone({ setHeaders: { 'X-CSRF-TOKEN': csrfToken } })),
        ),
      );
    }),
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403) &&
        !authenticationRoutes.has(request.url)
      ) {
        if (isCustomerRequest) {
          auth.clearSession();
          void router.navigateByUrl('/login');
        } else {
          void router.navigateByUrl('/admin/login');
        }
      }
      return throwError(() => error);
    }),
  );
};

function isCsrfValidationError(error: unknown): error is HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse) || error.status !== 400) return false;
  const body: unknown = error.error;
  return typeof body === 'object' && body !== null && 'message' in body &&
    typeof body.message === 'string' && body.message.includes('token CSRF');
}
