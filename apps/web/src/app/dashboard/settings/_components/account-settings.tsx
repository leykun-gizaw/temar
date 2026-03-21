'use client';

import {
  AccountSettingsCards,
  SecuritySettingsCards,
} from '@daveyplate/better-auth-ui';

const settingsCardClassNames = {
  cards: 'space-y-8',
  card: {
    base: 'bg-muted/40 rounded-[2rem] shadow-md border-none p-8',
    header: 'pb-2',
    title: 'text-xl font-bold',
    description: 'text-sm text-muted-foreground',
    content: 'pt-4',
    footer: 'pt-4',
    input: 'rounded-xl bg-background/60 border-none',
    primaryButton:
      'rounded-full px-6 shadow-lg shadow-primary/25',
    secondaryButton: 'rounded-full px-6',
    outlineButton: 'rounded-full px-6',
    destructiveButton: 'rounded-full px-6',
  },
};

export function AccountSettings() {
  return <AccountSettingsCards classNames={settingsCardClassNames} />;
}

export function SecuritySettings() {
  return <SecuritySettingsCards classNames={settingsCardClassNames} />;
}
