import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { DiaryEntryForm } from './components/DiaryEntryForm';
import { EntriesTimeline } from './components/EntriesTimeline';
import { EntryDetailModal } from './components/EntryDetailModal';
import { FocusEditorModal } from './components/FocusEditorModal';
import { PromptsView } from './components/PromptsView';
import { DiaryEntry, WritingPrompt } from './types/diary';
import { INITIAL_ENTRIES, MOODS } from './data/seedEntries';
import { soundEngine } from './utils/audioAmbiance';
import { Sparkles, Calendar, BookOpen, Flame, PenTool, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Load entries from localStorage or fallback to INITIAL_ENTRIES
  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('komorebi_diary_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_ENTRIES;
  });

  const [activeView, setActiveView] = useState<'write' | 'timeline' | 'prompts'>('write');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [inspectingEntry, setInspectingEntry] = useState<DiaryEntry | null>(null);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('komorebi_diary_entries', JSON.stringify(entries));
    } catch (err) {
      console.error('Failed to save entries to localStorage', err);
    }
  }, [entries]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Toggle ambient sound
  const handleToggleSound = () => {
    const isNowPlaying = soundEngine.toggle();
    setIsSoundPlaying(isNowPlaying);
    if (isNowPlaying) {
      showToast('Calming rain soundscape enabled');
    }
  };

  // Save or update entry
  const handleSaveEntry = (entryData: Omit<DiaryEntry, 'id' | 'updatedAt'>) => {
    if (editingEntry) {
      // Updating existing entry
      const updatedEntries = entries.map((item) =>
        item.id === editingEntry.id
          ? {
              ...item,
              ...entryData,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      setEntries(updatedEntries);
      setEditingEntry(null);
      showToast('Diary entry updated successfully');
    } else {
      // New entry
      const newEntry: DiaryEntry = {
        ...entryData,
        id: `entry-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      setEntries([newEntry, ...entries]);
      showToast('Your new diary entry was saved');
    }
  };

  // Delete entry
  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
    if (inspectingEntry?.id === id) {
      setInspectingEntry(null);
    }
    showToast('Entry removed from diary');
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isFavorite: !e.isFavorite } : e))
    );
    if (inspectingEntry?.id === id) {
      setInspectingEntry((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Select prompt from PromptsView to start writing
  const handleSelectPrompt = (prompt: WritingPrompt) => {
    setEditingEntry({
      id: '',
      title: `Reflection on: ${prompt.category}`,
      content: `> *${prompt.text}*\n\n`,
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      location: 'Quiet space',
      weather: 'Serene atmosphere',
      mood: 'reflective',
      tags: ['Prompt', prompt.category],
      wordCount: 0,
      readingMinutes: 1,
      updatedAt: new Date().toISOString(),
    });
    setActiveView('write');
  };

  // Writing metrics
  const totalWords = entries.reduce((acc, e) => acc + (e.wordCount || 0), 0);
  const favoriteCount = entries.filter((e) => e.isFavorite).length;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col font-sans-ui selection:bg-stone-200">
      {/* Top Bar */}
      <TopBar
        activeView={activeView}
        setActiveView={setActiveView}
        entriesCount={entries.length}
        isSoundPlaying={isSoundPlaying}
        onToggleSound={handleToggleSound}
        onEnterFocusMode={() => setIsFocusModeOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Toast feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View 1: Primary Diary Entry Screen */}
        {activeView === 'write' && (
          <div className="space-y-6">
            {/* Gentle Hero Kicker */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-stone-200/60">
              <div>
                <span className="text-xs font-medium text-stone-600 uppercase tracking-wider">
                  Mindful Digital Journal
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif-diary font-bold text-stone-900 tracking-tight mt-0.5">
                  Today's Journal Entry
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  A sanctuary to record your reflections, gratitude, and quiet milestones.
                </p>
              </div>

              {/* Minimal stats row (clean unboxed text per Zero-Pill discipline) */}
              <div className="flex items-center gap-3 text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>5-day writing streak</span>
                </span>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{totalWords.toLocaleString()} words logged</span>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span>{favoriteCount} favorited</span>
              </div>
            </div>

            {/* Two-Column Grid: Left is the Input Section & Submit Button, Right is the Companion Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Main Input Section & Submit Button (8 cols on desktop) */}
              <div className="lg:col-span-8 space-y-4">
                <DiaryEntryForm
                  onSaveEntry={handleSaveEntry}
                  editingEntry={editingEntry}
                  onCancelEdit={() => setEditingEntry(null)}
                  onOpenFocusMode={() => setIsFocusModeOpen(true)}
                />

                {/* Helpful shortcut & privacy footer note */}
                <div className="px-2 flex items-center justify-between text-[11px] text-stone-600">
                  <span>
                    Your entries are privately stored in your browser's local memory.
                  </span>
                  <button
                    onClick={() => setActiveView('prompts')}
                    className="hover:text-stone-900 underline underline-offset-2 transition-colors"
                  >
                    Need a writing spark? View all prompts →
                  </button>
                </div>
              </div>

              {/* Companion Sidebar: Recent Entries Timeline (4 cols on desktop) */}
              <div className="lg:col-span-4 space-y-6">
                <EntriesTimeline
                  entries={entries}
                  onSelectEntry={(entry) => setInspectingEntry(entry)}
                  onEditEntry={(entry) => {
                    setEditingEntry(entry);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDeleteEntry={handleDeleteEntry}
                  onToggleFavorite={handleToggleFavorite}
                  activeEntryId={editingEntry?.id}
                />

                {/* Daily Mindful Writing Ritual Card */}
                <div className="p-4 rounded-xl border border-stone-200/80 bg-white/70 space-y-2 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                    <PenTool className="w-3.5 h-3.5 text-stone-500" />
                    <span>The 3-Minute Journal Practice</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    1. Write 1 thing that grounded you today.<br />
                    2. Note 1 thought to let go of.<br />
                    3. Capture 1 phrase to remember tomorrow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Full Past Entries Timeline */}
        {activeView === 'timeline' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
              <div>
                <h1 className="text-2xl font-serif-diary font-bold text-stone-900">
                  All Past Journal Entries
                </h1>
                <p className="text-xs text-stone-500">
                  Read through your personal chronicle across the seasons.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingEntry(null);
                  setActiveView('write');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                + Write New Entry
              </button>
            </div>

            <EntriesTimeline
              entries={entries}
              onSelectEntry={(entry) => setInspectingEntry(entry)}
              onEditEntry={(entry) => {
                setEditingEntry(entry);
                setActiveView('write');
              }}
              onDeleteEntry={handleDeleteEntry}
              onToggleFavorite={handleToggleFavorite}
              activeEntryId={editingEntry?.id}
            />
          </div>
        )}

        {/* View 3: Mindful Writing Prompts */}
        {activeView === 'prompts' && (
          <PromptsView onSelectPrompt={handleSelectPrompt} />
        )}
      </main>

      {/* Entry Reader / Detail Modal */}
      <EntryDetailModal
        entry={inspectingEntry}
        onClose={() => setInspectingEntry(null)}
        onEdit={(entry) => {
          setEditingEntry(entry);
          setActiveView('write');
        }}
        onDelete={handleDeleteEntry}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Full-Screen Focus Mode Overlay */}
      <FocusEditorModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        onSave={handleSaveEntry}
      />
    </div>
  );
}
