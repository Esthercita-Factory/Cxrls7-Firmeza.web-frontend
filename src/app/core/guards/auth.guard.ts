import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminAuthService } from '../services/admin-auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  return auth.loadCurrentUser().pipe(
    map((user) => user ? true : router.createUrlTree(['/admin/login'])),
    catchError(() => of(router.createUrlTree(['/admin/login'], { queryParams: { reason: 'api' } }))),
  );
};
