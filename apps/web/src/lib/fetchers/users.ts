import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getLoggedInUser() {
  const sessionUser = (await auth.api.getSession({ headers: await headers() }))
    ?.user;
  if (!sessionUser) {
    return null;
  }
  return sessionUser;
}
