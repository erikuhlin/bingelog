'use client';

import React, { useState } from 'react';
import { Languages, Loader2, RefreshCw, Check } from 'lucide-react';

interface OverviewSectionProps {
  overview: string;
  isEnglish?: boolean;
  className?: string;
  textSize?: string;
  compactHeading?: boolean;
}

export default function OverviewSection({
  overview,
  isEnglish = false,
  className = '',
  textSize = 'text-sm lg:text-base',
  compactHeading = false,
}: OverviewSectionProps) {
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (translatedText) {
      setShowOriginal(false);
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: overview, from: 'en', to: 'sv' }),
      });

      if (!res.ok) {
        throw new Error('Kunde inte översätta texten.');
      }

      const data = await res.json();
      if (data?.translatedText) {
        setTranslatedText(data.translatedText);
        setShowOriginal(false);
      } else {
        throw new Error('Inget översättningsresultat mottogs.');
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err?.message || 'Ett fel uppstod vid översättning.');
    } finally {
      setIsTranslating(false);
    }
  };

  const displayText =
    translatedText && !showOriginal ? translatedText : overview;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with Title and Translation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3
            className={`font-bold uppercase tracking-wider text-[#8D97A8] ${
              compactHeading ? 'text-[11px]' : 'text-xs'
            }`}
          >
            Handling
          </h3>

          {isEnglish && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1E2531] border border-[#2B3443] text-[#8D97A8]">
              {translatedText && !showOriginal ? 'Svenska (översatt)' : 'Engelska'}
            </span>
          )}
        </div>

        {/* Translation action button if English */}
        {isEnglish && (
          <div className="flex items-center gap-2">
            {!translatedText ? (
              <button
                type="button"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E9A23B]/10 hover:bg-[#E9A23B]/20 text-[#E9A23B] text-xs font-medium border border-[#E9A23B]/25 transition-all disabled:opacity-60 cursor-pointer"
                title="Översätt handlingen till svenska med AI/översättningstjänst"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Översätter...</span>
                  </>
                ) : (
                  <>
                    <Languages className="w-3.5 h-3.5" />
                    <span>Översätt till svenska</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] text-xs font-medium border border-[#2B3443] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-[#8D97A8]" />
                  <span>
                    {showOriginal ? 'Visa översättning' : 'Visa original (EN)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overview Text */}
      <p
        className={`text-[#ECE9E3]/90 leading-relaxed max-w-3xl ${textSize} transition-opacity duration-200 ${
          isTranslating ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {displayText || 'Ingen handling tillgänglig.'}
      </p>

      {/* Error message if translation fails */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-[#E5484D] pt-1">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleTranslate}
            className="underline hover:text-[#ECE9E3] cursor-pointer"
          >
            Försök igen
          </button>
        </div>
      )}
    </div>
  );
}
