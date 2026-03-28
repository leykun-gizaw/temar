import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';
import { BetterAuthProvider } from '@/components/providers/AuthProvider';
import {
  Manrope,
  Lora,
  Merriweather,
  Inter,
  Crimson_Text,
  Literata,
  Source_Serif_4,
} from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-crimson',
  display: 'swap',
});

const literata = Literata({
  subsets: ['latin'],
  variable: '--font-literata',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
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
      <body
        className={`h-full ${manrope.variable} ${lora.variable} ${merriweather.variable} ${inter.variable} ${crimsonText.variable} ${literata.variable} ${sourceSerif4.variable}`}
      >
        <BetterAuthProvider>
          <ThemeProvider attribute="class" disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </BetterAuthProvider>
      </body>
    </html>
  );
}
