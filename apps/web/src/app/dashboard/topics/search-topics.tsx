'use client';

import { Input } from '@/components/ui/input';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function SearchInput({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { replace } = useRouter();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    term ? params.set('query', term) : params.delete('query');
    replace(`${pathName}?${params.toString()}`);
  }
  return (
    <Input
      type="text"
      placeholder={placeholder}
      className="border px-2 py-1"
      defaultValue={searchParams.get('query')?.toString()}
      onChange={(e) => handleSearch(e.target.value)}
    />
  );
}
