import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { CsrfTokenService } from './csrf-token.service';

describe('AuthService', () => {
  let service: AuthService;
  let csrfToken: CsrfTokenService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    csrfToken = TestBed.inject(CsrfTokenService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the backend session endpoint and publishes the authenticated user', () => {
    const user = {
      email: 'admin@example.com',
      role: 'Administrador',
      fullName: 'Admin Firmeza',
    };

    csrfToken.getToken().subscribe();
    http.expectOne('/api/auth/csrf').flush({ token: 'anonymous-csrf-token' });

    service.login(user.email, 'secret', true).subscribe((response) => {
      expect(response).toEqual(user);
      expect(service.currentUser()).toEqual(user);
    });

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: user.email,
      password: 'secret',
      rememberMe: true,
    });
    request.flush(user);

    csrfToken.getToken().subscribe((token) => expect(token).toBe('authenticated-csrf-token'));
    http.expectOne('/api/auth/csrf').flush({ token: 'authenticated-csrf-token' });
  });

  it('clears the in-memory user when the session has expired', () => {
    service.currentUser.set({
      email: 'admin@example.com',
      role: 'Administrador',
      fullName: 'Admin Firmeza',
    });

    service.loadCurrentUser().subscribe((user) => {
      expect(user).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    http.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  it('refreshes the CSRF token before ending the server session', () => {
    service.currentUser.set({
      email: 'admin@example.com',
      role: 'Administrador',
      fullName: 'Admin Firmeza',
    });

    service.logout().subscribe(() => {
      expect(service.currentUser()).toBeNull();
    });

    http.expectOne('/api/auth/csrf').flush({ token: 'fresh-csrf-token' });
    const request = http.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush(null);

    csrfToken.getToken().subscribe((token) => expect(token).toBe('anonymous-csrf-token'));
    http.expectOne('/api/auth/csrf').flush({ token: 'anonymous-csrf-token' });
  });

  it('clears the CSRF token after logout when the session has already expired', () => {
    service.logout().subscribe();

    http.expectOne('/api/auth/csrf').flush({ token: 'authenticated-csrf-token' });
    http.expectOne('/api/auth/logout').flush(null, { status: 401, statusText: 'Unauthorized' });

    csrfToken.getToken().subscribe((token) => expect(token).toBe('anonymous-csrf-token'));
    http.expectOne('/api/auth/csrf').flush({ token: 'anonymous-csrf-token' });
  });
});
