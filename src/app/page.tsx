import Link from 'next/link';
import LandingNav from '@/components/layout/LandingNav';
import { site } from '@/config/site';

export default function HomePage() {
  return (
    <div className="min-h-screen text-gray-900 overflow-hidden">
      <LandingNav />

      {/* Hero */}
      <header className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
            {site.nameFull}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            {site.tagline}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-gray-900 font-bold rounded-full text-lg hover:bg-gray-100 transition-all hover:-translate-y-0.5 text-center"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 text-white/70 font-semibold rounded-full text-lg border border-white/20 hover:border-white/40 hover:text-white transition-all text-center"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900">
              Everything you need
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-xl mx-auto">
              A solid foundation to build your business application on.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-500 leading-relaxed">
                Secure sign-up, login, password reset, and account management powered by Supabase Auth.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Panel</h3>
              <p className="text-gray-500 leading-relaxed">
                Role-based admin dashboard. Manage users and configure your app.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Extend</h3>
              <p className="text-gray-500 leading-relaxed">
                Clean architecture with TypeScript, Tailwind CSS, and Supabase. Add your business logic on top.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
            Create your account and start building your business application today.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-gray-900 text-white font-bold rounded-full text-lg hover:bg-gray-800 transition-all hover:-translate-y-0.5"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-900 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4">
          <p className="text-white/40 text-sm font-semibold">{site.name}</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-white/40 hover:text-white/70 transition-colors">
              Terms
            </Link>
            <span className="text-white/15">|</span>
            <Link href="/privacy" className="text-white/40 hover:text-white/70 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
