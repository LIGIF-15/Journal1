import React from 'react';
import { Volume2, VolumeX, Maximize2, Sparkles, BookOpen } from 'lucide-react';

interface TopBarProps {
  activeView: 'write' | 'timeline' | 'prompts';
  setActiveView: (view: 'write' | 'timeline' | 'prompts') => void;
  entriesCount: number;
  isSoundPlaying: boolean;
  onToggleSound: () => void;
  onEnterFocusMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  setActiveView,
  entriesCount,
  isSoundPlaying,
  onToggleSound,
  onEnterFocusMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#fafaf9]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveView('write')}
          className="text-xl sm:text-2xl font-serif-diary font-semibold tracking-tight text-stone-900 hover:text-stone-700 transition-colors text-left"
        >
          Komorebi
        </button>

        {/* Zone 2: Clean nav links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveView('write')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeView === 'write'
                ? 'bg-stone-200/70 text-stone-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            New Entry
          </button>
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeView === 'timeline'
                ? 'bg-stone-200/70 text-stone-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Past Entries ({entriesCount})
          </button>
          <button
            onClick={() => setActiveView('prompts')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md hidden md:flex items-center gap-1.5 ${
              activeView === 'prompts'
                ? 'bg-stone-200/70 text-stone-900 font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-500" />
            Prompts
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            title={isSoundPlaying ? 'Mute ambient rain sound' : 'Play calming ambient rain sound'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
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

          <button
            onClick={onEnterFocusMode}
            title="Distraction-free Focus Writing Mode"
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>
    </header>
  );
};
