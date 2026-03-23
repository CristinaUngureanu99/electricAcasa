import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB (package-request has its own 10MB file limit)

export async function middleware(request: NextRequest) {
  // Block oversized JSON bodies on API routes (excludes multipart for file uploads)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const contentLength = Number(request.headers.get('content-length') || 0);
    const contentType = request.headers.get('content-type') || '';
    if (contentLength > MAX_BODY_SIZE && !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|favicon.png|icons/|manifest.json|logo.*\\.png).*)',
  ],
};
