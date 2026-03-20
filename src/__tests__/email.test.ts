import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn().mockResolvedValue({ id: 'msg-1' });

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { sendEmail } from '@/lib/email';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 'test-key';
});

describe('sendEmail', () => {
  it('sends email with correct params', async () => {
    await sendEmail('user@test.com', 'Test Subject', '<p>Hello</p>');
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe('user@test.com');
    expect(call.subject).toBe('Test Subject');
    expect(call.html).toBe('<p>Hello</p>');
    expect(call.from).toContain('electricAcasa');
  });

  it('skips sending without RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;
    await sendEmail('user@test.com', 'Test', '<p>Hi</p>');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
