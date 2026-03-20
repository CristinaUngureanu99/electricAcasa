import { describe, it, expect } from 'vitest';
import { site } from '@/config/site';

describe('site config', () => {
  it('has all required fields', () => {
    expect(site.name).toBeDefined();
    expect(site.nameFull).toBeDefined();
    expect(site.tagline).toBeDefined();
    expect(site.url).toBeDefined();
    expect(site.fromEmail).toBeDefined();
    expect(site.logoAlt).toBeDefined();
    expect(site.welcome).toBeDefined();
    expect(site.team).toBeDefined();
  });

  it('has contact info', () => {
    expect(site.contact.email).toBeDefined();
    expect(site.contact.phone).toBeDefined();
  });

  it('url is a valid URL', () => {
    expect(() => new URL(site.url)).not.toThrow();
  });
});
