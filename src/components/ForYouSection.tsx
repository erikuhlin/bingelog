'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, BookmarkPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserMediaList } from '@/lib/storage';
import { MediaItem } from '@/lib/types';
import HorizontalMediaRow from './HorizontalMediaRow';

export default function ForYouSection() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [libraryCount, setLibraryCount] = useState<number | null>(null);

  const fetchRecommendations = async () => {
    if (!user) {
      setRecommendations([]);
      return;
    }

    try {
      const library = await getUserMediaList();
      setLibraryCount(library.length);

      if (!library || library.length === 0) {
        setRecommendations([]);
        return;
      }

      setLoading(true);
      const res = await fetch('/api/recommendations/for-you', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryItems: library }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.warn('Could not load for-you recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    const handler = () => fetchRecommendations();
    window.addEventListener('bingelog_storage_changed', handler);
    return () => window.removeEventListener('bingelog_storage_changed', handler);
  }, [user]);

  // Only displayed when user is logged in!
  if (!user) return null;

  // If user has no items in library yet, show an inviting onboarding card
  if (libraryCount === 0) {
    return (
      <section className="mb-8 sm:mb-12 relative w-full overflow-hidden">
        <div className="bg-gradient-to-r from-[#171C25] to-[#1E2531] border border-[#2B3443] rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xl">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[#E9A23B] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                För dig
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#ECE9E3] tracking-tight">
              Skapa din personliga rekommendationsprofil
            </h2>
            <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 leading-relaxed">
              Lägg till titlar du sett eller vill se i ditt bibliotek. Då analyserar Bingelog dina favoriter och fyller denna sektion med skräddarsydda tips för just dig!
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E9A23B] text-[#0F1218] text-xs font-bold hover:bg-[#F2B04E] transition-all shadow-md shadow-[#E9A23B]/20"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Börja utforska filmer</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <HorizontalMediaRow
      title="För dig"
      description="Personliga rekommendationer baserat på filmer och serier i ditt bibliotek"
      badge="Skräddarsytt"
      iconType="sparkles"
      iconColor="text-[#E9A23B]"
      items={recommendations}
    />
  );
}
