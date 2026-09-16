'use client';

import React, { useState } from 'react';
import { Play, Share2, Check } from 'lucide-react';
import { MediaType, Video } from '@/lib/types';
import StatusSelector from './StatusSelector';
import TrailerModal from './TrailerModal';

interface MediaActionsBarProps {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  trailerVideo?: Video;
}

export default function MediaActionsBar({
  tmdbId,
  mediaType,
  title,
  posterPath,
  backdropPath,
  trailerVideo,
}: MediaActionsBarProps) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: `${title} på Bingelog`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
      {/* Status Selector with Rating */}
      <div className="flex-1 sm:flex-initial min-w-[140px]">
        <StatusSelector
          tmdbId={tmdbId}
          mediaType={mediaType}
          title={title}
          posterPath={posterPath}
          backdropPath={backdropPath}
          showRating={true}
        />
      </div>

      {/* Trailer Button if available */}
      {trailerVideo && (
        <>
          <button
            type="button"
            onClick={() => setTrailerOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] text-xs font-semibold border border-[#2B3443] shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#E9A23B]" />
            <span>Trailer</span>
          </button>

          <TrailerModal
            video={trailerVideo}
            isOpen={trailerOpen}
            onClose={() => setTrailerOpen(false)}
          />
        </>
      )}

      {/* Share / Copy Link Button */}
      <button
        type="button"
        onClick={handleShare}
        title="Dela titel"
        className="p-2 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] transition-colors cursor-pointer"
      >
        {copied ? <Check className="w-4 h-4 text-[#6FA98A]" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
