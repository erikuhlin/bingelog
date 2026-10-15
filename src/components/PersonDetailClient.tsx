'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  User,
  Film,
  Tv,
  Star,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  PenTool,
  UserCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { PersonDetails, PersonGroupedCredits, PersonCreditItem, MediaType } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import MediaCard from '@/components/MediaCard';
import DetailBackButton from '@/components/DetailBackButton';

interface PersonDetailClientProps {
  person: PersonDetails;
  credits: PersonGroupedCredits;
}

type TabType = 'all' | 'acting' | 'directing' | 'writing';
type SortType = 'popularity' | 'newest' | 'oldest' | 'rating';

function calculateAge(birthday: string, deathday?: string): number | null {
  try {
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return isNaN(age) || age < 0 ? null : age;
  } catch {
    return null;
  }
}

function formatSwedishDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function PersonDetailClient({ person, credits }: PersonDetailClientProps) {
  // Determine available tabs
  const hasActing = credits.acting.length > 0;
  const hasDirecting = credits.directing.length > 0;
  const hasWriting = credits.writing.length > 0;

  // Initial active tab
  const defaultTab: TabType = useMemo(() => {
    if (person.known_for_department === 'Directing' && hasDirecting) return 'directing';
    if (person.known_for_department === 'Writing' && hasWriting) return 'writing';
    if (hasActing) return 'acting';
    return 'all';
  }, [person.known_for_department, hasActing, hasDirecting, hasWriting]);

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [sortBy, setSortBy] = useState<SortType>('popularity');
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const age = person.birthday ? calculateAge(person.birthday, person.deathday) : null;

  // Active credit list based on selected tab
  const currentTabItems: PersonCreditItem[] = useMemo(() => {
    switch (activeTab) {
      case 'acting':
        return credits.acting;
      case 'directing':
        return credits.directing;
      case 'writing':
        return credits.writing;
      case 'all':
      default:
        return credits.all;
    }
  }, [activeTab, credits]);

  // Counts for media types in active tab
  const movieCount = useMemo(
    () => currentTabItems.filter((i) => i.media_type === 'movie').length,
    [currentTabItems]
  );
  const tvCount = useMemo(
    () => currentTabItems.filter((i) => i.media_type === 'tv').length,
    [currentTabItems]
  );

  // Filter & sort items
  const displayItems = useMemo(() => {
    let result = [...currentTabItems];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((i) => i.media_type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      if (sortBy === 'newest') {
        const dateA = a.release_date || a.first_air_date || '0000';
        const dateB = b.release_date || b.first_air_date || '0000';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'oldest') {
        const dateA = a.release_date || a.first_air_date || '9999';
        const dateB = b.release_date || b.first_air_date || '9999';
        return dateA.localeCompare(dateB);
      }
      // popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return result;
  }, [currentTabItems, filterType, sortBy]);

  // Department labels
  const roleBadges: { label: string; icon: React.ReactNode }[] = [];
  if (hasDirecting) {
    roleBadges.push({
      label: 'Regissör',
      icon: <Clapperboard className="w-3.5 h-3.5 text-[#E9A23B]" />,
    });
  }
  if (hasWriting) {
    roleBadges.push({
      label: 'Manusförfattare',
      icon: <PenTool className="w-3.5 h-3.5 text-[#E9A23B]" />,
    });
  }
  if (hasActing) {
    roleBadges.push({
      label: 'Skådespelare',
      icon: <UserCheck className="w-3.5 h-3.5 text-[#E9A23B]" />,
    });
  }

  // Biography truncation
  const bio = person.biography?.trim() || '';
  const isLongBio = bio.length > 320;
  const displayedBio = isLongBio && !isBioExpanded ? `${bio.slice(0, 320)}...` : bio;

  return (
    <div className="min-h-screen bg-[#0F1218] text-[#ECE9E3] pb-20">
      {/* Top Bar with Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <DetailBackButton />
      </div>

      {/* Person Hero Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#171C25] border border-[#2B3443] shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E9A23B]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative z-10">
            {/* Profile Avatar */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden bg-[#0F1218] border-2 border-[#2B3443] shadow-2xl flex-shrink-0 flex items-center justify-center">
              {person.profile_path ? (
                <img
                  src={getImageUrl(person.profile_path, 'w500')}
                  alt={person.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <User className="w-20 h-20 text-[#8D97A8]/50" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 text-center md:text-left space-y-3.5">
              {/* Role Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {roleBadges.map((badge) => (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-xs font-bold text-[#E9A23B]"
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs font-medium text-[#8D97A8]">
                  {credits.all.length} {credits.all.length === 1 ? 'produktion' : 'produktioner'}
                </span>
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#ECE9E3] tracking-tight">
                {person.name}
              </h1>

              {/* Key Facts Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs text-[#8D97A8] pt-1">
                {person.birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>
                      {formatSwedishDate(person.birthday)}
                      {age !== null && !person.deathday && ` (${age} år)`}
                    </span>
                  </span>
                )}

                {person.deathday && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-xs">✝</span>
                    <span>
                      {formatSwedishDate(person.deathday)}
                      {age !== null && ` (${age} år)`}
                    </span>
                  </span>
                )}

                {person.place_of_birth && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E9A23B]" />
                    <span>{person.place_of_birth}</span>
                  </span>
                )}

                {person.imdb_id && (
                  <a
                    href={`https://www.imdb.com/name/${person.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#E9A23B] hover:text-[#F2B04E] font-semibold transition-colors"
                  >
                    <span>IMDb</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Biography */}
              {bio ? (
                <div className="pt-2 text-xs sm:text-sm text-[#ECE9E3]/90 leading-relaxed max-w-3xl">
                  <p className="whitespace-pre-line">{displayedBio}</p>
                  {isLongBio && (
                    <button
                      type="button"
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#E9A23B] hover:text-[#F2B04E] transition-colors cursor-pointer"
                    >
                      <span>{isBioExpanded ? 'Visa mindre' : 'Läs mer'}</span>
                      {isBioExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Tabs, Filters & Media Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation Tabs (Alla, Skådespelare, Regi, Manus) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2B3443]">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                  : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
              }`}
            >
              <span>Alla titlar</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === 'all' ? 'bg-[#0F1218]/20 text-[#0F1218]' : 'bg-[#1E2531] text-[#8D97A8]'
                }`}
              >
                {credits.all.length}
              </span>
            </button>

            {hasActing && (
              <button
                type="button"
                onClick={() => setActiveTab('acting')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                  activeTab === 'acting'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                    : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Skådespelare</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'acting' ? 'bg-[#0F1218]/20 text-[#0F1218]' : 'bg-[#1E2531] text-[#8D97A8]'
                  }`}
                >
                  {credits.acting.length}
                </span>
              </button>
            )}

            {hasDirecting && (
              <button
                type="button"
                onClick={() => setActiveTab('directing')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                  activeTab === 'directing'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                    : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
                }`}
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Regi</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'directing' ? 'bg-[#0F1218]/20 text-[#0F1218]' : 'bg-[#1E2531] text-[#8D97A8]'
                  }`}
                >
                  {credits.directing.length}
                </span>
              </button>
            )}

            {hasWriting && (
              <button
                type="button"
                onClick={() => setActiveTab('writing')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 ${
                  activeTab === 'writing'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                    : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Manus</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'writing' ? 'bg-[#0F1218]/20 text-[#0F1218]' : 'bg-[#1E2531] text-[#8D97A8]'
                  }`}
                >
                  {credits.writing.length}
                </span>
              </button>
            )}
          </div>

          {/* Secondary Controls: Format Filter (Filmer/Serier) & Sort Order */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Format toggle: Alla / Filmer / Serier */}
            <div className="flex items-center bg-[#171C25] border border-[#2B3443] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#1E2531] text-[#ECE9E3] shadow-sm'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                Alla
              </button>
              <button
                type="button"
                onClick={() => setFilterType('movie')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'movie'
                    ? 'bg-[#1E2531] text-[#ECE9E3] shadow-sm'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Film className="w-3 h-3 text-[#E9A23B]" />
                <span>Filmer ({movieCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('tv')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'tv'
                    ? 'bg-[#1E2531] text-[#ECE9E3] shadow-sm'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className="w-3 h-3 text-sky-400" />
                <span>Serier ({tvCount})</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="bg-[#171C25] border border-[#2B3443] text-[#ECE9E3] text-xs font-semibold rounded-xl px-3 py-1.5 focus:border-[#E9A23B] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="popularity">Mest populära</option>
              <option value="newest">Nyast först</option>
              <option value="oldest">Äldst först</option>
              <option value="rating">Högst betyg</option>
            </select>
          </div>
        </div>

        {/* Results Count & Current Filter Info */}
        <div className="flex items-center justify-between text-xs text-[#8D97A8]">
          <span>
            Visar {displayItems.length} {displayItems.length === 1 ? 'titel' : 'titlar'}
          </span>
        </div>

        {/* Media Grid */}
        {displayItems.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {displayItems.map((item) => {
              // Format role label for subtitle
              let subtitle = '';
              if (activeTab === 'acting') {
                subtitle = item.character || 'Skådespelare';
              } else if (activeTab === 'directing') {
                subtitle = item.job || 'Regissör';
              } else if (activeTab === 'writing') {
                subtitle = item.job || 'Manus';
              } else {
                // "all" tab: show roles summary (e.g. "Regissör, Manus" or character)
                subtitle = item.roles && item.roles.length > 0 ? item.roles.join(', ') : '';
              }

              return (
                <MediaCard
                  key={`${item.media_type}-${item.id}`}
                  item={item}
                  subtitle={subtitle}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 rounded-2xl bg-[#171C25]/50 border border-[#2B3443] p-8">
            <Film className="w-10 h-10 text-[#8D97A8] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-[#ECE9E3]">Inga titlar matchar filtret</h3>
            <p className="text-xs text-[#8D97A8] max-w-sm mx-auto">
              Det finns inga produktioner under denna kategori med det valda formatet.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterType('all');
                setActiveTab('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E9A23B] text-[#0F1218] text-xs font-bold hover:bg-[#F2B04E] transition-all cursor-pointer"
            >
              Återställ filter
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
