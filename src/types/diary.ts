export type MoodType = 'peaceful' | 'radiant' | 'reflective' | 'tender' | 'energized' | 'solitude';

export interface DiaryMood {
  id: MoodType;
  label: string;
  emoji: string;
  accentColor: string;
  bgLight: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string; // ISO string
  displayDate?: string;
  location?: string;
  weather?: string;
  mood: MoodType;
  tags: string[];
  photoUrl?: string;
  isFavorite?: boolean;
  wordCount: number;
  readingMinutes: number;
  updatedAt: string;
}

export interface WritingPrompt {
  id: string;
  category: 'Gratitude' | 'Reflection' | 'Discovery' | 'Mindfulness' | 'Growth';
  text: string;
  subtext?: string;
}
