import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata = {
  title: 'Temar Admin',
  description: 'AI Pricing Administration Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`h-full ${manrope.variable}`}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
