import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { DiaryEntryForm } from './components/DiaryEntryForm';
import { EntriesTimeline } from './components/EntriesTimeline';
import { EntryDetailModal } from './components/EntryDetailModal';
import { FocusEditorModal } from './components/FocusEditorModal';
import { PromptsView } from './components/PromptsView';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { DiaryEntry, WritingPrompt } from './types/diary';
import { INITIAL_ENTRIES, MOODS } from './data/seedEntries';
import { soundEngine } from './utils/audioAmbiance';
import { generateEntryReflection } from './utils/geminiReflection';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  saveEntryToFirestore,
  deleteEntryFromFirestore,
  subscribeToUserEntries,
  syncUserProfile,
} from './lib/firebase';
import {
  Sparkles,
  Calendar,
  BookOpen,
  Flame,
  PenTool,
  CheckCircle2,
  Cloud,
  ShieldCheck,
  Lock,
  LogIn,
  RefreshCw,
  UploadCloud,
  ExternalLink,
} from 'lucide-react';

function DiaryApp() {
  const { user, loading, logOut, isFirebaseConnected, signInWithGoogle } = useAuth();
  const [guestBypass, setGuestBypass] = useState(false);

  // User-scoped entries state
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isSyncingWithCloud, setIsSyncingWithCloud] = useState(false);

  const [activeView, setActiveView] = useState<'write' | 'timeline' | 'prompts'>('write');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [inspectingEntry, setInspectingEntry] = useState<DiaryEntry | null>(null);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Strictly isolate data per authenticated Google user
  useEffect(() => {
    if (!user) {
      if (guestBypass) {
        // Load guest entries from guest-only cache or sample entries
        try {
          const guestSaved = localStorage.getItem('komorebi_diary_guest_entries');
          setEntries(guestSaved ? JSON.parse(guestSaved) : INITIAL_ENTRIES);
        } catch {
          setEntries(INITIAL_ENTRIES);
        }
      } else {
        // Wipe in-memory entries when logged out to prevent data leakage between users
        setEntries([]);
      }
      return;
    }

    // Authenticated user: Sync user profile document so it is immediately visible in Firebase Console
    syncUserProfile(user);

    // Load this user's specific local cache first
    const cacheKey = `komorebi_diary_entries_${user.uid}`;
    try {
      const userSaved = localStorage.getItem(cacheKey);
      if (userSaved) {
        setEntries(JSON.parse(userSaved));
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }

    setIsSyncingWithCloud(true);

    // Subscribe ONLY to this authenticated user's private Firestore collection: users/{userId}/entries
    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (cloudEntries) => {
        if (cloudEntries.length > 0) {
          setEntries(cloudEntries);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(cloudEntries));
          } catch (e) {
            console.warn('Cache storage warning:', e);
          }
        } else {
          // Cloud collection is currently empty
          // Check if local cache has entries from previous un-synced session (e.g. before rules deployment)
          try {
            const cached = localStorage.getItem(cacheKey);
            const parsed = cached ? JSON.parse(cached) : [];
            if (parsed.length > 0) {
              setEntries(parsed);
              // Auto-sync existing local entries to Firestore now that rules are active!
              for (const item of parsed) {
                saveEntryToFirestore(user.uid, item).catch(console.warn);
              }
            } else {
              setEntries([]);
            }
          } catch {
            setEntries([]);
          }
        }
        setIsSyncingWithCloud(false);
      },
      (error) => {
        console.warn('Firestore subscription fallback:', error);
        setIsSyncingWithCloud(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, guestBypass]);

  // Sync to local storage for the active session
  useEffect(() => {
    if (!user && guestBypass) {
      try {
        localStorage.setItem('komorebi_diary_guest_entries', JSON.stringify(entries));
      } catch (err) {
        console.error('Failed to save guest entries', err);
      }
    } else if (user) {
      try {
        localStorage.setItem(`komorebi_diary_entries_${user.uid}`, JSON.stringify(entries));
      } catch (err) {
        console.error('Failed to save user entries', err);
      }
    }
  }, [entries, user, guestBypass]);

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

  // Lock journal and sign out
  const handleLockJournal = async () => {
    if (user) {
      await logOut();
    }
    setGuestBypass(false);
    setEntries([]); // Clear memory immediately on logout
    showToast('Journal locked. Log in to access your entries.');
  };

  // Save or update entry along with its Gemini response
  const handleSaveEntry = async (entryData: Omit<DiaryEntry, 'id' | 'updatedAt'>) => {
    let finalReflection = entryData.reflection;

    // Generate attuned Gemini reflection if not yet created
    if (!finalReflection && (entryData.content.trim().length > 8 || entryData.title.trim().length > 4)) {
      try {
        const generated = await generateEntryReflection({
          title: entryData.title,
          content: entryData.content,
          mood: entryData.mood,
          date: entryData.date,
          location: entryData.location,
          weather: entryData.weather,
          tags: entryData.tags,
        });
        if (generated) {
          finalReflection = generated;
        }
      } catch (err) {
        console.warn('Could not generate reflection during save:', err);
      }
    }

    const entryId = editingEntry?.id || `entry-${Date.now()}`;
    const updatedEntry: DiaryEntry = {
      ...(editingEntry || {}),
      ...entryData,
      id: entryId,
      userId: user?.uid || 'guest',
      reflection: finalReflection,
      updatedAt: new Date().toISOString(),
    };

    if (editingEntry) {
      // Updating local state
      setEntries((prev) => prev.map((item) => (item.id === editingEntry.id ? updatedEntry : item)));
      setEditingEntry(null);

      // Save to Firebase Cloud Firestore for this user
      if (user) {
        try {
          await saveEntryToFirestore(user.uid, updatedEntry);
          showToast('Diary entry & reflection updated in Cloud Firestore!');
        } catch (err) {
          console.error('Failed to sync updated entry to Firestore:', err);
          showToast('Updated locally (Cloud sync failed)');
        }
      } else {
        showToast('Diary entry & reflection updated in session');
      }
    } else {
      // New entry: add to local state
      setEntries((prev) => [updatedEntry, ...prev]);

      // Save to Firebase Cloud Firestore for this user
      if (user) {
        try {
          await saveEntryToFirestore(user.uid, updatedEntry);
          showToast('Entry & response saved to Cloud Firestore!');
        } catch (err) {
          console.error('Failed to sync new entry to Firestore:', err);
          showToast('Saved locally (Cloud sync pending)');
        }
      } else {
        showToast('Entry & response saved in guest session');
      }
    }
  };

  // Delete entry from local state and Firebase
  const handleDeleteEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingEntry?.id === id) {
      setEditingEntry(null);
    }
    if (inspectingEntry?.id === id) {
      setInspectingEntry(null);
    }

    if (user) {
      try {
        await deleteEntryFromFirestore(user.uid, id);
      } catch (err) {
        console.warn('Failed to delete entry from Firestore:', err);
      }
    }

    showToast('Entry deleted from your diary');
  };

  // Toggle favorite in local state and Firebase
  const handleToggleFavorite = async (id: string) => {
    const targetEntry = entries.find((e) => e.id === id);
    if (!targetEntry) return;

    const updatedEntry: DiaryEntry = { ...targetEntry, isFavorite: !targetEntry.isFavorite };

    setEntries((prev) => prev.map((e) => (e.id === id ? updatedEntry : e)));
    if (inspectingEntry?.id === id) {
      setInspectingEntry(updatedEntry);
    }

    if (user) {
      try {
        await saveEntryToFirestore(user.uid, updatedEntry);
      } catch (err) {
        console.warn('Failed to sync favorite status to Firestore:', err);
      }
    }
  };

  // Update reflection for an entry in local state and Firebase
  const handleUpdateEntryReflection = async (id: string, reflection: string) => {
    const targetEntry = entries.find((e) => e.id === id);
    if (!targetEntry) return;

    const updatedEntry: DiaryEntry = { ...targetEntry, reflection };

    setEntries((prev) => prev.map((e) => (e.id === id ? updatedEntry : e)));
    if (inspectingEntry?.id === id) {
      setInspectingEntry(updatedEntry);
    }

    if (user) {
      try {
        await saveEntryToFirestore(user.uid, updatedEntry);
      } catch (err) {
        console.warn('Failed to sync reflection to Firestore:', err);
      }
    }

    showToast('New response saved to your Firebase vault');
  };

  // Backup/Sync current entries into Firebase
  const handleSyncLocalEntriesToCloud = async () => {
    if (!user) return;
    for (const entry of entries) {
      await saveEntryToFirestore(user.uid, {
        ...entry,
        userId: user.uid,
      });
    }
    showToast(`${entries.length} entries & responses synced to your Firebase account!`);
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

  // Initial loading pulse
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center space-y-3 font-sans-ui">
        <span className="text-3xl font-serif-diary font-bold text-stone-900 tracking-tight animate-pulse">
          Komorebi
        </span>
        <p className="text-xs text-stone-500 font-medium">Opening your private journal...</p>
      </div>
    );
  }

  // If not logged in and not bypassing as guest, render the dedicated Log-in Screen
  if (!user && !guestBypass) {
    return <LoginScreen onBypassToGuest={() => setGuestBypass(true)} />;
  }

  // Writing metrics for the active user
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
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLockJournal={handleLockJournal}
      />

      {/* Guest Mode Notice Banner (if in guest bypass mode) */}
      {!user && guestBypass && (
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>You are viewing in guest mode. Sign in with Google so your entries and responses are saved to your private Firebase account.</span>
            </span>
            <button
              onClick={() => signInWithGoogle()}
              className="font-semibold underline underline-offset-2 hover:text-amber-950 flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-600 uppercase tracking-wider">
                    Mindful Digital Journal
                  </span>
                  <span className="text-stone-300">·</span>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-200/90 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={user ? `Authenticated as ${user.email}. Private collection: users/${user.uid}/entries` : 'Firebase: journal-5d763'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {user
                        ? `Cloud: users/${user.uid.slice(0, 6)}.../entries`
                        : 'Firebase: journal-5d763'}
                    </span>
                  </button>

                  {user && entries.length > 0 && (
                    <button
                      onClick={handleSyncLocalEntriesToCloud}
                      className="text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 px-2 py-0.5 rounded border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Upload and sync all entries to Cloud Firestore"
                    >
                      <UploadCloud className="w-3 h-3 text-stone-500" />
                      <span>Sync All to Cloud</span>
                    </button>
                  )}

                  {isSyncingWithCloud && (
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-stone-400" />
                      <span>Syncing...</span>
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif-diary font-bold text-stone-900 tracking-tight mt-0.5">
                  Today's Journal Entry
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  A private sanctuary to record your reflections, gratitude, and quiet milestones.
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
                  <span className="flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-stone-500" />
                    {user
                      ? `Entries & responses saved to your Google account (${user.email})`
                      : 'Saved locally · Log in with Google to sync across devices'}
                  </span>
                  <button
                    onClick={() => setActiveView('prompts')}
                    className="hover:text-stone-900 underline underline-offset-2 transition-colors cursor-pointer"
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
                  Your Past Journal Entries & Echoes
                </h1>
                <p className="text-xs text-stone-500">
                  {user
                    ? `Private entries and Gemini reflections for ${user.displayName || user.email}`
                    : 'Read through your personal chronicle across the seasons.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingEntry(null);
                  setActiveView('write');
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
        onUpdateEntryReflection={handleUpdateEntryReflection}
      />

      {/* Full-Screen Focus Mode Overlay */}
      <FocusEditorModal
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        onSave={handleSaveEntry}
      />

      {/* Firebase Cloud Sync & Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        entriesCount={entries.length}
        onSyncLocalEntriesToCloud={handleSyncLocalEntriesToCloud}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DiaryApp />
    </AuthProvider>
  );
}
