'use client';

import React, { useState } from 'react';
import { SWEDISH_STREAMING_PROVIDERS, getImageUrl } from '@/lib/tmdb';
import { Sparkles, Tv } from 'lucide-react';

interface ProviderFilterTabsProps {
  selectedProviderId: number | null;
  onSelectProvider: (providerId: number | null) => void;
}

function ProviderLogo({ logoPath, name, bg }: { logoPath: string; name: string; bg?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError || !logoPath) {
    return (
      <div className={`w-5 h-5 rounded-md ${bg || 'bg-zinc-800'} text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 shadow-inner`}>
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded-md overflow-hidden bg-zinc-950 flex-shrink-0 flex items-center justify-center shadow-sm">
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
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* All providers pill */}
      <button
        type="button"
        onClick={() => onSelectProvider(null)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
          selectedProviderId === null
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-2 ring-rose-500/50'
            : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-white" />
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
                ? 'bg-zinc-100 text-zinc-950 border-white shadow-lg ring-2 ring-white/30 scale-105'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/90'
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
