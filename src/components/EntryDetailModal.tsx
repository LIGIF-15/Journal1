import React, { useState } from 'react';
import { X, Calendar, MapPin, CloudSun, Heart, Edit3, Trash2, Clock, Sparkles, Feather, RefreshCw } from 'lucide-react';
import { DiaryEntry } from '../types/diary';
import { MOODS } from '../data/seedEntries';
import { generateEntryReflection } from '../utils/geminiReflection';

interface EntryDetailModalProps {
  entry: DiaryEntry | null;
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateEntryReflection?: (id: string, reflection: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onUpdateEntryReflection,
}) => {
  if (!entry) return null;

  const moodMeta = MOODS.find((m) => m.id === entry.mood);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReflection, setCurrentReflection] = useState<string | undefined>(entry.reflection);

  // Sync state if entry changes
  React.useEffect(() => {
    setCurrentReflection(entry.reflection);
  }, [entry]);

  const handleGenerateReflection = async () => {
    setIsGenerating(true);
    const newReflection = await generateEntryReflection({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      date: entry.date,
      location: entry.location,
      weather: entry.weather,
      tags: entry.tags,
    });
    setIsGenerating(false);

    if (newReflection) {
      setCurrentReflection(newReflection);
      if (onUpdateEntryReflection) {
        onUpdateEntryReflection(entry.id, newReflection);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span className="text-base">{moodMeta?.emoji}</span>
            <span className="text-xs font-semibold text-stone-700">
              {moodMeta?.label}
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-xs text-stone-500">
              {entry.displayDate ||
                new Date(entry.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(entry.id)}
              className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-stone-100 transition-colors"
              title={entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Heart
                className={`w-4 h-4 ${entry.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(entry);
              }}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
              title="Edit entry"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this diary entry?')) {
                  onDelete(entry.id);
                  onClose();
                }
              }}
              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-serif-diary font-bold text-stone-900 leading-snug">
            {entry.title}
          </h1>

          {/* Context Line: Weather / Location / Reading Time */}
          {(entry.location || entry.weather) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pb-2 border-b border-stone-100">
              {entry.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{entry.location}</span>
                </div>
              )}
              {entry.weather && (
                <div className="flex items-center gap-1">
                  <CloudSun className="w-3.5 h-3.5 text-stone-400" />
                  <span>{entry.weather}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{entry.wordCount} words · {entry.readingMinutes} min read</span>
              </div>
            </div>
          )}

          {/* Attached Image (if any) */}
          {entry.photoUrl && (
            <div className="rounded-xl overflow-hidden border border-stone-200">
              <img
                src={entry.photoUrl}
                alt={entry.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-72 object-cover"
              />
            </div>
          )}

          {/* Formatted Markdown Content */}
          <div className="font-serif-diary text-stone-800 text-base sm:text-lg leading-relaxed whitespace-pre-wrap space-y-4">
            {entry.content}
          </div>

          {/* Two-Line Gemini Personal Reflection Section */}
          <div className="pt-4 border-t border-stone-100">
            {currentReflection ? (
              <div className="p-4 sm:p-5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Feather className="w-3.5 h-3.5 text-amber-700" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                      Attuned Reflection
                    </span>
                  </div>

                  <button
                    onClick={handleGenerateReflection}
                    disabled={isGenerating}
                    className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium transition-colors"
                    title="Generate a fresh attuned echo"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Reflecting...' : 'Re-reflect'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 font-serif-diary text-stone-900 text-sm sm:text-base leading-relaxed pl-1 border-l-2 border-amber-400">
                  {currentReflection
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((line, idx) => (
                      <p key={idx} className="italic font-medium">
                        "{line.replace(/^["“”]/, '').replace(/["“”]$/, '')}"
                      </p>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs">
                <div className="flex items-center gap-2 text-stone-600">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>No reflection recorded yet for this entry.</span>
                </div>
                <button
                  onClick={handleGenerateReflection}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Listening...' : 'Generate 2-Line Echo'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-400">Filed under:</span>
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

