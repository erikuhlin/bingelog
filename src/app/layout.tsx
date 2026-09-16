import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Bingelog - Håll koll på filmer och serier',
  description: 'Din personliga watchlist och avsnitts-tracker för film och tv-serier.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="dark">
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-rose-600 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
            {children}
          </main>
          <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} Bingelog. Data och bilder från TMDb.</p>
              <p className="text-zinc-500">
                Byggd med Next.js, Tailwind CSS & Supabase
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
