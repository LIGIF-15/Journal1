import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CloudSun,
  Image as ImageIcon,
  Sparkles,
  Bold,
  Italic,
  Heading2,
  Quote,
  List,
  Minus,
  Check,
  RotateCcw,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Trash2,
  Smile,
  RefreshCw,
  Feather,
} from 'lucide-react';
import { DiaryEntry, MoodType, WritingPrompt } from '../types/diary';
import { MOODS, INITIAL_PROMPTS } from '../data/seedEntries';
import { generateEntryReflection } from '../utils/geminiReflection';

interface DiaryEntryFormProps {
  onSaveEntry: (entry: Omit<DiaryEntry, 'id' | 'updatedAt'>) => void;
  editingEntry?: DiaryEntry | null;
  onCancelEdit?: () => void;
  onOpenFocusMode?: () => void;
}

export const DiaryEntryForm: React.FC<DiaryEntryFormProps> = ({
  onSaveEntry,
  editingEntry,
  onCancelEdit,
  onOpenFocusMode,
}) => {
  // State for form fields
  const [title, setTitle] = useState(editingEntry?.title || '');
  const [content, setContent] = useState(editingEntry?.content || '');
  const [mood, setMood] = useState<MoodType>(editingEntry?.mood || 'peaceful');
  const [tags, setTags] = useState<string[]>(editingEntry?.tags || ['Reflection']);
  const [newTagInput, setNewTagInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(editingEntry?.photoUrl);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isPrivate, setIsPrivate] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [reflection, setReflection] = useState<string | undefined>(editingEntry?.reflection);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);

  // Date & Time states
  const [entryDate, setEntryDate] = useState(() => {
    const d = editingEntry ? new Date(editingEntry.date) : new Date();
    return d.toISOString().split('T')[0];
  });
  const [entryTime, setEntryTime] = useState(() => {
    const d = editingEntry ? new Date(editingEntry.date) : new Date();
    return d.toTimeString().slice(0, 5);
  });
  const [location, setLocation] = useState(editingEntry?.location || 'Home Studio');
  const [weather, setWeather] = useState(editingEntry?.weather || 'Warm afternoon light · 21°C');

  // Textarea reference for markdown formatting
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when editing an entry changes
  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title);
      setContent(editingEntry.content);
      setMood(editingEntry.mood);
      setTags(editingEntry.tags);
      setPhotoUrl(editingEntry.photoUrl);
      setReflection(editingEntry.reflection);
      const d = new Date(editingEntry.date);
      setEntryDate(d.toISOString().split('T')[0]);
      setEntryTime(d.toTimeString().slice(0, 5));
      setLocation(editingEntry.location || 'Home Studio');
      setWeather(editingEntry.weather || 'Warm afternoon light · 21°C');
    }
  }, [editingEntry]);

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  // Current prompt
  const activePrompt: WritingPrompt = INITIAL_PROMPTS[currentPromptIndex] || INITIAL_PROMPTS[0];

  const handleNextPrompt = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % INITIAL_PROMPTS.length);
  };

  const handleInsertPrompt = () => {
    const insertText = `> *${activePrompt.text}*\n\n`;
    setContent((prev) => insertText + prev);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Text formatting helpers
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;

    const selectedText = previousContent.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent =
      previousContent.substring(0, start) + replacement + previousContent.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 4)
      );
    }, 0);
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Generate Gemini two-line reflection on demand
  const handleGenerateReflection = async () => {
    if (!content.trim() && !title.trim()) {
      alert('Write a few thoughts first so Gemini has your authentic words to reflect upon.');
      return;
    }

    setIsGeneratingReflection(true);
    const generated = await generateEntryReflection({
      title: title.trim(),
      content: content.trim(),
      mood,
      date: `${entryDate} ${entryTime}`,
      location,
      weather,
      tags,
    });
    setIsGeneratingReflection(false);

    if (generated) {
      setReflection(generated);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!content.trim() && !title.trim()) {
      alert('Please write something in your diary entry before submitting.');
      return;
    }

    setSaveStatus('saving');

    const finalTitle =
      title.trim() ||
      `Journal Note · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const fullIsoDate = new Date(`${entryDate}T${entryTime}:00`).toISOString();

    const displayDateFormatted = new Date(fullIsoDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // If reflection not yet generated, attempt generation with Gemini API
    let finalReflection = reflection;
    if (!finalReflection && (content.trim().length > 10 || title.trim().length > 5)) {
      try {
        const generated = await generateEntryReflection({
          title: finalTitle,
          content,
          mood,
          date: fullIsoDate,
          location,
          weather,
          tags,
        });
        if (generated) {
          finalReflection = generated;
          setReflection(generated);
        }
      } catch (err) {
        console.warn('Could not auto-generate reflection on submit:', err);
      }
    }

    onSaveEntry({
      title: finalTitle,
      content,
      date: fullIsoDate,
      displayDate: displayDateFormatted,
      location,
      weather,
      mood,
      tags,
      photoUrl,
      isFavorite: editingEntry?.isFavorite || false,
      wordCount,
      readingMinutes: readingTime,
      reflection: finalReflection,
    });

    setSaveStatus('saved');

    setTimeout(() => {
      setSaveStatus('idle');
      if (!editingEntry) {
        // Reset form for fresh entry
        setTitle('');
        setContent('');
        setTags(['Reflection']);
        setPhotoUrl(undefined);
        setReflection(undefined);
      }
    }, 1500);
  };

  const presetPhotos = [
    {
      title: 'Morning Desk',
      url: '/src/assets/images/journal_desk_morning_1791015487637.jpg',
      description: 'Linen journal, brass pen, warm sunlight',
    },
    {
      title: 'Rainy Window',
      url: '/src/assets/images/journal_rainy_window_1791015506141.jpg',
      description: 'Water drops, dried flowers, mindful pause',
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden transition-all"
    >
      {/* 1. Header Metadata Kicker */}
      <div className="bg-stone-50/70 border-b border-stone-200/70 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-4">
          {/* Editable Date */}
          <div className="flex items-center gap-1.5 font-medium text-stone-800">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="bg-transparent border-none text-xs font-medium text-stone-800 focus:outline-hidden cursor-pointer"
            />
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">·</span>

          {/* Editable Time */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="bg-transparent border-none text-xs text-stone-600 focus:outline-hidden cursor-pointer"
            />
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">·</span>

          {/* Editable Location */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-400 text-xs text-stone-600 focus:outline-hidden w-28 sm:w-36 transition-colors"
            />
          </div>

          <span className="text-stone-300 hidden md:inline" aria-hidden="true">·</span>

          {/* Editable Weather / Atmosphere */}
          <div className="hidden md:flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="Atmosphere / Weather"
              className="bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-400 text-xs text-stone-600 focus:outline-hidden w-44 transition-colors"
            />
          </div>
        </div>

        {/* Privacy Indicator */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              isPrivate
                ? 'text-stone-600 bg-stone-100 hover:bg-stone-200/80'
                : 'text-stone-400 hover:text-stone-600'
            }`}
            title="Toggle diary entry privacy state"
          >
            <Lock className="w-3 h-3" />
            <span>{isPrivate ? 'Private' : 'Shared'}</span>
          </button>
        </div>
      </div>

      {/* 2. Mood & Tone Selection Bar */}
      <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-stone-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Current Mood
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {MOODS.map((m) => {
            const isSelected = mood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-xs scale-102'
                    : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mindful Writing Prompt Banner */}
      <div className="px-6 py-3 bg-amber-50/40 border-b border-amber-100/60 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-900">
              Daily Inspiration Spark ({activePrompt.category})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNextPrompt}
              className="text-xs text-amber-800 hover:text-amber-950 font-medium underline underline-offset-2 transition-colors"
            >
              Shuffle prompt
            </button>
            <button
              type="button"
              onClick={() => setIsPromptExpanded(!isPromptExpanded)}
              className="text-stone-400 hover:text-stone-700 p-0.5"
              aria-label="Toggle prompt view"
            >
              {isPromptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isPromptExpanded && (
          <div className="mt-2 text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-serif-diary italic text-stone-800">
                "{activePrompt.text}"
              </p>
              {activePrompt.subtext && (
                <p className="text-xs text-stone-500 mt-0.5">{activePrompt.subtext}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleInsertPrompt}
              className="self-start sm:self-center px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Use as prompt in entry
            </button>
          </div>
        )}
      </div>

      {/* 4. The Core Writing Area */}
      <div className="p-6 space-y-4">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of this entry or memory..."
            className="w-full text-2xl sm:text-3xl font-serif-diary font-semibold text-stone-900 placeholder:text-stone-300 border-none outline-none focus:ring-0 bg-transparent px-0"
          />
        </div>

        {/* Formatting Affordance Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1 text-stone-500 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => applyFormatting('**', '**')}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('*', '*')}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('## ')}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Heading (## )"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('> ')}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Quote (> )"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('- ')}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Bullet list (- )"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('\n---\n')}
              className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
              title="Horizontal line"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-stone-200 mx-1" aria-hidden="true" />

            {/* Photo Attachment Toggle */}
            <button
              type="button"
              onClick={() => setIsPhotoPickerOpen(!isPhotoPickerOpen)}
              className={`p-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium ${
                photoUrl || isPhotoPickerOpen
                  ? 'bg-stone-100 text-stone-900'
                  : 'hover:text-stone-900 hover:bg-stone-100'
              }`}
              title="Attach memory photo"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{photoUrl ? 'Photo attached' : 'Add photo'}</span>
            </button>
          </div>

          {/* Quick Focus Button in Editor */}
          {onOpenFocusMode && (
            <button
              type="button"
              onClick={onOpenFocusMode}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors hidden sm:flex items-center gap-1"
            >
              Full screen focus
            </button>
          )}
        </div>

        {/* Photo Memory Attachment Tray */}
        {isPhotoPickerOpen && (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-700">
                Choose a visual memory for this entry
              </span>
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presetPhotos.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPhotoUrl(preset.url);
                    setIsPhotoPickerOpen(false);
                  }}
                  className={`cursor-pointer rounded-lg overflow-hidden border p-2 flex items-center gap-3 transition-all ${
                    photoUrl === preset.url
                      ? 'border-stone-900 bg-white ring-2 ring-stone-900/10'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="text-xs font-semibold text-stone-900">{preset.title}</p>
                    <p className="text-[11px] text-stone-500 leading-tight">{preset.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom URL or upload option */}
            <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="Or paste an image URL here..."
                value={photoUrl || ''}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-md focus:outline-hidden focus:border-stone-400"
              />
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Photo Preview Banner (if attached) */}
        {photoUrl && !isPhotoPickerOpen && (
          <div className="relative rounded-xl overflow-hidden border border-stone-200/80 group max-h-56">
            <img
              src={photoUrl}
              alt="Attached diary entry visual"
              referrerPolicy="no-referrer"
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-3">
              <button
                type="button"
                onClick={() => setPhotoUrl(undefined)}
                className="bg-white/90 hover:bg-white text-stone-800 text-xs px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Remove photo
              </button>
            </div>
          </div>
        )}

        {/* The Diary Writing Canvas */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely without judgment... What happened today? How did your heart feel? Capture the thoughts before they slip away."
            className="w-full font-serif-diary text-stone-800 text-base sm:text-lg leading-relaxed placeholder:text-stone-300 border-none outline-none focus:ring-0 resize-y min-h-[300px] bg-transparent"
          />
        </div>

        {/* Tags / Topics Section */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-stone-500">Tags:</span>

          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-md transition-colors"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-stone-400 hover:text-stone-700 ml-0.5"
                title={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* New Tag Input */}
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
              placeholder="+ tag (press Enter)"
              className="text-xs px-2.5 py-1 border border-stone-200 rounded-md bg-stone-50/50 hover:bg-white focus:bg-white focus:border-stone-400 focus:outline-hidden w-36 transition-colors"
            />
          </div>

          {/* Quick Preset Tag Suggestions */}
          <div className="hidden lg:flex items-center gap-1.5 ml-auto text-xs text-stone-400">
            <span>Suggestions:</span>
            {['Gratitude', 'Memories', 'Milestone', 'Dream'].map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => handleAddTag(suggested)}
                className="hover:text-stone-700 hover:underline transition-colors"
              >
                +{suggested}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Two-Line Personal Responsive Reflection Area */}
        <div className="pt-4 border-t border-stone-100">
          {reflection ? (
            <div className="p-4 sm:p-5 rounded-xl bg-amber-50/50 border border-amber-200/60 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900">
                  <Feather className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                    A Quiet Echo of Your Entry
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateReflection}
                    disabled={isGeneratingReflection}
                    className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium transition-colors"
                    title="Generate a fresh, attuned reflection"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingReflection ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingReflection ? 'Listening...' : 'Reflect again'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReflection(undefined)}
                    className="text-stone-400 hover:text-stone-600 p-0.5"
                    title="Dismiss echo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isGeneratingReflection ? (
                <div className="py-2 text-xs text-amber-800/80 italic font-serif-diary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                  <span>Attuning to your words...</span>
                </div>
              ) : (
                <div className="space-y-1.5 font-serif-diary text-stone-800 text-sm sm:text-base leading-relaxed pl-1 border-l-2 border-amber-300">
                  {reflection
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, idx) => (
                      <p key={idx} className="italic text-stone-900 font-medium">
                        "{line.replace(/^["“”]/, '').replace(/["“”]$/, '')}"
                      </p>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Gemini crafts an attuned 2-line reflection when you submit.</span>
              </div>
              {(content.trim().length > 10 || title.trim().length > 5) && (
                <button
                  type="button"
                  onClick={handleGenerateReflection}
                  disabled={isGeneratingReflection}
                  className="text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingReflection ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingReflection ? 'Reflecting...' : 'Preview reflection now'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. The Footer Action Bar with Word Count & The 'Submit' Button */}
      <div className="bg-stone-50/90 border-t border-stone-200/80 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left: Writing Metrics & Auto-Save */}
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="font-mono tabular-nums">{wordCount} words</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{charCount} chars</span>
          <span aria-hidden="true">·</span>
          <span>~{readingTime} min read</span>
          <span aria-hidden="true">·</span>
          <span className="text-stone-400 hidden sm:inline">
            {saveStatus === 'saved' ? 'Saved' : 'Auto-saved locally'}
          </span>
        </div>

        {/* Right: Actions and 'Submit' Button */}
        <div className="flex items-center gap-2.5 justify-end">
          {editingEntry ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Cancel Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear current draft?')) {
                  setTitle('');
                  setContent('');
                  setTags(['Reflection']);
                  setPhotoUrl(undefined);
                }
              }}
              className="px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* PRIMARY SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 active:scale-98 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Recording...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Entry Saved!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                <span>{editingEntry ? 'Update Entry' : 'Submit Entry'}</span>
                <span className="text-[11px] font-normal text-stone-400 pl-1 hidden sm:inline">
                  ⌘↵
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
