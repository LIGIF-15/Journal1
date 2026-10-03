import React from 'react';
import { X, Calendar, MapPin, CloudSun, Heart, Edit3, Trash2, Clock, Share2 } from 'lucide-react';
import { DiaryEntry } from '../types/diary';
import { MOODS } from '../data/seedEntries';

interface EntryDetailModalProps {
  entry: DiaryEntry | null;
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  if (!entry) return null;

  const moodMeta = MOODS.find((m) => m.id === entry.mood);

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

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="pt-6 border-t border-stone-100 flex flex-wrap items-center gap-2">
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
