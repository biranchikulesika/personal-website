'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import {
  Loader2, KeyRound, Plus, Trash2, Edit2, Check, X,
  ShieldCheck, Smartphone, Laptop, Key, AlertCircle, Fingerprint, Info
} from 'lucide-react';
import {
  generatePasskeyRegistrationOptionsAction,
  verifyPasskeyRegistrationAction,
  listPasskeysAction,
  renamePasskeyAction,
  deletePasskeyAction,
} from '@/app/admin/actions/passkeys.actions';
import type { PasskeyListItem } from '@/lib/types/passkey';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);

  // Passkey State
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [registeringState, setRegisteringState] = useState<'idle' | 'options' | 'device' | 'verifying'>('idle');
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customPasskeyName, setCustomPasskeyName] = useState('');
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingPasskeyName, setEditingPasskeyName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Check WebAuthn browser capability on mount
  useEffect(() => {
    try {
      const supported = browserSupportsWebAuthn();
      setWebAuthnSupported(supported);
    } catch {
      setWebAuthnSupported(false);
    }
  }, []);

  const loadPasskeys = useCallback(async () => {
    try {
      setPasskeysLoading(true);
      const list = await listPasskeysAction();
      setPasskeys(list);
    } catch (err: any) {
      console.error('Failed to load passkeys:', err);
    } finally {
      setPasskeysLoading(false);
    }
  }, []);

  const fetchIdentities = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.identities) {
      setIdentities(user.identities);
    }
  }, [supabase.auth]);

  useEffect(() => {
    fetchIdentities();
    loadPasskeys();
  }, [fetchIdentities, loadPasskeys]);

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setNotification(prev => prev?.text === text ? null : prev);
      }, 5000);
    }
  };

  /**
   * Complete WebAuthn registration ceremony:
   * 1. Request options from server
   * 2. Call navigator.credentials.create() via startRegistration
   * 3. Send response to server for cryptographic verification and storage
   */
  const handleRegisterPasskey = async () => {
    if (registeringState !== 'idle') return;

    if (!webAuthnSupported) {
      showNotification('error', 'Your browser or device does not support WebAuthn Passkeys.');
      return;
    }

    setNotification(null);
    setRegisteringState('options');

    try {
      // Step 1: Server generates challenge & options
      const optionsRes = await generatePasskeyRegistrationOptionsAction();
      if (!optionsRes.success || !optionsRes.options) {
        throw new Error('Failed to generate passkey options from server.');
      }

      setRegisteringState('device');

      // Step 2: Browser WebAuthn prompt
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: optionsRes.options });
      } catch (browserErr: any) {
        if (browserErr.name === 'NotAllowedError' || browserErr.message?.includes('not allowed') || browserErr.message?.includes('cancelled')) {
          setRegisteringState('idle');
          showNotification('info', 'Passkey registration was cancelled.');
          return;
        }
        if (browserErr.name === 'InvalidStateError') {
          setRegisteringState('idle');
          showNotification('error', 'This passkey is already registered on this device.');
          return;
        }
        if (browserErr.name === 'NotSupportedError') {
          setRegisteringState('idle');
          showNotification('error', 'The requested authenticator configuration is not supported by your device.');
          return;
        }
        throw browserErr;
      }

      setRegisteringState('verifying');

      // Step 3: Server cryptographic verification
      const verifyRes = await verifyPasskeyRegistrationAction(
        attResp,
        customPasskeyName.trim() || undefined
      );

      if (verifyRes.success && verifyRes.credential) {
        setPasskeys(prev => [verifyRes.credential, ...prev.filter(p => p.id !== verifyRes.credential.id)]);
        showNotification('success', `Passkey "${verifyRes.credential.name}" added successfully!`);
        setIsAddModalOpen(false);
        setCustomPasskeyName('');
      } else {
        throw new Error('Server verification failed to confirm the passkey.');
      }
    } catch (err: any) {
      console.error('Passkey registration error:', err);
      showNotification('error', err.message || 'Passkey registration failed. Please try again.');
    } finally {
      setRegisteringState('idle');
    }
  };

  const handleRename = async (id: string) => {
    if (!editingPasskeyName.trim()) return;
    setActionLoading(true);
    try {
      await renamePasskeyAction(id, editingPasskeyName.trim());
      setPasskeys(prev => prev.map(p => p.id === id ? { ...p, name: editingPasskeyName.trim() } : p));
      setEditingPasskeyId(null);
      showNotification('success', 'Passkey renamed.');
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to rename passkey.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the passkey "${name}"? You will no longer be able to use it to sign in.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await deletePasskeyAction(id);
      setPasskeys(prev => prev.filter(p => p.id !== id));
      showNotification('success', `Passkey "${name}" removed.`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to remove passkey.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkIdentity = async (provider: 'github' | 'google') => {
    setLoading(true);
    setNotification(null);
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
      showNotification('error', err.message || 'Failed to link account.');
      setLoading(false);
    }
  };

  const handleUnlinkIdentity = async (provider: string) => {
    setLoading(true);
    setNotification(null);
    try {
      const identity = identities.find(id => id.provider === provider);
      if (!identity) throw new Error("Identity not found");
      
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      
      showNotification('success', `Successfully unlinked ${provider} account.`);
      await fetchIdentities();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to unlink account.');
    } finally {
      setLoading(false);
    }
  };

  const isLinked = (provider: string) => {
    return identities.some(id => id.provider === provider);
  };

  const getDeviceIcon = (deviceType: string, transports?: string[]) => {
    if (transports?.includes('usb') || transports?.includes('nfc') || transports?.includes('ble')) {
      return <Key className="w-4 h-4 text-amber-400" />;
    }
    if (transports?.includes('internal') || deviceType === 'singleDevice') {
      return <Laptop className="w-4 h-4 text-blue-400" />;
    }
    return <Smartphone className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="w-full max-w-350 mx-auto p-5 md:p-8 lg:p-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-neutral-100 mb-2">System Settings</h1>
          <p className="text-neutral-500 text-sm">Manage workspace configuration, identity providers, and authentication methods.</p>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div className={`max-w-2xl mb-6 p-3.5 rounded-lg border flex items-start gap-2.5 text-sm ${
          notification.type === 'success'
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
            : notification.type === 'info'
            ? 'bg-blue-950/20 border-blue-800/40 text-blue-300'
            : 'bg-red-950/20 border-red-800/40 text-red-300'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : notification.type === 'info' ? (
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
          )}
          <div className="flex-1 min-w-0">{notification.text}</div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Workspace Configuration */}
      <div className="max-w-2xl bg-[#111111] p-6 rounded-lg border border-[#1a1a1a] space-y-6 mb-8">
        <div>
          <label className="block text-xs uppercase tracking-widest text-neutral-500 font-mono mb-2">Workspace Name</label>
          <input
            type="text"
            className="w-full bg-[#161616] border border-[#222] rounded-md px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-neutral-500 transition-colors"
            defaultValue="Biranchi Operator Workspace"
          />
        </div>
      </div>

      {/* Security & Authentication */}
      <div className="max-w-2xl bg-[#111111] p-6 rounded-lg border border-[#1a1a1a] space-y-8">
        <div>
          <h2 className="text-xl font-medium text-neutral-200 mb-6">Security & Passkeys</h2>

          {/* Passkeys Section */}
          <div className="border border-[#222] rounded-lg overflow-hidden bg-[#141414]">
            <div className="p-4 sm:p-5 border-b border-[#222] bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-800/80 rounded-lg text-neutral-300 shrink-0">
                  <Fingerprint className="w-5 h-5 text-[#ff7700]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-100">Passkeys (FIDO2 / WebAuthn)</p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCustomPasskeyName('');
                    setIsAddModalOpen(true);
                  }}
                  disabled={registeringState !== 'idle' || webAuthnSupported === false}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#ff7700] hover:bg-[#e66a00] text-black text-xs font-semibold rounded-md transition-colors disabled:opacity-50 shadow-sm"
                >
                  {registeringState !== 'idle' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {registeringState === 'options' ? 'Preparing...' :
                         registeringState === 'device' ? 'Waiting for device...' : 'Verifying...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Passkey</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Browser Support Warning if applicable */}
            {webAuthnSupported === false && (
              <div className="p-4 bg-yellow-950/20 border-b border-yellow-900/30 text-yellow-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>Your current browser does not support the WebAuthn standard. Please use a modern browser to register passkeys.</span>
              </div>
            )}

            {/* Active Passkeys List */}
            <div className="divide-y divide-[#1e1e1e]">
              {passkeysLoading ? (
                <div className="p-8 text-center text-xs text-neutral-500 font-mono flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  <span>Loading registered passkeys...</span>
                </div>
              ) : passkeys.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center mx-auto mb-3 text-neutral-500">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-neutral-300">No passkeys registered</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Add a passkey to sign in password-free using Touch ID, Face ID, Windows Hello, or a security key.
                  </p>
                </div>
              ) : (
                passkeys.map((passkey) => (
                  <div key={passkey.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#181818] transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2 bg-[#202020] rounded-md border border-[#2a2a2a] shrink-0">
                        {getDeviceIcon(passkey.deviceType, passkey.transports)}
                      </div>
                      <div className="min-w-0">
                        {editingPasskeyId === passkey.id ? (
                          <div className="flex items-center gap-2 my-0.5">
                            <input
                              type="text"
                              value={editingPasskeyName}
                              onChange={(e) => setEditingPasskeyName(e.target.value)}
                              maxLength={50}
                              autoFocus
                              className="bg-[#202020] border border-[#3a3a3a] rounded px-2 py-1 text-xs text-neutral-100 outline-none focus:border-[#ff7700]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRename(passkey.id)}
                              disabled={actionLoading}
                              className="text-emerald-400 hover:text-emerald-300 p-1"
                              title="Save name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPasskeyId(null)}
                              className="text-neutral-500 hover:text-neutral-300 p-1"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-200 truncate">{passkey.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPasskeyId(passkey.id);
                                setEditingPasskeyName(passkey.name);
                              }}
                              className="text-neutral-500 hover:text-neutral-300 transition-colors"
                              title="Rename passkey"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono mt-0.5">
                          <span>Added {new Date(passkey.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{passkey.backedUp || passkey.deviceType === 'multiDevice' ? 'Synced passkey' : 'Device-bound key'}</span>
                          {passkey.lastUsedAt && (
                            <>
                              <span>•</span>
                              <span>Used {new Date(passkey.lastUsedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDelete(passkey.id, passkey.name)}
                        disabled={actionLoading}
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors"
                        title="Remove passkey"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Passkey Modal */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="bg-[#181818] border border-[#2e2e2e] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#ff7700]" />
                    <h3 className="text-base font-medium text-neutral-100">Add New Passkey</h3>
                  </div>
                  <button
                    onClick={() => {
                      if (registeringState === 'idle') setIsAddModalOpen(false);
                    }}
                    disabled={registeringState !== 'idle'}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 text-xs text-neutral-400">
                  <p>
                    Passkeys replace passwords with cryptographic keys stored safely in your device&apos;s hardware or password manager (iCloud Keychain, Google Password Manager, 1Password, YubiKey).
                  </p>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5">
                      Passkey Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPasskeyName}
                      onChange={(e) => setCustomPasskeyName(e.target.value)}
                      placeholder="e.g. MacBook Pro Touch ID, iPhone, YubiKey"
                      disabled={registeringState !== 'idle'}
                      maxLength={50}
                      className="w-full bg-[#121212] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-neutral-200 outline-none focus:border-[#ff7700] transition-colors"
                    />
                  </div>

                  {registeringState !== 'idle' && (
                    <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center gap-3 text-neutral-300">
                      <Loader2 className="w-4 h-4 animate-spin text-[#ff7700] shrink-0" />
                      <span>
                        {registeringState === 'options' && 'Generating cryptographic challenge...'}
                        {registeringState === 'device' && 'Please follow the prompt on your device or browser...'}
                        {registeringState === 'verifying' && 'Verifying and securing passkey on server...'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={registeringState !== 'idle'}
                    className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={registeringState !== 'idle'}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#ff7700] hover:bg-[#e66a00] text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {registeringState !== 'idle' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Continue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OAuth Identity Providers Section */}
          <div className="mt-8 pt-6 border-t border-[#1e1e1e] space-y-4">
            <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider font-mono text-xs">
              Linked Accounts
            </h3>

            {/* GitHub */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#161616] border border-[#222] rounded-md gap-4">
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

            {/* Google */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#161616] border border-[#222] rounded-md gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
