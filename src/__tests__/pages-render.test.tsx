import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next modules
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => <img alt={alt} {...props} />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      signOut: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  }),
}));

describe('Landing page', () => {
  it('homepage module exists at (shop) route group', async () => {
    // Homepage is now a server component in (shop)/page.tsx with async data fetching
    // It cannot be rendered in jsdom; verified via build + e2e instead
    const mod = await import('@/app/(shop)/page');
    expect(mod.default).toBeDefined();
  });
});

describe('Not Found page', () => {
  it('renders 404 message', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});

describe('DashboardContent', () => {
  it('renders placeholder cards', async () => {
    const { default: DashboardContent } = await import('@/app/(client)/dashboard/DashboardContent');
    render(<DashboardContent profile={{ id: '1', email: 'test@test.com', full_name: 'Test', phone: null, role: 'user', created_at: '' }} />);
    expect(screen.getByText(/Your Profile/i)).toBeInTheDocument();
  });

  it('shows user name in greeting', async () => {
    const { default: DashboardContent } = await import('@/app/(client)/dashboard/DashboardContent');
    render(<DashboardContent profile={{ id: '1', email: 'test@test.com', full_name: 'John Doe', phone: null, role: 'user', created_at: '' }} />);
    expect(screen.getByText(/John/)).toBeInTheDocument();
  });
});
