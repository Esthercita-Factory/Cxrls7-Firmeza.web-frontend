import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CsrfTokenService {
  private readonly http = inject(HttpClient);
  private tokenRequest?: Observable<string>;

  getToken(): Observable<string> {
    if (!this.tokenRequest) {
      this.tokenRequest = this.http.get<{ token: string }>('/api/auth/csrf').pipe(
        map((response) => response.token),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((error: unknown) => {
          this.tokenRequest = undefined;
          return throwError(() => error);
        }),
      );
    }
    return this.tokenRequest;
  }

  refreshToken(): Observable<string> {
    this.clearToken();
    return this.getToken();
  }

  clearToken(): void {
    this.tokenRequest = undefined;
  }
}
