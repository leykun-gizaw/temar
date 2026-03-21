import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';
import { BetterAuthProvider } from '@/components/providers/AuthProvider';
import { Manrope, Lora } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata = {
  title: 'Temar',
  description: 'Your space for deep cognition.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`h-full ${manrope.variable} ${lora.variable}`}>
        <BetterAuthProvider>
          <ThemeProvider attribute="class" disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </BetterAuthProvider>
      </body>
    </html>
  );
}
