'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import BrandLogo from '@/components/BrandLogo';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus('error');
      setErrorMessage('Supabase är inte konfigurerat.');
      return;
    }

    // 1. Check for error parameters in the URL
    const errorParam = searchParams.get('error');
    const errorDesc = searchParams.get('error_description');
    if (errorParam) {
      setStatus('error');
      setErrorMessage(errorDesc || errorParam || 'Verifieringen misslyckades.');
      return;
    }

    const code = searchParams.get('code');

    async function handleAuth() {
      try {
        if (code) {
          // PKCE code exchange
          const { error } = await supabase!.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus('error');
            setErrorMessage(
              error.message.includes('expired')
                ? 'Verifieringslänken har löpt ut. Vänligen beställ en ny eller prova att logga in.'
                : error.message
            );
            return;
          }
        }

        // Verify that we now have an active session
        const {
          data: { session },
        } = await supabase!.auth.getSession();

        if (session) {
          setStatus('success');
          window.dispatchEvent(new Event('bingelog_storage_changed'));
          const timer = setTimeout(() => {
            router.push('/');
          }, 2000);
          return () => clearTimeout(timer);
        } else {
          // If no session yet (e.g. hash token processing), listen for auth change
          const {
            data: { subscription },
          } = supabase!.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
              setStatus('success');
              window.dispatchEvent(new Event('bingelog_storage_changed'));
              setTimeout(() => {
                router.push('/');
              }, 2000);
            }
          });

          // Fallback timeout after 4 seconds
          const timeout = setTimeout(() => {
            subscription.unsubscribe();
            // Final check on session before declaring error
            supabase!.auth.getSession().then(({ data: { session: finalSession } }) => {
              if (finalSession) {
                setStatus('success');
                router.push('/');
              } else {
                setStatus('error');
                setErrorMessage('Kunde inte bekräfta sessionen. Vänligen prova att logga in.');
              }
            });
          }, 4000);

          return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message || 'Ett oväntat fel uppstod vid verifieringen.');
      }
    }

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#171C25] border border-[#2B3443] rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        <div className="flex justify-center">
          <BrandLogo size="lg" />
        </div>

        {status === 'verifying' && (
          <div className="space-y-4 py-6">
            <Loader2 className="w-10 h-10 animate-spin text-[#E9A23B] mx-auto" />
            <h2 className="text-xl font-bold text-[#ECE9E3]">Verifierar din e-postadress...</h2>
            <p className="text-xs text-[#8D97A8] max-w-xs mx-auto">
              Vänligen vänta ett ögonblick medan vi aktiverar ditt konto och loggar in dig.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#6FA98A]/15 border border-[#6FA98A]/30 flex items-center justify-center mx-auto text-[#6FA98A] shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#ECE9E3]">E-postadressen är bekräftad!</h2>
            <p className="text-xs sm:text-sm text-[#8D97A8] max-w-xs mx-auto leading-relaxed">
              Ditt konto är nu aktiverat och du är inloggad. Skickar dig vidare till Bingelog...
            </p>
            <div className="pt-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <span>Gå till startsidan direkt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mx-auto text-red-400 shadow-lg">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#ECE9E3]">Verifieringen misslyckades</h2>
            <p className="text-xs text-red-300 max-w-xs mx-auto">
              {errorMessage || 'Länken är ogiltig eller har redan använts.'}
            </p>
            <div className="pt-3 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] text-xs font-semibold border border-[#2B3443] transition-colors"
              >
                Till startsidan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[65vh] flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#E9A23B]" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
