export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface User {
  id: string;
  fullName: string;
  employeeCode: string;
  avatarColor?: string;
  role?: string;
}

export interface Post {
  _id: string;
  content: string;
  author: User;
  authorName: string;
  authorEmployeeCode: string;
  taggedUsers?: User[];
  color: StickyColor;
  likesCount: number;
  hasLiked?: boolean;
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
