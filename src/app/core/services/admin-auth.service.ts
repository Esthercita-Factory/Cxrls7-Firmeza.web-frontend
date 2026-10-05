import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AppUser } from '../models/api.models';
import { CsrfTokenService } from './csrf-token.service';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfTokenService);
  readonly currentUser = signal<AppUser | null>(null);

  login(email: string, password: string, rememberMe: boolean): Observable<AppUser> {
    return this.http.post<AppUser>('/api/auth/login', { email, password, rememberMe }).pipe(
      map((user) => {
        if (user.role !== 'Administrador') {
          throw new Error('La API no autorizó una sesión administrativa.');
        }
        return user;
      }),
      tap((user) => {
        this.currentUser.set(user);
        this.csrf.clearToken();
      }),
    );
  }

  loadCurrentUser(): Observable<AppUser | null> {
    return this.http.get<AppUser>('/api/auth/me').pipe(
      map((user) => user.role === 'Administrador' ? user : null),
      tap((user) => this.currentUser.set(user)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.csrf.clearToken();
      }),
    );
  }
}
