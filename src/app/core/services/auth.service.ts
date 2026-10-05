import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CsrfTokenService } from './csrf-token.service';
import {
  CustomerAuthResponse,
  CustomerRegistration,
  CustomerUser,
  RegistrationResponse,
} from '../models/customer.models';

const tokenStorageKey = 'firmeza.customer.accessToken';
const userStorageKey = 'firmeza.customer.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly csrf = inject(CsrfTokenService);
  private expiryTimer?: ReturnType<typeof setTimeout>;
  readonly currentUser = signal<CustomerUser | null>(this.restoreUser());

  register(input: CustomerRegistration): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>('/api/auth/register', input);
  }

  login(email: string, password: string): Observable<CustomerUser> {
    return this.http
      .post<CustomerAuthResponse>('/api/auth/customer/login', { email, password })
      .pipe(
        map((response) => {
          if (response.user.role !== 'Cliente' || !this.hasValidToken(response.accessToken)) {
            this.clearSession();
            throw new Error('La API no devolvió una sesión de cliente válida.');
          }
          this.csrf.clearToken();
          sessionStorage.setItem(tokenStorageKey, response.accessToken);
          sessionStorage.setItem(userStorageKey, JSON.stringify(response.user));
          this.currentUser.set(response.user);
          this.scheduleExpiry(response.accessToken);
          return response.user;
        }),
      );
  }

  getAccessToken(): string | null {
    const token = sessionStorage.getItem(tokenStorageKey);
    if (token && this.hasValidToken(token)) return token;
    if (token) {
      this.clearSession();
      void this.router.navigateByUrl('/login');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null && this.currentUser() !== null;
  }

  clearSession(): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    sessionStorage.removeItem(tokenStorageKey);
    sessionStorage.removeItem(userStorageKey);
    this.currentUser.set(null);
  }

  private restoreUser(): CustomerUser | null {
    const token = sessionStorage.getItem(tokenStorageKey);
    if (!token || !this.hasValidToken(token)) {
      sessionStorage.removeItem(tokenStorageKey);
      sessionStorage.removeItem(userStorageKey);
      return null;
    }

    try {
      const user: unknown = JSON.parse(sessionStorage.getItem(userStorageKey) ?? 'null');
      if (
        typeof user === 'object' &&
        user !== null &&
        'email' in user &&
        typeof user.email === 'string' &&
        'fullName' in user &&
        typeof user.fullName === 'string' &&
        'role' in user &&
        user.role === 'Cliente'
      ) {
        this.scheduleExpiry(token);
        return {
          email: user.email,
          fullName: user.fullName,
          role: 'Cliente',
        };
      }
    } catch {
      sessionStorage.removeItem(userStorageKey);
    }
    sessionStorage.removeItem(tokenStorageKey);
    sessionStorage.removeItem(userStorageKey);
    return null;
  }

  private scheduleExpiry(token: string): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    const exp = this.readExpiry(token);
    if (exp === null) return;
    this.expiryTimer = setTimeout(() => {
      this.clearSession();
      void this.router.navigateByUrl('/login');
    }, Math.max(0, exp * 1000 - Date.now()));
  }

  private readExpiry(token: string): number | null {
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
      return typeof claims === 'object' && claims !== null && 'exp' in claims &&
        typeof claims.exp === 'number'
        ? claims.exp
        : null;
    } catch {
      return null;
    }
  }

  private hasValidToken(token: string): boolean {
    const exp = this.readExpiry(token);
    const payload = this.readClaims(token);
    return exp !== null && exp * 1000 > Date.now() &&
      payload !== null && payload['role'] === 'Cliente';
  }

  private readClaims(token: string): Record<string, unknown> | null {
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const claims: unknown = JSON.parse(new TextDecoder().decode(bytes));
      return typeof claims === 'object' && claims !== null
        ? claims as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
}
