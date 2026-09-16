'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Eye, CheckCircle2, XCircle, Star, Search, Filter, Film, Tv, Sparkles } from 'lucide-react';
import { getUserMediaList } from '@/lib/storage';
import { UserMediaRecord, WatchStatus, MediaType } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import StatusSelector from '@/components/StatusSelector';

type FilterStatus = 'all' | WatchStatus;

export default function MyListsPage() {
  const [items, setItems] = useState<UserMediaRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [selectedType, setSelectedType] = useState<'all' | MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'rating' | 'title'>('updated');

  const loadList = async () => {
    const data = await getUserMediaList();
    setItems(data);
  };

  useEffect(() => {
    loadList();
    const handleStorageChange = () => loadList();
    window.addEventListener('bingelog_storage_changed', handleStorageChange);
    return () => window.removeEventListener('bingelog_storage_changed', handleStorageChange);
  }, []);

  // Filtering
  const filtered = items.filter((item) => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedType !== 'all' && item.media_type !== selectedType) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.user_rating || 0) - (a.user_rating || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
  });

  // Counts for tabs
  const counts = {
    all: items.length,
    watching: items.filter((i) => i.status === 'watching').length,
    watchlist: items.filter((i) => i.status === 'watchlist').length,
    completed: items.filter((i) => i.status === 'completed').length,
    dropped: items.filter((i) => i.status === 'dropped').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-rose-500" />
            <span>Mina Listor</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Håll reda på vad du tittar på, vad du vill se och vad du redan har upplevt.
          </p>
        </div>

        {/* Search inside lists */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök bland dina sparade..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800">
        {[
          { id: 'all', label: 'Alla', count: counts.all, icon: Sparkles },
          { id: 'watching', label: 'Tittar på', count: counts.watching, icon: Eye },
          { id: 'watchlist', label: 'Vill se', count: counts.watchlist, icon: Bookmark },
          { id: 'completed', label: 'Har sett', count: counts.completed, icon: CheckCircle2 },
          { id: 'dropped', label: 'Avbrutna', count: counts.dropped, icon: XCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedStatus === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id as FilterStatus)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  isSelected ? 'bg-rose-700 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar (Type & Sorting) */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Filtrera typ:</span>
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              selectedType === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Alla
          </button>
          <button
            onClick={() => setSelectedType('movie')}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              selectedType === 'movie' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3 h-3 text-rose-400" />
            <span>Filmer</span>
          </button>
          <button
            onClick={() => setSelectedType('tv')}
            className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              selectedType === 'tv' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-3 h-3 text-sky-400" />
            <span>Serier</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Sortera efter:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
          >
            <option value="updated">Senast uppdaterad</option>
            <option value="rating">Mitt betyg (högst)</option>
            <option value="title">Titel (A-Ö)</option>
          </select>
        </div>
      </div>

      {/* List Grid */}
      {sorted.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
          <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-200">Inga titlar i den här listan</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'Inga resultat matchade din sökning.'
              : 'Utforska filmer och serier för att bygga upp din personliga dagbok.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upptäck titlar nu</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {sorted.map((item) => (
            <div
              key={`${item.media_type}-${item.tmdb_id}`}
              className="group relative flex flex-col bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden hover:border-zinc-700 transition-all"
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                <Link href={`/${item.media_type}/${item.tmdb_id}`} className="block w-full h-full">
                  <img
                    src={getImageUrl(item.poster_path, 'w500')}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="absolute top-2.5 left-2.5 pointer-events-none">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md text-[10px] font-semibold text-zinc-200 border border-zinc-800">
                    {item.media_type === 'movie' ? 'Film' : 'Serie'}
                  </span>
                </div>

                {item.user_rating && (
                  <div className="absolute top-2.5 right-2.5 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{item.user_rating}/10</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Info & Status */}
              <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                <Link
                  href={`/${item.media_type}/${item.tmdb_id}`}
                  className="font-semibold text-xs text-zinc-100 line-clamp-1 hover:text-rose-400 transition-colors"
                >
                  {item.title}
                </Link>

                <StatusSelector
                  tmdbId={item.tmdb_id}
                  mediaType={item.media_type}
                  title={item.title}
                  posterPath={item.poster_path}
                  backdropPath={item.backdrop_path}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
