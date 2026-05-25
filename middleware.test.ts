/**
 * @jest-environment node
 */
// middleware.test.ts
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from './middleware';

function makeRequest(path: string, cookieToken?: string): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers = new Headers();
  if (cookieToken) {
    headers.set('cookie', `auth-token=${cookieToken}`);
  }
  return new NextRequest(url, { headers });
}

describe('middleware', () => {
  it('redirects unauthenticated requests to /login', () => {
    const req = makeRequest('/dashboard');
    const response = middleware(req);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('allows unauthenticated requests to /login', () => {
    const req = makeRequest('/login');
    const response = middleware(req);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated requests to protected routes', () => {
    const req = makeRequest('/dashboard', 'tok_abc');
    const response = middleware(req);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login to /dashboard', () => {
    const req = makeRequest('/login', 'tok_abc');
    const response = middleware(req);
    expect(response.headers.get('location')).toContain('/dashboard');
  });
});
