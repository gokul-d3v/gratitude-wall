export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface User {
  id: string;
  fullName: string;
  employeeCode: string;
  avatarColor?: string;
  team?: string;
  role?: string;
}

export interface Post {
  _id: string;
  content: string;
  author: User;
  authorName: string;
  authorEmployeeCode: string;
  taggedUsers?: User[];
  team?: string;
  color: StickyColor;
  likesCount: number;
  hasLiked?: boolean;
  userEmoji?: string | null;
  reactions?: Record<string, number>;
  reportsCount?: number;
  createdAt: string;
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
