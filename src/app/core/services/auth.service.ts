import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AppUser } from '../models/api.models';
import { CsrfTokenService } from './csrf-token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly csrfToken = inject(CsrfTokenService);
  readonly currentUser = signal<AppUser | null>(null);

  login(email: string, password: string, rememberMe: boolean): Observable<AppUser> {
    return this.http
      .post<AppUser>('/api/auth/login', { email, password, rememberMe })
      .pipe(map((user) => {
        this.currentUser.set(user);
        this.csrfToken.clearToken();
        return user;
      }));
  }

  loadCurrentUser(): Observable<AppUser | null> {
    return this.http.get<AppUser>('/api/auth/me').pipe(
      map((user) => {
        this.currentUser.set(user);
        return user;
      }),
      catchError((error: { status?: number }) => {
        if (error.status !== 401) {
          throw error;
        }
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    return this.csrfToken.refreshToken().pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
      map(() => {
        this.currentUser.set(null);
        this.csrfToken.clearToken();
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.currentUser.set(null);
          this.csrfToken.clearToken();
          return of(undefined);
        }
        return throwError(() => error);
      }),
    );
  }
}
