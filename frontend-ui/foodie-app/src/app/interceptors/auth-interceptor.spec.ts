import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('attaches the bearer token when one is stored', () => {
    const token = futureJwt();
    localStorage.setItem('auth_token', token);

    http.get('/api/orders').subscribe();
    const req = httpMock.expectOne('/api/orders');

    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush([]);
  });

  it('logs out and omits the header when the stored token is expired', () => {
    spyOn(auth, 'logout').and.callThrough();
    localStorage.setItem('auth_token', expiredJwt());

    http.get('/api/restaurants').subscribe();
    const req = httpMock.expectOne('/api/restaurants');

    expect(auth.logout).toHaveBeenCalled();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('logs out on a 401 from a protected endpoint', () => {
    spyOn(auth, 'logout');
    spyOn(auth, 'getToken').and.returnValue(futureJwt());
    spyOn(auth, 'isLoggedIn').and.returnValue(true);

    http.get('/api/orders').subscribe({ error: () => undefined });
    const req = httpMock.expectOne('/api/orders');
    req.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
  });

  it('does not log out on a failed login attempt', () => {
    spyOn(auth, 'logout');

    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'bad credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).not.toHaveBeenCalled();
  });
});

function futureJwt(): string {
  return encodeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
}

function expiredJwt(): string {
  return encodeJwt({ exp: Math.floor(Date.now() / 1000) - 60 });
}

function encodeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}
