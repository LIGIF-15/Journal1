import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, Check, Sparkles, Send } from 'lucide-react';
import { DiaryEntry, MoodType } from '../types/diary';
import { MOODS } from '../data/seedEntries';

interface FocusEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'updatedAt'>) => void;
}

export const FocusEditorModal: React.FC<FocusEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('solitude');
  const [isSaved, setIsSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    if (!content.trim() && !title.trim()) {
      onClose();
      return;
    }

    const now = new Date();
    onSave({
      title: title.trim() || `Quiet Thoughts · ${now.toLocaleDateString()}`,
      content,
      date: now.toISOString(),
      displayDate: now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      location: 'Focus Space',
      weather: 'Undisturbed stillness',
      mood,
      tags: ['Solitude', 'Focus'],
      wordCount,
      readingMinutes: Math.max(1, Math.ceil(wordCount / 180)),
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#faf8f5] text-stone-900 flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
      {/* Top bar in focus mode */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-3">
          <span className="font-serif-diary italic text-stone-600">Focus Mode · Pure Writing</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{wordCount} words</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Subtle mood picker */}
          <div className="flex items-center gap-1">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform ${
                  mood === m.id ? 'scale-125 bg-stone-200' : 'opacity-60 hover:opacity-100'
                }`}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
            title="Exit Focus Mode (ESC)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Writing Surface */}
      <div className="max-w-3xl w-full mx-auto my-auto space-y-6 flex-1 flex flex-col justify-center py-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give today's thought a title..."
          className="w-full text-3xl sm:text-4xl font-serif-diary font-bold text-stone-900 placeholder:text-stone-300 border-none outline-none focus:ring-0 bg-transparent px-0"
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="The world is paused. Only your words exist here. Pour your thoughts freely..."
          className="w-full flex-1 min-h-[350px] font-serif-diary text-lg sm:text-xl text-stone-800 leading-relaxed placeholder:text-stone-300 border-none outline-none focus:ring-0 bg-transparent resize-none"
        />
      </div>

      {/* Bottom Submit Action */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between pt-4 border-t border-stone-200/60 text-xs">
        <span className="text-stone-400">
          Tip: Press <kbd className="px-1.5 py-0.5 bg-stone-200/70 rounded text-[11px]">ESC</kbd> to leave anytime
        </span>

        <button
          onClick={handleSave}
          disabled={isSaved}
          className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved to Diary</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Save & Exit</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
