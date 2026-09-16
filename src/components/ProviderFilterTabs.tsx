'use client';

import React, { useState } from 'react';
import { SWEDISH_STREAMING_PROVIDERS, getImageUrl } from '@/lib/tmdb';
import { Sparkles } from 'lucide-react';

interface ProviderFilterTabsProps {
  selectedProviderId: number | null;
  onSelectProvider: (providerId: number | null) => void;
}

function ProviderLogo({ logoPath, name, bg }: { logoPath: string; name: string; bg?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError || !logoPath) {
    return (
      <div className={`w-5 h-5 rounded-md ${bg || 'bg-[#1E2531]'} text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-inner`}>
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded-md overflow-hidden bg-[#0F1218] flex-shrink-0 flex items-center justify-center shadow-sm">
      <img
        src={getImageUrl(logoPath, 'w300')}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function ProviderFilterTabs({
  selectedProviderId,
  onSelectProvider,
}: ProviderFilterTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* All providers pill */}
      <button
        type="button"
        onClick={() => onSelectProvider(null)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
          selectedProviderId === null
            ? 'bg-[#E9A23B] text-[#0F1218] shadow-lg shadow-[#E9A23B]/30 ring-2 ring-[#E9A23B]/50'
            : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
        }`}
      >
        <Sparkles className={`w-3.5 h-3.5 ${selectedProviderId === null ? 'text-[#0F1218]' : 'text-[#E9A23B]'}`} />
        <span>Alla streamingtjänster</span>
      </button>

      {/* Streaming services */}
      {SWEDISH_STREAMING_PROVIDERS.map((provider) => {
        const isSelected = selectedProviderId === provider.id;

        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => onSelectProvider(isSelected ? null : provider.id)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
              isSelected
                ? 'bg-[#E9A23B] text-[#0F1218] border-[#E9A23B] shadow-lg ring-2 ring-[#E9A23B]/30 scale-105'
                : 'bg-[#171C25] text-[#ECE9E3] border-[#2B3443] hover:border-[#E9A23B]/50 hover:bg-[#1E2531]'
            }`}
          >
            <ProviderLogo logoPath={provider.logo_path} name={provider.name} bg={provider.bg} />
            <span>{provider.name}</span>
          </button>
        );
      })}
    </div>
  );
}
