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
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Selector with Rating */}
      <StatusSelector
        tmdbId={tmdbId}
        mediaType={mediaType}
        title={title}
        posterPath={posterPath}
        backdropPath={backdropPath}
        showRating={true}
      />

      {/* Trailer Button if available */}
      {trailerVideo && (
        <>
          <button
            type="button"
            onClick={() => setTrailerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current text-rose-500" />
            <span>Spela Trailer</span>
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
        className="p-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
