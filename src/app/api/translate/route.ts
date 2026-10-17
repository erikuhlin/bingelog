import { NextResponse } from 'next/server';

const translationCache = new Map<string, string>();

async function translateWithGoogle(text: string, from: string, to: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((segment: any) => (Array.isArray(segment) ? segment[0] : ''))
        .filter(Boolean)
        .join('');
      return translated || null;
    }
  } catch (err) {
    console.warn('Google translate error:', err);
  }
  return null;
}

async function translateWithMyMemory(text: string, from: string, to: string): Promise<string | null> {
  try {
    // MyMemory has query length limits; take first 500 chars if necessary
    const query = text.slice(0, 500);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (err) {
    console.warn('MyMemory translate error:', err);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, from = 'en', to = 'sv' } = body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const trimmed = text.trim();
    const cacheKey = `${from}_${to}_${trimmed}`;

    if (translationCache.has(cacheKey)) {
      return NextResponse.json({
        translatedText: translationCache.get(cacheKey)!,
        originalText: trimmed,
        from,
        to,
        cached: true,
      });
    }

    // Try Google translate first
    let result = await translateWithGoogle(trimmed, from, to);

    // Fallback to MyMemory if Google fails
    if (!result) {
      result = await translateWithMyMemory(trimmed, from, to);
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Kunde inte översätta texten för tillfället.' },
        { status: 502 }
      );
    }

    // Cache successful translation
    translationCache.set(cacheKey, result);

    return NextResponse.json({
      translatedText: result,
      originalText: trimmed,
      from,
      to,
      cached: false,
    });
  } catch (err) {
    console.error('Translation route error:', err);
    return NextResponse.json(
      { error: 'Ett oväntat fel uppstod vid översättning.' },
      { status: 500 }
    );
  }
}
