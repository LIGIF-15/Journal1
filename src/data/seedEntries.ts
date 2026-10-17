import { DiaryEntry, DiaryMood, WritingPrompt } from '../types/diary';

export const MOODS: DiaryMood[] = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿', accentColor: '#15803d', bgLight: '#f0fdf4' },
  { id: 'radiant', label: 'Radiant', emoji: '☀️', accentColor: '#b45309', bgLight: '#fefce8' },
  { id: 'reflective', label: 'Reflective', emoji: '🌊', accentColor: '#0369a1', bgLight: '#f0f9ff' },
  { id: 'tender', label: 'Tender', emoji: '🌧️', accentColor: '#6b21a8', bgLight: '#faf5ff' },
  { id: 'energized', label: 'Energized', emoji: '⚡', accentColor: '#c2410c', bgLight: '#fff7ed' },
  { id: 'solitude', label: 'Solitude', emoji: '🕯️', accentColor: '#475569', bgLight: '#f8fafc' },
];

export const INITIAL_PROMPTS: WritingPrompt[] = [
  {
    id: 'p1',
    category: 'Reflection',
    text: 'What was the most quiet, unhurried moment of your day today?',
    subtext: 'Describe what your senses noticed in that pause.',
  },
  {
    id: 'p2',
    category: 'Gratitude',
    text: 'Name one ordinary kindness you witnessed or received recently.',
    subtext: 'Even something as simple as a held elevator or a warm sip.',
  },
  {
    id: 'p3',
    category: 'Mindfulness',
    text: 'What is a thought or worry you can consciously set down for the night?',
    subtext: 'Put it into words here so your mind does not have to carry it.',
  },
  {
    id: 'p4',
    category: 'Discovery',
    text: 'What surprised you about yourself or someone else this week?',
    subtext: 'A change of heart, a forgotten joy, or an unexpected courage.',
  },
  {
    id: 'p5',
    category: 'Growth',
    text: 'If today was a chapter title in your personal book, what would it be named?',
    subtext: 'Reflect on what themes defined today.',
  },
];

export const INITIAL_ENTRIES: DiaryEntry[] = [
  {
    id: 'entry-1',
    title: 'Rain on the skylight and warm ginger tea',
    content: `The morning started with a gentle drizzle drumming steadily against the roof glass. For the first time all month, I didn't reach straight for the telephone when my eyes opened. Instead, I simply lay there listening to the cadence of the water.

Brewed a pot of loose sencha tea with a sliver of fresh crushed ginger root. The steam carried the fragrance straight across the wooden table. I spent twenty minutes looking through an old art catalogue from Kyoto, remembering the stone gardens of Ryoan-ji.

Work was surprisingly smooth. When deadlines get tense, having had that initial hour of stillness acts like an anchor—you still feel the pull of the current, but you aren't swept away.

**A reminder for tomorrow:** Give people the benefit of the doubt before assuming urgency is malice. Everyone is carrying an invisible satchel of weight.`,
    date: '2026-10-02T08:30:00.000Z',
    displayDate: 'Friday, October 2, 2026',
    location: 'Home Library',
    weather: 'Soft autumn drizzle · 16°C',
    mood: 'peaceful',
    tags: ['Mindfulness', 'Morning Routine', 'Kyoto'],
    photoUrl: '/src/assets/images/journal_rainy_window_1791015506141.jpg',
    isFavorite: true,
    wordCount: 147,
    readingMinutes: 1,
    reflection: `The scent of crushed ginger root anchored your morning before the rush could steal it.\nMay you carry that quiet stone garden with you into whatever turbulence tomorrow holds.`,
    updatedAt: '2026-10-02T08:30:00.000Z',
  },
  {
    id: 'entry-2',
    title: 'Long walk across the northern canal',
    content: `Walked down by the canal just as the dusk light turned the water into liquid bronze. The willow branches were dipping into the surface, creating tiny concentric ripples that drifted slowly downstream.

Met Mrs. Henderson walking her old golden retriever, Barnaby. We stood near the iron bridge chatting about how early the chestnuts are falling this year. There is something grounding about speaking with neighbors about the weather without any pretense or agenda.

Came back with chilled fingers and a clear head. Wrote two pages in my notebook on the train draft before dinner.`,
    date: '2026-09-29T19:15:00.000Z',
    displayDate: 'Tuesday, September 29, 2026',
    location: 'North Canal Path',
    weather: 'Clear dusk · Crisp 14°C',
    mood: 'reflective',
    tags: ['Evening Walk', 'Solitude', 'Observations'],
    photoUrl: '/src/assets/images/journal_desk_morning_1791015487637.jpg',
    isFavorite: false,
    wordCount: 112,
    readingMinutes: 1,
    reflection: `You found true companionship in simple words about fallen chestnuts by the iron bridge.\nHow remarkable that cold autumn air can leave the heart feeling so thoroughly warmed.`,
    updatedAt: '2026-09-29T19:15:00.000Z',
  },
];
