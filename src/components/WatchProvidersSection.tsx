'use client';

import React, { useState } from 'react';
import { Tv, ExternalLink, Info } from 'lucide-react';
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

function ProviderItem({ p }: { p: WatchProvider }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      title={p.provider_name}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/60 transition-all shadow-sm"
    >
      {imgErr || !p.logo_path ? (
        <div className="w-6 h-6 rounded-lg bg-[#1E2531] text-[#ECE9E3] font-bold text-xs flex items-center justify-center">
          {p.provider_name.slice(0, 1)}
        </div>
      ) : (
        <img
          src={getImageUrl(p.logo_path, 'w300')}
          alt={p.provider_name}
          className="w-6 h-6 rounded-lg object-cover"
          onError={() => setImgErr(true)}
        />
      )}
      <span className="text-xs font-semibold text-[#ECE9E3]">{p.provider_name}</span>
    </div>
  );
}

export default function WatchProvidersSection({ providers }: WatchProvidersSectionProps) {
  const stream = providers?.flatrate || [];
  const rent = providers?.rent || [];
  const buy = providers?.buy || [];
  const hasAny = stream.length > 0 || rent.length > 0 || buy.length > 0;

  return (
    <div className="p-4 md:p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-[#E9A23B]" />
          <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#ECE9E3]">
            Var kan man se den i Sverige?
          </h3>
        </div>
        {providers?.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#8D97A8] hover:text-[#ECE9E3] flex items-center gap-1 transition-colors"
          >
            <span>Data via JustWatch</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {!hasAny ? (
        <div className="flex items-center gap-2.5 py-2 text-xs text-[#8D97A8]">
          <Info className="w-4 h-4 text-[#8D97A8] flex-shrink-0" />
          <span>
            Finns för närvarande inte tillgänglig på de stora svenska streamingtjänsterna (eller saknar officiell streamingdata).
          </span>
        </div>
      ) : (
        <>
          {/* Stream (Abonnemang) */}
          {stream.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-[#6FA98A] block mb-2">
                Streama med abonnemang
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                {stream.map((p) => (
                  <ProviderItem key={p.provider_id} p={p} />
                ))}
              </div>
            </div>
          )}

          {/* Rent / Buy */}
          {(rent.length > 0 || buy.length > 0) && (
            <div className="pt-2 border-t border-[#2B3443]/60 flex flex-col sm:flex-row gap-4">
              {rent.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[#8D97A8] block mb-2">
                    Hyrfilm
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {rent.slice(0, 5).map((p) => (
                      <div
                        key={p.provider_id}
                        title={p.provider_name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1E2531] border border-[#2B3443] text-[11px] text-[#ECE9E3]"
                      >
                        <img
                          src={getImageUrl(p.logo_path, 'w300')}
                          alt={p.provider_name}
                          className="w-4 h-4 rounded-md object-cover"
                        />
                        <span>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {buy.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[#8D97A8] block mb-2">
                    Köpfilm
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {buy.slice(0, 5).map((p) => (
                      <div
                        key={p.provider_id}
                        title={p.provider_name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1E2531] border border-[#2B3443] text-[11px] text-[#ECE9E3]"
                      >
                        <img
                          src={getImageUrl(p.logo_path, 'w300')}
                          alt={p.provider_name}
                          className="w-4 h-4 rounded-md object-cover"
                        />
                        <span>{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
