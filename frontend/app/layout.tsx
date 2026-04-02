import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'FeedPulse — AI-Powered Feedback Platform',
  description: 'Collect and analyse product feedback with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable} font-outfit`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#13131a',
              color: '#e2e8f0',
              borderRadius: '12px',
              fontSize: '13px',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'var(--font-outfit)',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}