export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface User {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  avatarColor?: string;
  team?: string;
  role?: string;
}

export interface Post {
  _id: string;
  content: string;
  author: User;
  authorName: string;
  authorEmail: string;
  taggedUsers?: User[];
  team?: string;
  color: StickyColor;
  likesCount: number;
  readsCount?: number;
  hasLiked?: boolean;
  userEmoji?: string | null;
  reactions?: Record<string, number>;
  reportsCount?: number;
  createdAt: string;
}

export interface PostReactionUser {
  _id: string;
  emoji: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarColor?: string;
    team?: string;
  };
}

export interface PostReader {
  _id: string;
  readAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarColor?: string;
    team?: string;
  };
}

export interface NotificationItem {
  id: string;
  type?: 'NEW_POST' | 'TAGGED' | 'LIKED' | 'SYSTEM';
  variant?: 'success' | 'error' | 'info';
  senderName?: string;
  message: string;
  postId?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface TopAppreciatedMember {
  rank: number;
  user: {
    _id?: string;
    fullName: string;
    email: string;
    avatarColor?: string;
    team?: string;
  };
  tagsCount: number;
  likesCount: number;
  score: number;
}
