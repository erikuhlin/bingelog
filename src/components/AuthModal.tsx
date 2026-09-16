'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setError(null);
      setSuccessMessage(null);
    }
  }, [authModalOpen, authModalMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && authModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Vänligen fyll i både e-post och lösenord.');
      return;
    }

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error === 'Invalid login credentials' ? 'Felaktig e-post eller lösenord.' : res.error);
        }
      } else {
        const res = await signUp(email, password, username);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Ditt konto har skapats! Du är nu inloggad och ditt bibliotek synkas.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#171C25] border border-[#2B3443] rounded-3xl shadow-2xl shadow-black/80 overflow-hidden p-6 md:p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-transparent hover:border-[#2B3443] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <BrandLogo size="lg" className="shadow-lg shadow-[#E9A23B]/10" />
          </div>
          <h2 className="text-2xl font-black text-[#ECE9E3] tracking-tight">
            {isLogin ? 'Välkommen tillbaka' : 'Skapa ditt konto'}
          </h2>
          <p className="text-xs text-[#8D97A8] mt-1 max-w-xs mx-auto leading-relaxed">
            {isLogin
              ? 'Logga in för att komma åt ditt personliga bibliotek och sedda avsnitt.'
              : 'Spara din historik och få full tillgång till ditt bibliotek på alla enheter.'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#0F1218] p-1 rounded-xl mb-6 border border-[#2B3443]">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin
                ? 'bg-[#1E2531] text-[#ECE9E3] border border-[#2B3443] shadow-sm'
                : 'text-[#8D97A8] hover:text-[#ECE9E3]'
            }`}
          >
            Logga in
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin
                ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                : 'text-[#8D97A8] hover:text-[#ECE9E3]'
            }`}
          >
            Skapa konto
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#6FA98A]/15 border border-[#6FA98A]/30 flex items-start gap-2.5 text-xs text-[#6FA98A]">
            <CheckCircle2 className="w-4 h-4 text-[#6FA98A] flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-[#ECE9E3] mb-1.5">
                Visningsnamn / Användarnamn
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D97A8]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="t.ex. Filmälskaren"
                  className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#ECE9E3] placeholder-[#8D97A8]/60 focus:outline-none focus:border-[#E9A23B] focus:ring-1 focus:ring-[#E9A23B] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#ECE9E3] mb-1.5">
              E-postadress
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D97A8]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@exempel.se"
                className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#ECE9E3] placeholder-[#8D97A8]/60 focus:outline-none focus:border-[#E9A23B] focus:ring-1 focus:ring-[#E9A23B] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#ECE9E3] mb-1.5">
              Lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D97A8]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 6 tecken"
                className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#ECE9E3] placeholder-[#8D97A8]/60 focus:outline-none focus:border-[#E9A23B] focus:ring-1 focus:ring-[#E9A23B] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] font-bold text-sm shadow-lg shadow-[#E9A23B]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {loading ? (
              <span>Vänligen vänta...</span>
            ) : isLogin ? (
              <span>Logga in</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Skapa mitt konto</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8D97A8]">
          {isLogin ? (
            <p>
              Har du inget konto än?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="text-[#E9A23B] hover:underline font-semibold cursor-pointer"
              >
                Skapa ett här
              </button>
            </p>
          ) : (
            <p>
              Har du redan ett konto?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-[#E9A23B] hover:underline font-semibold cursor-pointer"
              >
                Logga in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
