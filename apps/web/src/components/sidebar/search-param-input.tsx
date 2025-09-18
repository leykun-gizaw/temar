'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SidebarInput } from '@/components/ui/sidebar';

export function SearchParamInput({ placeholder }: { placeholder?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [value, setValue] = React.useState(searchParams.get('query') ?? '');

  React.useEffect(() => {
    setValue(searchParams.get('query') ?? '');
  }, [searchParams]);

  function handleChange(next: string) {
    setValue(next);
    const params = new URLSearchParams(searchParams);
    next ? params.set('query', next) : params.delete('query');
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <SidebarInput
      placeholder={placeholder ?? 'Type to search...'}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        handleChange(e.target.value)
      }
    />
  );
}
