import { IconBrandGoogleFilled } from '@tabler/icons-react';
import Link from 'next/link';
import * as React from 'react';

interface GoogleButtonProps {
  callbackPath?: string; // where to redirect after auth (encoded in query for now)
  intent?: 'signin' | 'register';
  className?: string;
  fullWidth?: boolean;
}

// Placeholder endpoint: replace `/api/auth/google` later with real Auth.js route or custom handler.
export function GoogleButton({
  callbackPath = '/',
  intent = 'signin',
  className = '',
  fullWidth = true,
}: GoogleButtonProps) {
  const href = `/api/auth/google?callback=${encodeURIComponent(
    callbackPath
  )}&intent=${intent}`;
  return (
    <Link
      href={href}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      aria-label={`Continue with Google (${intent})`}
    >
      <IconBrandGoogleFilled className="h-4 w-4 text-primary" />
      {/* <GoogleIcon className="h-4 w-4" /> */}
      <span>Continue with Google</span>
    </Link>
  );
}

export default GoogleButton;
