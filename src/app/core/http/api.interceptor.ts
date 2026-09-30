import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { CsrfTokenService } from '../services/csrf-token.service';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) {
    return next(request);
  }

  const credentialedRequest = request.clone({ withCredentials: true });
  if (safeMethods.has(request.method.toUpperCase())) {
    return next(credentialedRequest);
  }

  return inject(CsrfTokenService)
    .getToken()
    .pipe(
      switchMap((token) =>
        next(
          credentialedRequest.clone({
            setHeaders: { 'X-CSRF-TOKEN': token },
          }),
        ),
      ),
    );
};
