'use client';

import { createPlatePlugin } from 'platejs/react';

import type { TComment } from '@/components/ui/comment';

export type TDiscussion = {
  id: string;
  comments: TComment[];
  createdAt: Date;
  isResolved: boolean;
  userId: string;
  documentContent?: string;
};

export type UserInfo = {
  name: string;
  avatarUrl?: string;
};

export const discussionPlugin = createPlatePlugin({
  key: 'discussion',
  options: {
    currentUser: { name: 'Me' } as UserInfo,
    currentUserId: 'user-1',
    discussions: [] as TDiscussion[],
    user: { name: 'Unknown' } as UserInfo,
  },
});

export const DiscussionKit = [discussionPlugin];
