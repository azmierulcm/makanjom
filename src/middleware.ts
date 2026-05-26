import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require a specific role
const ROLE_ROUTES: Record<string, string> = {
  '/vendor': 'vendor',
  '/admin': 'admin',
  '/creator': 'creator',
};

// Default dashboard per role
const ROLE_DASHBOARDS: Record<string, string> = {
  customer: '/profile',
  vendor: '/vendor',
  admin: '/admin',
  creator: '/creator',
};

export async function middleware(request: NextRequest) {
  // Fail-closed: any unexpected error redirects to login instead of allowing access
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() validates the JWT server-side — do not replace with getSession()
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;

    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if this route requires a specific role
    const requiredRole = Object.entries(ROLE_ROUTES).find(([route]) =>
      pathname.startsWith(route)
    )?.[1];

    if (requiredRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Fall back to user_metadata.role if profile row isn't ready yet (e.g. trigger delay)
      const userRole: string = profile?.role ?? (user.user_metadata?.role as string) ?? 'customer';

      if (userRole !== requiredRole) {
        const destination = ROLE_DASHBOARDS[userRole] ?? '/profile';
        return NextResponse.redirect(new URL(destination, request.url));
      }
    }

    return supabaseResponse;
  } catch {
    // On unexpected errors, redirect to login (fail closed — never expose protected routes)
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/vendor/:path*', '/admin/:path*', '/creator/:path*', '/profile/:path*'],
};
