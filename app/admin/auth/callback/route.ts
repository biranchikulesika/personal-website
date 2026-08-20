import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const provider = searchParams.get('provider');

  // Handle OAuth errors from the provider.
  if (errorParam) {
    const providerQuery = provider ? `&provider=${provider}` : '';
    if (errorDescription?.includes('Signups not allowed')) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=not_registered${providerQuery}`,
      );
    }
    return NextResponse.redirect(
      `${origin}/admin/login?error=${errorParam}${providerQuery}`,
    );
  }

  // Exchange the authorization code for a session.
  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=auth_callback_failed`,
      );
    }

    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Route Handler — safe to ignore.
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Fallback — something went wrong.
  return NextResponse.redirect(
    `${origin}/admin/login?error=auth_callback_failed`,
  );
}
