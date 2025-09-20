import * as React from 'react';
import Link from 'next/link';
import Logo from '@/assets/logo';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border bg-background/60 p-8 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <Link
          href="/"
          aria-label="Temar home"
          className="inline-flex items-center gap-2"
        >
          <Logo size={40} />
          <span className="font-bold text-xl">Temar</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div>{children}</div>
      {footer && (
        <div className="pt-2 text-center text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

export default AuthCard;
