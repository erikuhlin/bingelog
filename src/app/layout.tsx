import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Bingelog - Håll koll på filmer och serier',
  description: 'Din personliga watchlist och avsnitts-tracker för film och tv-serier.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-rose-600 selection:text-white w-full max-w-full overflow-x-hidden overflow-x-clip">
        <AuthProvider>
          <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden overflow-x-clip relative">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8 min-w-0 overflow-hidden">
              {children}
            </main>
            <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500 w-full overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p>© {new Date().getFullYear()} Bingelog. Data och bilder från TMDb.</p>
                <p className="text-zinc-500">
                  Byggd med Next.js, Tailwind CSS & Supabase
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
