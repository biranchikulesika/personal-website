'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  signInWithGoogle,
  signInWithGitHub,
  generatePasskeyAuthenticationOptionsAction,
  verifyPasskeyLoginAction,
} from './actions';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { SITE_DOMAIN } from '@/lib/constants';

interface DailyBackground {
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [background, setBackground] = useState<DailyBackground | null>(null);

  const errorParam = searchParams.get('error');

  // If already authenticated on client mount, redirect to /admin
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          window.location.href = '/admin';
        }
      });
    }
  }, []);

  // Fetch daily background on mount
  useEffect(() => {
    fetch('/api/login-background')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.imageUrl) {
          setBackground(data);
        }
      })
      .catch(() => {
        // Background unavailable — continue with fallback
      });
  }, []);

  async function handleOAuth(provider: 'google' | 'github') {
    setError('');
    setOAuthLoading(provider);

    try {
      const action = provider === 'google' ? signInWithGoogle : signInWithGitHub;
      const result = await action();
      if (result.error) {
        setError(result.error);
        setOAuthLoading(null);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setError('An unexpected error occurred');
      setOAuthLoading(null);
    }
  }

  async function handlePasskey() {
    setError('');
    setPasskeyLoading(true);

    try {
      if (!browserSupportsWebAuthn()) {
        setError('WebAuthn / Passkeys are not supported by this browser.');
        setPasskeyLoading(false);
        return;
      }

      // 1. Fetch authentication options from the server
      const optResult = await generatePasskeyAuthenticationOptionsAction();
      if (!optResult.success || !optResult.options) {
        setError(optResult.error || 'Failed to initialize passkey authentication.');
        setPasskeyLoading(false);
        return;
      }

      // 2. Perform WebAuthn authentication ceremony in the browser
      let authResponse;
      try {
        authResponse = await startAuthentication({
          optionsJSON: optResult.options,
        });
      } catch (webauthnErr: unknown) {
        const errName = (webauthnErr as { name?: string })?.name;
        if (errName === 'NotAllowedError' || errName === 'AbortError') {
          setError('Passkey prompt cancelled or timed out.');
          setPasskeyLoading(false);
          return;
        }
        throw webauthnErr;
      }

      // 3. Cryptographically verify the assertion response on the server
      const verifyResult = await verifyPasskeyLoginAction({
        response: authResponse,
      });

      if (!verifyResult.success || verifyResult.error) {
        setError(verifyResult.error || 'Passkey authentication failed. Please try again.');
      } else {
        window.location.href = '/admin';
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Passkey authentication failed. Please try again.');
    } finally {
      setPasskeyLoading(false);
    }
  }

  const loading = passkeyLoading || oauthLoading !== null;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-night">
      {/* Background image */}
      {background && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={background.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-night/70" />
        </div>
      )}

      {/* Centered content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-xs flex-col items-center">
          {/* Profile picture */}
          <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-2 border-tinted/20 bg-night-soft opacity-90">
            <Image
              src="https://kulesika.in/profile.jpeg"
              alt="Biranchi Kulesika"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>

          {/* Name */}
          <h1 className="mb-1 text-center font-serif text-2xl font-normal tracking-tight text-paper">
            Biranchi Kulesika
          </h1>
          <p className="mb-8 text-center text-sm text-ink-soft">
            Administrator
          </p>

          {/* Error message */}
          {(error || errorParam) && (
            <div
              role="alert"
              className="mb-5 w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400"
            >
              {error || 'Authentication failed. Please try again.'}
            </div>
          )}

          {/* Auth methods */}
          <div className="flex items-center justify-center gap-10">
            <button
              type="button"
              onClick={handlePasskey}
              disabled={loading}
              title="Sign in with Passkey / Biometrics"
              aria-label="Sign in with Passkey or Biometrics"
              className="group flex flex-col items-center gap-2 py-3 transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {/* Fingerprint in brand color */}
              <svg className="h-8 w-8 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 10c-2.2 0-3.5 1.8-3.5 4 0 2 .5 3.8 1.4 5.5" />
                <path d="M12 10c1.7 0 3.1 1.2 3.8 2.9" />
                <path d="M12 3.5c-2.8 0-5 2.2-5 5 0 1.3.3 2.6.7 3.8" />
                <path d="M12 3.5c2.7 0 5 2.2 5 5 0 .7-.1 1.4-.3 2" />
                <path d="M12 17c.3 1.6.8 3.1 1.6 4.5" />
                <path d="M8 9c.5-1.7 2-3 3.7-3.3" />
                <path d="M4.8 11c0-.9.2-1.7.4-2.5" />
                <path d="M17.5 9c-.4-1.6-1-2.5-1.8-3.2" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              title="Sign in with Google"
              aria-label="Sign in with Google"
              className="group flex flex-col items-center gap-2 py-3 transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {/* Google full-color logo */}
              <svg className="h-8 w-8 transition-transform group-hover:scale-110" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={loading}
              title="Sign in with GitHub"
              aria-label="Sign in with GitHub"
              className="group flex flex-col items-center gap-2 py-3 transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {/* GitHub mark — light on dark */}
              <svg className="h-8 w-8 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="#FAF9F5" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Attribution */}
      {background && (
        <div className="absolute bottom-2 right-4 z-10">
          <a
            href={background.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-paper/25 transition-colors hover:text-paper/50"
          >
            Photo by {background.photographer} on Pexels
          </a>
        </div>
      )}

      {/* Bottom */}
      <div className="relative z-10 shrink-0 pb-5 pt-2 text-center">
        <p className="text-[11px] text-ink-soft/60">
          {SITE_DOMAIN}
        </p>
      </div>
    </div>
  );
}
