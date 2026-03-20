import { describe, it, expect } from 'vitest';
import type { UserRole, Profile } from '@/types/database';

describe('UserRole type', () => {
  it('accepts valid roles', () => {
    const roles: UserRole[] = ['user', 'admin'];
    expect(roles).toHaveLength(2);
  });
});

describe('Profile type', () => {
  it('has all required fields', () => {
    const profile: Profile = {
      id: 'usr-1',
      email: 'test@example.com',
      full_name: 'Test User',
      phone: null,
      role: 'user',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(profile.id).toBeDefined();
    expect(profile.role).toBe('user');
  });
});
