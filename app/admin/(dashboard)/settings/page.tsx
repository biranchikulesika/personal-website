'use client';

import React, { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [identities, setIdentities] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        experimental: {
          passkey: true,
        },
      },
    }
  );

  const registerPasskey = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Passkey registered successfully! You can now use it to log in.');
      }
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    }
    setLoading(false);
  };

  const fetchIdentities = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.identities) {
      setIdentities(user.identities);
    }
  }, [supabase.auth]);

  React.useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const handleLinkIdentity = async (provider: 'github' | 'google') => {
    setLoading(true);
    setMessage('');
    try {
      const redirectUrl = `${window.location.origin}/admin/auth/callback?next=/admin/settings`;
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setMessage('Error: ' + err.message);
      setLoading(false);
    }
  };

  const handleUnlinkIdentity = async (provider: string) => {
    setLoading(true);
    setMessage('');
    try {
      const identity = identities.find(id => id.provider === provider);
      if (!identity) throw new Error("Identity not found");
      
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      
      setMessage(`Successfully unlinked ${provider} account.`);
      await fetchIdentities();
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    }
    setLoading(false);
  };

  const isLinked = (provider: string) => {
    return identities.some(id => id.provider === provider);
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">System Settings</h1>
          <p className="text-neutral-500 text-sm">Manage global workspace configuration.</p>
        </div>
      </div>

      <div className="max-w-2xl bg-[#111111] p-6 rounded-lg border border-[#1a1a1a] space-y-6 mb-8">
         <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2">Workspace Name</label>
            <input type="text" className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500" defaultValue="Biranchi Operator Workspace" />
         </div>
      </div>

      <div className="max-w-2xl bg-[#111111] p-6 rounded-lg border border-[#1a1a1a] space-y-6">
        <div>
          <h2 className="text-xl font-medium text-neutral-200 mb-2">Security</h2>
          <p className="text-sm text-neutral-500 mb-6">Manage your authentication methods and security settings.</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#161616] border border-[#222] rounded-md gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-md">
                <KeyRound className="w-5 h-5 text-neutral-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">Passkeys</p>
                <p className="text-xs text-neutral-500">Sign in securely using your device&apos;s biometric authentication.</p>
              </div>
            </div>
            <button
              onClick={registerPasskey}
              disabled={loading}
              className="flex items-center justify-center min-w-[120px] px-4 py-2 bg-neutral-200 hover:bg-white text-neutral-900 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Passkey'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#161616] border border-[#222] rounded-md gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-md">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-[#FFFFFF]">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">GitHub Account</p>
                <p className="text-xs text-neutral-500">
                  {isLinked('github') ? 'Your GitHub account is connected.' : 'Connect your GitHub account to sign in.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => isLinked('github') ? handleUnlinkIdentity('github') : handleLinkIdentity('github')}
              disabled={loading}
              className={`flex items-center justify-center min-w-[120px] px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${isLinked('github') ? 'bg-[#1a1a1a] text-neutral-300 hover:bg-red-900/30 hover:text-red-400 border border-[#333]' : 'bg-neutral-200 hover:bg-white text-neutral-900'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLinked('github') ? 'Disconnect' : 'Connect')}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#161616] border border-[#222] rounded-md gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-md">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-200">Google Account</p>
                <p className="text-xs text-neutral-500">
                  {isLinked('google') ? 'Your Google account is connected.' : 'Connect your Google account to sign in.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => isLinked('google') ? handleUnlinkIdentity('google') : handleLinkIdentity('google')}
              disabled={loading}
              className={`flex items-center justify-center min-w-[120px] px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${isLinked('google') ? 'bg-[#1a1a1a] text-neutral-300 hover:bg-red-900/30 hover:text-red-400 border border-[#333]' : 'bg-neutral-200 hover:bg-white text-neutral-900'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLinked('google') ? 'Disconnect' : 'Connect')}
            </button>
          </div>
          
          {message && (
            <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
