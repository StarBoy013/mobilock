import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // In a real app, this would verify a JWT cookie.
  // For the frontend demo, we check localStorage state set by Zustand (authStore).
  // Note: localStorage isn't available in Edge Middleware, so for the demo we'll
  // skip strict server-side protection and rely on client-side redirects or just let it pass
  // since this is a frontend-only mockup right now. 
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
