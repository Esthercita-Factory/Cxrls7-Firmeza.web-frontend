import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { apiInterceptor } from '../http/api.interceptor';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AdminAuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the administrator cookie session', () => {
    let signedInRole = '';
    service.login('admin@example.com', 'secret', true).subscribe((user) => {
      signedInRole = user.role;
    });

    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    const request = http.expectOne('/api/auth/login');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-token');
    request.flush({
      email: 'admin@example.com',
      fullName: 'Admin Firmeza',
      role: 'Administrador',
    });

    expect(signedInRole).toBe('Administrador');
    expect(service.currentUser()?.email).toBe('admin@example.com');

    TestBed.inject(HttpClient).post('/api/products', {}).subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'authenticated-csrf-token' });
    const productRequest = http.expectOne('/api/products');
    expect(productRequest.request.headers.get('X-CSRF-TOKEN')).toBe('authenticated-csrf-token');
    productRequest.flush({});
  });

  it('does not establish an administrator session for a customer role', () => {
    let rejected = false;
    service.login('customer@example.com', 'secret', false).subscribe({
      error: () => { rejected = true; },
    });

    http.expectOne('/api/auth/csrf').flush({ token: 'csrf-token' });
    http.expectOne('/api/auth/login').flush({
      email: 'customer@example.com',
      fullName: 'Customer',
      role: 'Cliente',
    });

    expect(rejected).toBeTrue();
    expect(service.currentUser()).toBeNull();
  });

  it('refreshes the antiforgery token once when the API rejects a stale token', () => {
    TestBed.inject(HttpClient).post('/api/products', {}).subscribe();

    http.expectOne('/api/auth/csrf').flush({ token: 'stale-csrf-token' });
    const firstAttempt = http.expectOne('/api/products');
    expect(firstAttempt.request.headers.get('X-CSRF-TOKEN')).toBe('stale-csrf-token');
    firstAttempt.flush(
      { message: 'El token CSRF no es válido o ha expirado.' },
      { status: 400, statusText: 'Bad Request' },
    );

    http.expectOne('/api/auth/csrf').flush({ token: 'fresh-csrf-token' });
    const retry = http.expectOne('/api/products');
    expect(retry.request.headers.get('X-CSRF-TOKEN')).toBe('fresh-csrf-token');
    retry.flush({});
  });
});
