import React, { useState } from 'react';
import {
  X,
  Cloud,
  ShieldCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  Check,
  ExternalLink,
  Activity,
  AlertCircle,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { verifyCloudDatabaseStatus } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  entriesCount: number;
  onSyncLocalEntriesToCloud: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  entriesCount,
  onSyncLocalEntriesToCloud,
}) => {
  const { user, signInWithGoogle, signInGuest, logOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Diagnostic state
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Google sign in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      await signInGuest();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Guest sign in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setErrorMsg(null);
      await onSyncLocalEntriesToCloud();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sync entries to cloud.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagResult(null);
    const result = await verifyCloudDatabaseStatus(user?.uid);
    setIsDiagnosing(false);
    setDiagResult(result);
  };

  const firestoreConsoleUrl = user
    ? `https://console.firebase.google.com/project/journal-5d763/firestore/databases/-default-/data/users~2F${user.uid}~2Fentries`
    : `https://console.firebase.google.com/project/journal-5d763/firestore`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-stone-700" />
            <h2 className="text-sm font-serif-diary font-semibold text-stone-900">
              Cloud Database & Sync Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Project status badge */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/70 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold">Firebase Project: journal-5d763</span>
                <p className="text-[11px] text-emerald-700">Database: (default)</p>
              </div>
            </div>
            <a
              href="https://console.firebase.google.com/project/journal-5d763/firestore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-emerald-800 hover:underline flex items-center gap-1 bg-white/90 px-2 py-1 rounded border border-emerald-200"
            >
              <span>Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Diagnostic Result Banner */}
          {diagResult && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                diagResult.ok
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {diagResult.ok ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{diagResult.ok ? 'Connection Verified' : 'Database Notice'}</span>
              </div>
              <p className="text-[11px] leading-relaxed">{diagResult.message}</p>
            </div>
          )}

          {user ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-stone-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-semibold">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="truncate flex-1">
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {user.displayName || (user.isAnonymous ? 'Guest Writer' : 'Authenticated Writer')}
                  </p>
                  <p className="text-xs text-stone-500 truncate">
                    {user.email || `UID: ${user.uid.slice(0, 8)}...`}
                  </p>
                </div>
              </div>

              {/* Exact Cloud Firestore Path */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs space-y-1">
                <span className="text-[11px] text-stone-400 font-medium">Your Private Cloud Path:</span>
                <p className="font-mono text-[11px] text-stone-700 break-all select-all bg-white p-1.5 rounded border border-stone-200">
                  users/{user.uid}/entries
                </p>
              </div>

              {/* Primary Action 1: Upload All Entries to Firestore */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-70"
              >
                {syncDone ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>All {entriesCount} entries uploaded to Firestore!</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>{isSyncing ? 'Uploading entries...' : `Upload All ${entriesCount} Entries to Cloud Now`}</span>
                  </>
                )}
              </button>

              {/* Secondary Action 2: Direct link to Firestore Console Collection */}
              <a
                href={firestoreConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View My Entries in Firebase Console</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>

              {/* Action 3: Diagnostic test */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRunDiagnostic}
                  disabled={isDiagnosing}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
                >
                  <Activity className={`w-3 h-3 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'Checking connection...' : 'Test Database Write Health'}</span>
                </button>

                {/* Sign out */}
                <button
                  onClick={async () => {
                    await logOut();
                    onClose();
                  }}
                  className="text-xs font-medium text-stone-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged out state */
            <div className="space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Log in with your Google account to sync your private diary entries and Gemini reflections directly to your Cloud Firestore database (
                <span className="font-mono text-stone-800">journal-5d763</span>).
              </p>

              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSigningIn ? 'Connecting...' : 'Sign In with Google'}</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-2 text-[11px] text-stone-400 absolute">or</span>
              </div>

              <button
                onClick={handleGuestLogin}
                disabled={isSigningIn}
                className="w-full py-2 px-4 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Continue as Guest Writer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
