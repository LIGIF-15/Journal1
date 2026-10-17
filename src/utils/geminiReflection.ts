interface ReflectionRequest {
  title: string;
  content: string;
  mood?: string;
  date?: string;
  location?: string;
  weather?: string;
  tags?: string[];
}

export async function generateEntryReflection(data: ReflectionRequest): Promise<string | null> {
  try {
    const response = await fetch('/api/diary/reflect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('Gemini reflection endpoint responded with error:', errData);
      return null;
    }

    const result = await response.json();
    return result.reflection || null;
  } catch (err) {
    console.error('Failed to request reflection from Gemini:', err);
    return null;
  }
}
