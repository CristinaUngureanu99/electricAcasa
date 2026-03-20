import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateSessionMock = vi.fn().mockResolvedValue(new Response());

vi.mock('@/lib/supabase-middleware', () => ({
  updateSession: (...args: unknown[]) => updateSessionMock(...args),
}));

import { middleware } from '@/middleware';

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(path: string) {
  return {
    nextUrl: {
      pathname: path,
      clone() { return { pathname: path }; },
    },
    cookies: { getAll: () => [] },
  } as never;
}

describe('Middleware', () => {
  it('calls updateSession for protected route', async () => {
    const req = makeRequest('/dashboard');
    await middleware(req);
    expect(updateSessionMock).toHaveBeenCalledWith(req);
  });

  it('calls updateSession for admin route', async () => {
    const req = makeRequest('/admin/dashboard');
    await middleware(req);
    expect(updateSessionMock).toHaveBeenCalledWith(req);
  });

  it('calls updateSession for public route', async () => {
    const req = makeRequest('/login');
    await middleware(req);
    expect(updateSessionMock).toHaveBeenCalledWith(req);
  });

  it('calls updateSession for root', async () => {
    const req = makeRequest('/');
    await middleware(req);
    expect(updateSessionMock).toHaveBeenCalledWith(req);
  });
});

describe('Middleware config', () => {
  it('exports a matcher config', async () => {
    const mod = await import('@/middleware');
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
  });
});
