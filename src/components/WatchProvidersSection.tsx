'use client';

import React from 'react';
import { Tv, ExternalLink } from 'lucide-react';
import { WatchProvider } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';

interface WatchProvidersSectionProps {
  providers?: {
    link?: string;
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
  };
}

export default function WatchProvidersSection({ providers }: WatchProvidersSectionProps) {
  if (!providers) return null;

  const stream = providers.flatrate || [];
  const rent = providers.rent || [];
  const buy = providers.buy || [];

  const hasAny = stream.length > 0 || rent.length > 0 || buy.length > 0;
  if (!hasAny) return null;

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">
            Var kan man se den i Sverige?
          </h3>
        </div>
        {providers.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <span>Data via JustWatch</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Stream (Abonnemang) */}
      {stream.length > 0 && (
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 block mb-2">
            Streama med abonnemang
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {stream.map((p) => (
              <div
                key={p.provider_id}
                title={p.provider_name}
                className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 hover:border-zinc-500 transition-all shadow-sm"
              >
                <img
                  src={getImageUrl(p.logo_path, 'w300')}
                  alt={p.provider_name}
                  className="w-6 h-6 rounded-lg object-cover"
                />
                <span className="text-xs font-semibold text-zinc-200">{p.provider_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rent / Buy */}
      {(rent.length > 0 || buy.length > 0) && (
        <div className="pt-2 border-t border-zinc-800/60 flex flex-col sm:flex-row gap-4">
          {rent.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                Hyrfilm
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {rent.slice(0, 4).map((p) => (
                  <div
                    key={p.provider_id}
                    title={p.provider_name}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-[11px] text-zinc-300"
                  >
                    <img
                      src={getImageUrl(p.logo_path, 'w300')}
                      alt={p.provider_name}
                      className="w-5 h-5 rounded-md object-cover"
                    />
                    <span>{p.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {buy.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block mb-2">
                Köpfilm
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {buy.slice(0, 4).map((p) => (
                  <div
                    key={p.provider_id}
                    title={p.provider_name}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-[11px] text-zinc-300"
                  >
                    <img
                      src={getImageUrl(p.logo_path, 'w300')}
                      alt={p.provider_name}
                      className="w-5 h-5 rounded-md object-cover"
                    />
                    <span>{p.provider_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
