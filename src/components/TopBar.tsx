import React from 'react';
import { Volume2, VolumeX, Maximize2, Sparkles, Cloud, LogOut, User as UserIcon, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  activeView: 'write' | 'timeline' | 'prompts';
  setActiveView: (view: 'write' | 'timeline' | 'prompts') => void;
  entriesCount: number;
  isSoundPlaying: boolean;
  onToggleSound: () => void;
  onEnterFocusMode: () => void;
  onOpenAuthModal: () => void;
  onLockJournal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  entriesCount,
  isSoundPlaying,
  onToggleSound,
  onEnterFocusMode,
  onOpenAuthModal,
  onLockJournal,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#fafaf9]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveView('write')}
          className="text-xl sm:text-2xl font-serif-diary font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors text-left cursor-pointer"
        >
          Komorebi
        </button>

        {/* Zone 2: Clean nav links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveView('write')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md cursor-pointer ${
              activeView === 'write'
                ? 'bg-stone-200/70 text-stone-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            New Entry
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md cursor-pointer ${
              activeView === 'timeline'
                ? 'bg-stone-200/70 text-stone-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Past Entries ({entriesCount})
          </button>
          <button
            onClick={() => setActiveView('prompts')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md hidden md:flex items-center gap-1.5 cursor-pointer ${
              activeView === 'prompts'
                ? 'bg-stone-200/70 text-stone-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-500" />
            Prompts
          </button>
        </nav>

        {/* Zone 3: Primary actions & Cloud Sync */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync & Firebase Status */}
          <button
            onClick={onOpenAuthModal}
            title={user ? `Signed in as ${user.email || 'Google User'}` : 'Connect with Google'}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
                <span className="hidden sm:inline font-medium text-stone-800">
                  {user.displayName?.split(' ')[0] || (user.email ? user.email.split('@')[0] : 'Synced')}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Sign In</span>
              </>
            )}
          </button>

          {/* Calming Soundscape */}
          <button
            onClick={onToggleSound}
            title={isSoundPlaying ? 'Mute ambient rain sound' : 'Play calming ambient rain sound'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isSoundPlaying
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
            }`}
          >
            {isSoundPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span className="hidden sm:inline">Rain Sounding</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Ambiance</span>
              </>
            )}
          </button>

          {/* Focus Mode */}
          <button
            onClick={onEnterFocusMode}
            title="Distraction-free Focus Writing Mode"
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Focus Mode</span>
          </button>

          {/* Lock Journal / Sign Out */}
          <button
            onClick={onLockJournal}
            title={user ? 'Lock journal & Sign out' : 'Lock journal & return to Log-In'}
            className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
