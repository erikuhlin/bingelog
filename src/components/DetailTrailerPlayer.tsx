'use client';

import React, { useState } from 'react';
import { Play, Film, ExternalLink } from 'lucide-react';
import { Video } from '@/lib/types';

interface DetailTrailerPlayerProps {
  videos?: Video[];
  title: string;
}

export default function DetailTrailerPlayer({ videos, title }: DetailTrailerPlayerProps) {
  if (!videos || videos.length === 0) return null;

  const [activeIdx, setActiveIdx] = useState(0);
  const activeVideo = videos[activeIdx] || videos[0];

  return (
    <section className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#E9A23B]/15 text-[#E9A23B]">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-[#ECE9E3] tracking-tight">
            Officiell Trailer
          </h2>
          <span className="text-[11px] font-semibold text-[#8D97A8] px-2 py-0.5 rounded-md bg-[#1E2531] border border-[#2B3443]">
            {activeVideo.type || 'Trailer'}
          </span>
        </div>

        {/* Video selector pills if multiple videos exist */}
        {videos.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {videos.slice(0, 5).map((v, idx) => (
              <button
                key={v.id || v.key || idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`text-xs px-2.5 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  idx === activeIdx
                    ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-md'
                    : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>{v.name || `${v.type || 'Trailer'} ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Container */}
      <div className="relative aspect-video w-full rounded-2xl md:rounded-3xl overflow-hidden border border-[#2B3443] bg-black shadow-2xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${activeVideo.key}?rel=0`}
          title={activeVideo.name || `${title} Trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full border-0"
        />
      </div>

      {/* Bottom info link */}
      <div className="flex items-center justify-between text-[11px] text-[#8D97A8] px-1">
        <span className="truncate max-w-[70%]">{activeVideo.name || title}</span>
        <a
          href={`https://www.youtube.com/watch?v=${activeVideo.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-[#E9A23B] transition-colors"
        >
          <span>Öppna på YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
}
