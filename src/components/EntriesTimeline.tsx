import React, { useState } from 'react';
import { Search, Heart, Calendar, Clock, BookOpen, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { DiaryEntry, MoodType } from '../types/diary';
import { MOODS } from '../data/seedEntries';

interface EntriesTimelineProps {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  activeEntryId?: string | null;
}

export const EntriesTimeline: React.FC<EntriesTimelineProps> = ({
  entries,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  onToggleFavorite,
  activeEntryId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | 'all'>('all');

  const filteredEntries = entries.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood = selectedMoodFilter === 'all' || item.mood === selectedMoodFilter;

    return matchesQuery && matchesMood;
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-serif-diary font-semibold text-stone-900">
            Journal Timeline
          </h2>
          <p className="text-xs text-stone-500">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} captured
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search memories, thoughts, tags..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200/80 rounded-lg focus:bg-white focus:outline-hidden focus:border-stone-400 transition-colors"
        />
      </div>

      {/* Mood Filter row */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedMoodFilter('all')}
          className={`px-2 py-1 rounded text-xs transition-colors whitespace-nowrap ${
            selectedMoodFilter === 'all'
              ? 'bg-stone-900 text-white font-medium'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          All
        </button>
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMoodFilter(m.id)}
            title={m.label}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 whitespace-nowrap ${
              selectedMoodFilter === m.id
                ? 'bg-stone-900 text-white font-medium'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span>{m.emoji}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Entries List */}
      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="text-center py-10 px-4 text-stone-400 space-y-2">
            <BookOpen className="w-9 h-9 mx-auto stroke-1 text-stone-300" />
            <p className="text-xs font-semibold text-stone-700">Your journal is awaiting its first entry</p>
            <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
              Write your thoughts in the editor above. When you submit, your entry and an attuned Gemini reflection will be saved privately to your account.
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-stone-400 space-y-1.5">
            <BookOpen className="w-8 h-8 mx-auto stroke-1 text-stone-300" />
            <p className="text-xs font-medium text-stone-600">No entries match your search</p>
            <p className="text-[11px] text-stone-400">Try clearing your search filters</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const moodMeta = MOODS.find((m) => m.id === entry.mood);
            const isSelected = entry.id === activeEntryId;

            return (
              <div
                key={entry.id}
                className={`group p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50/70 shadow-xs ring-1 ring-stone-900/10'
                    : 'border-stone-200/80 bg-white hover:border-stone-400/80 hover:bg-stone-50/40'
                }`}
                onClick={() => onSelectEntry(entry)}
              >
                {/* Top line: Mood, Date, Favorite */}
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>{moodMeta?.emoji || '🌿'}</span>
                    <span className="font-medium text-stone-700">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(entry.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(entry.id);
                      }}
                      className="p-1 text-stone-300 hover:text-rose-500 transition-colors"
                      title={entry.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          entry.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Entry Title */}
                <h3 className="text-sm font-serif-diary font-semibold text-stone-900 leading-snug line-clamp-1 group-hover:text-stone-700">
                  {entry.title}
                </h3>

                {/* Entry Excerpt */}
                <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                  {entry.content.replace(/[#*`>]/g, '')}
                </p>

                {/* Gemini Attuned Echo preview (if present) */}
                {entry.reflection && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-serif-diary italic text-amber-900/90 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/50">
                    <span className="text-amber-600 text-[10px] shrink-0 font-sans">✦</span>
                    <span className="truncate">
                      "{entry.reflection.split('\n')[0].replace(/^["“”]/, '').replace(/["“”]$/, '')}"
                    </span>
                  </div>
                )}

                {/* Optional thumbnail & tags */}
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <div className="flex items-center gap-2 truncate">
                    {entry.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-stone-500">
                        #{t}
                      </span>
                    ))}
                    {entry.tags.length > 2 && (
                      <span className="text-stone-400">+{entry.tags.length - 2}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntry(entry);
                      }}
                      className="p-1 hover:text-stone-900 rounded"
                      title="Edit this entry"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this diary entry?')) {
                          onDeleteEntry(entry.id);
                        }
                      }}
                      className="p-1 hover:text-rose-600 rounded"
                      title="Delete this entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
