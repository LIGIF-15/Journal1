import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  BookOpen,
  Feather,
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onBypassToGuest?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBypassToGuest }) => {
  const { signInWithGoogle, signInGuest, isFirebaseConnected } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setIsUnauthorizedDomain(false);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        setIsUnauthorizedDomain(true);
        setErrorMsg('Domain not authorized in Firebase Console.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in window was closed. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setErrorMsg(err?.message || 'Failed to authenticate with Google. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await signInGuest();
    } catch (err: any) {
      console.error('Guest Sign In Error:', err);
      if (onBypassToGuest) {
        onBypassToGuest();
      } else {
        setErrorMsg('Guest sign in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyDomain = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col justify-between font-sans-ui selection:bg-stone-200">
      {/* Top minimal header */}
      <header className="px-6 sm:px-12 py-5 flex items-center justify-between border-b border-stone-200/60 bg-white/60 backdrop-blur-xs">
        <span className="text-2xl font-serif-diary font-bold tracking-tight text-stone-900">
          Komorebi
        </span>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Firebase Vault · journal-5d763</span>
        </div>
      </header>

      {/* Main Login Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-5xl items-center">
          
          {/* Left Column: Visual Mood & Sample Reflection */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block">
            <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-sm group">
              <img
                src="/src/assets/images/journal_desk_morning_1791015487637.jpg"
                alt="Mindful journal desk bathed in morning sunlight"
                referrerPolicy="no-referrer"
                className="w-full h-80 object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs uppercase tracking-wider text-amber-200/90 font-medium flex items-center gap-1.5 mb-1">
                  <Feather className="w-3.5 h-3.5" />
                  <span>Attuned Gemini Reflection</span>
                </span>
                <p className="font-serif-diary italic text-base leading-relaxed text-stone-100">
                  "There is a quiet mercy in how the steam of warm tea can call your breath back before the world asks for your voice."
                </p>
                <p className="text-[11px] text-stone-400 mt-2 font-mono">
                  Personalized to your concrete daily moments
                </p>
              </div>
            </div>

            {/* Quiet Features List */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1">
                <Lock className="w-4 h-4 text-stone-700" />
                <h4 className="text-xs font-semibold text-stone-900">Private Vault</h4>
                <p className="text-[11px] text-stone-500 leading-tight">Only you have access to your personal thoughts.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold text-stone-900">Poetic Echoes</h4>
                <p className="text-[11px] text-stone-500 leading-tight">Two-line responses grounded in your exact words.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1">
                <BookOpen className="w-4 h-4 text-stone-700" />
                <h4 className="text-xs font-semibold text-stone-900">Always Synced</h4>
                <p className="text-[11px] text-stone-500 leading-tight">Real-time sync to your Google Firestore account.</p>
              </div>
            </div>
          </div>

          {/* Right Column: The Sign In Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-10 shadow-sm space-y-6">
              
              {/* Header Title */}
              <div className="space-y-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-stone-400">
                  Welcome to your journal
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif-diary font-bold text-stone-900 tracking-tight leading-snug">
                  Unlock your entries & reflections
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Sign in with your Google account to access your diary entries, browse past reflections, and continue writing in peace.
                </p>
              </div>

              {/* Actionable Solution Box for auth/unauthorized-domain */}
              {isUnauthorizedDomain && (
                <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl text-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Authorize this domain in Firebase</span>
                  </div>
                  
                  <p className="text-amber-800 leading-relaxed">
                    Firebase requires registering this app's domain under Authorized Domains in the Firebase Console:
                  </p>

                  <div className="flex items-center gap-2 bg-white/90 border border-amber-200 rounded-lg p-2 font-mono text-[11px] text-stone-800 break-all">
                    <span className="truncate flex-1">{currentHostname}</span>
                    <button
                      type="button"
                      onClick={copyDomain}
                      className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded font-sans text-[10px] shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 text-stone-600 text-[11px] pt-1">
                    <p className="font-semibold text-stone-800">Quick Steps to Fix:</p>
                    <ol className="list-decimal list-inside space-y-1 text-stone-700">
                      <li>Open Firebase Console Settings</li>
                      <li>Scroll to <strong>Authorized domains</strong> & click <strong>Add domain</strong></li>
                      <li>Paste <code className="bg-amber-100/80 px-1 rounded font-mono">{currentHostname}</code> and save</li>
                    </ol>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-amber-200/60">
                    <a
                      href="https://console.firebase.google.com/project/journal-5d763/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-900 hover:text-amber-950 font-semibold underline underline-offset-2 flex items-center gap-1 text-[11px]"
                    >
                      <span>Open Firebase Console Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="text-[11px] font-semibold text-stone-800 hover:underline"
                    >
                      Retry Sign-In
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Error feedback (if not unauthorized domain) */}
              {errorMsg && !isUnauthorizedDomain && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-in fade-in">
                  {errorMsg}
                </div>
              )}

              {/* Google Sign In Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-3 font-medium text-sm cursor-pointer group disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin" />
                  ) : (
                    <>
                      {/* Official Google SVG Emblem */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Subtle Divider */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-stone-200 w-full" />
                  <span className="bg-white px-3 text-[11px] text-stone-400 absolute">or</span>
                </div>

                {/* Guest access option */}
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Explore as Guest / Offline Preview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Trust & Privacy Notice */}
              <div className="pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
                <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Isolated Firebase Security Rules enforced</span>
                </div>
                <p className="leading-relaxed">
                  Your Google credentials authenticate your user identity securely. We only store your entries and AI reflections in your private collection.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-12 py-4 border-t border-stone-200/60 bg-white/40 text-center text-xs text-stone-400">
        <p>Komorebi — Mindful Digital Diary & Attuned Gemini Reflections</p>
      </footer>
    </div>
  );
};
