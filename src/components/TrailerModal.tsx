'use client';

import React, { useEffect } from 'react';
import { X, Play } from 'lucide-react';
import { Video } from '@/lib/types';

interface TrailerModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrailerModal({ video, isOpen, onClose }: TrailerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !video.key) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#171C25] border border-[#2B3443] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2B3443] bg-[#171C25]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#E9A23B]/15 text-[#E9A23B]">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs md:text-sm font-bold text-[#ECE9E3] truncate">
              {video.name || 'Officiell Trailer'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 Video Player */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&rel=0`}
            title={video.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
