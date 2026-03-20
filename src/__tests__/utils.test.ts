import { describe, it, expect } from 'vitest';
import { cn, escapeHtml, formatDate, formatDateTime } from '@/lib/utils';

describe('cn', () => {
  it('joins truthy classes', () => {
    expect(cn('a', 'b', false, undefined, 'c')).toBe('a b c');
  });

  it('returns empty string for no classes', () => {
    expect(cn(false, undefined)).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes dangerous characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands and quotes', () => {
    expect(escapeHtml("rock & roll's \"best\"")).toBe(
      "rock &amp; roll&#39;s &quot;best&quot;"
    );
  });
});

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('\u2014');
  });

  it('formats a valid date', () => {
    const result = formatDate('2026-03-20');
    expect(result).toBeTruthy();
    expect(result).not.toBe('\u2014');
  });
});

describe('formatDateTime', () => {
  it('returns dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('\u2014');
  });

  it('formats a valid datetime', () => {
    const result = formatDateTime('2026-03-20T18:00:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('\u2014');
  });
});
