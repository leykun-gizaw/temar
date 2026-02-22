'use client';

import type { TComment } from '@/components/ui/comment';

import { createPlatePlugin } from 'platejs/react';

export type TDiscussion = {
  id: string;
  comments: TComment[];
  createdAt: Date;
  isResolved: boolean;
  userId: string;
  documentContent?: string;
};

export type UserInfo = {
  id: string;
  name: string;
  avatarUrl?: string;
  hue?: number;
};

const usersData: Record<string, UserInfo> = {
  'user-1': {
    id: 'user-1',
    name: 'Me',
  },
};

export const discussionPlugin = createPlatePlugin({
  key: 'discussion',
  options: {
    currentUserId: 'user-1',
    discussions: [] as TDiscussion[],
    users: usersData as Record<string, UserInfo>,
  },
}).extendSelectors(({ getOption }) => ({
  currentUser: () => getOption('users')[getOption('currentUserId')],
  user: (id: string) => getOption('users')[id],
}));

export const DiscussionKit = [discussionPlugin];
