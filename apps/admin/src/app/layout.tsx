import './globals.css';
import { Toaster } from '@/components/ui/sonner';

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
    <html lang="en">
      <body className="h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
