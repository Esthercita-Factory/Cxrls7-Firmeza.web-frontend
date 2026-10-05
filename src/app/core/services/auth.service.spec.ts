import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { apiInterceptor } from '../http/api.interceptor';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('stores a customer JWT in session storage after successful sign-in', () => {
    const token = createToken(Date.now() + 60_000);
    let signedIn = false;

    service.login('cliente@example.com', 'password').subscribe(() => {
      signedIn = true;
    });

    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const request = http.expectOne('/api/auth/customer/login');
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-token');
    request.flush({
      accessToken: token,
      expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
      user: { email: 'cliente@example.com', fullName: 'Ana Cliente', role: 'Cliente' },
    });

    expect(signedIn).toBeTrue();
    expect(sessionStorage.getItem('firmeza.customer.accessToken')).toBe(token);
    expect(service.currentUser()?.role).toBe('Cliente');
    expect(service.isAuthenticated()).toBeTrue();

    TestBed.inject(HttpClient).post('/api/client/checkout', {}).subscribe();
    const csrfRequest = http.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    csrfRequest.flush({ token: 'authenticated-csrf-token' });
    const checkoutRequest = http.expectOne('/api/client/checkout');
    expect(checkoutRequest.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(checkoutRequest.request.headers.get('X-CSRF-TOKEN')).toBe('authenticated-csrf-token');
    checkoutRequest.flush({});
  });

  it('clears the customer session and redirects when the JWT expires', fakeAsync(() => {
    const token = createToken(Date.now() + 1_000);
    let navigated = false;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.callFake(() => {
      navigated = true;
      return Promise.resolve(true);
    });

    service.login('cliente@example.com', 'password').subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    http.expectOne('/api/auth/customer/login').flush({
      accessToken: token,
      expiresAtUtc: new Date(Date.now() + 1_000).toISOString(),
      user: { email: 'cliente@example.com', fullName: 'Ana Cliente', role: 'Cliente' },
    });

    tick(1_000);
    expect(service.currentUser()).toBeNull();
    expect(sessionStorage.getItem('firmeza.customer.accessToken')).toBeNull();
    expect(navigated).toBeTrue();
    flush();
  }));
});

function createToken(expiration: number): string {
  const payload = btoa(JSON.stringify({
    exp: Math.floor(expiration / 1000),
    role: 'Cliente',
  }));
  return `header.${payload}.signature`;
}
