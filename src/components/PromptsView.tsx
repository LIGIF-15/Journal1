import React from 'react';
import { Sparkles, ArrowRight, Heart, Compass, Smile, Feather } from 'lucide-react';
import { WritingPrompt } from '../types/diary';
import { INITIAL_PROMPTS } from '../data/seedEntries';

interface PromptsViewProps {
  onSelectPrompt: (prompt: WritingPrompt) => void;
}

export const PromptsView: React.FC<PromptsViewProps> = ({ onSelectPrompt }) => {
  const categories = [
    { name: 'Gratitude', icon: Heart, description: 'Noticing the quiet gifts and tenderness of ordinary moments.' },
    { name: 'Reflection', icon: Feather, description: 'Untangling emotions, decisions, and patterns with honesty.' },
    { name: 'Discovery', icon: Compass, description: 'Surprising facets of yourself, curiosities, and hidden wishes.' },
    { name: 'Growth', icon: Smile, description: 'Patience, resilience, and chapters of gentle becoming.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Intro Hero */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
          Writing Sparks & Mindful Prompts
        </span>
        <h1 className="text-3xl font-serif-diary font-bold text-stone-900">
          When the blank page needs a gentle start
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Select any prompt to open the digital diary entry canvas with this thought ready for your pen.
        </p>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INITIAL_PROMPTS.map((prompt) => (
          <div
            key={prompt.id}
            className="p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-medium text-stone-700">{prompt.category}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h3 className="text-base font-serif-diary font-semibold text-stone-900 leading-snug group-hover:text-stone-700">
                "{prompt.text}"
              </h3>
              {prompt.subtext && (
                <p className="text-xs text-stone-500 leading-relaxed">
                  {prompt.subtext}
                </p>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-end">
              <button
                onClick={() => onSelectPrompt(prompt)}
                className="text-xs font-semibold text-stone-800 group-hover:text-stone-950 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Write with this prompt</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mindful Journaling Guidelines / Quote */}
      <div className="p-6 rounded-2xl bg-stone-100/70 border border-stone-200 text-center max-w-xl mx-auto space-y-2">
        <p className="font-serif-diary italic text-stone-700 text-sm">
          "Fill your paper with the breathings of your heart."
        </p>
        <p className="text-xs text-stone-400">— William Wordsworth</p>
      </div>
    </div>
  );
};
