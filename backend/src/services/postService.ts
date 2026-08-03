import { Post, StickyColor } from '../models/Post';
import { Like } from '../models/Like';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { cleanInput } from '../utils/sanitizer';
import { broadcastNewPost, sendNotificationToUser, broadcastLikeUpdate } from '../config/socket';

export interface CreatePostDTO {
  content: string;
  taggedUserIds?: string[];
  color?: StickyColor;
}

export const createPost = async (dto: CreatePostDTO, authorUserId: string) => {
  if (!authorUserId) {
    throw { statusCode: 401, message: 'You must be logged in to post gratitude' };
  }

  const sanitizedContent = cleanInput(dto.content);
  if (!sanitizedContent) {
    throw { statusCode: 400, message: 'Post content cannot be empty' };
  }

  const authorUser = await User.findById(authorUserId).select('fullName employeeCode team');
  if (!authorUser) {
    throw { statusCode: 404, message: 'Author user account not found' };
  }

  // Validate tagged user IDs
  const validTaggedUserIds: string[] = [];
  if (dto.taggedUserIds && dto.taggedUserIds.length > 0) {
    const users = await User.find({ _id: { $in: dto.taggedUserIds } }).select('_id employeeCode fullName');
    users.forEach((u) => validTaggedUserIds.push(u._id.toString()));
  }

  const newPost = await Post.create({
    content: sanitizedContent,
    author: authorUser._id,
    authorName: authorUser.fullName,
    authorEmployeeCode: authorUser.employeeCode,
    taggedUsers: validTaggedUserIds,
    team: authorUser.team || 'Engineering',
    color: dto.color || 'yellow',
  });

  const populatedPost = await Post.findById(newPost._id)
    .populate('taggedUsers', 'employeeCode fullName avatarColor team')
    .lean();

  // 1. Real-time post broadcast to all clients on global wall
  broadcastNewPost(populatedPost);

  // 2. Send targeted notification ONLY to tagged users
  for (const taggedUserId of validTaggedUserIds) {
    if (taggedUserId !== authorUserId) {
      const notif = await Notification.create({
        recipientId: taggedUserId,
        senderId: authorUser._id,
        senderName: 'Someone',
        postId: newPost._id,
        type: 'TAGGED',
        message: 'You were tagged in a new gratitude note!',
      });

      sendNotificationToUser(taggedUserId, {
        id: notif._id,
        type: 'TAGGED',
        senderName: 'Gratitude Wall',
        message: 'You were tagged in a new gratitude note!',
        postId: newPost._id,
        createdAt: notif.createdAt,
      });
    }
  }

  return populatedPost;
};

export const getWallPosts = async (params: {
  color?: string;
  team?: string;
  taggedUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
  currentUserId?: string;
}) => {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 30;
  const skip = (page - 1) * limit;

  const query: any = { isQuarantined: false };

  if (params.color && ['yellow', 'green', 'blue', 'pink', 'purple'].includes(params.color)) {
    query.color = params.color;
  }

  if (params.team && params.team !== 'all') {
    query.team = params.team;
  }

  if (params.taggedUserId) {
    query.taggedUsers = params.taggedUserId;
  }

  if (params.search) {
    const cleanSearch = cleanInput(params.search);
    query.$or = [
      { content: { $regex: cleanSearch, $options: 'i' } },
      { authorName: { $regex: cleanSearch, $options: 'i' } },
      { authorEmployeeCode: { $regex: cleanSearch, $options: 'i' } },
    ];
  }

  const [rawPosts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('taggedUsers', 'employeeCode fullName avatarColor team')
      .lean(),
    Post.countDocuments(query),
  ]);

  let likedPostIdsSet = new Set<string>();
  if (params.currentUserId && rawPosts.length > 0) {
    const postIds = rawPosts.map((p) => p._id);
    const userLikes = await Like.find({ userId: params.currentUserId, postId: { $in: postIds } })
      .select('postId')
      .lean();
    userLikes.forEach((l) => likedPostIdsSet.add(l.postId.toString()));
  }

  const posts = rawPosts.map((p) => ({
    ...p,
    hasLiked: likedPostIdsSet.has(p._id.toString()),
  }));

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const toggleLikePost = async (postId: string, userId: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  const existingLike = await Like.findOne({ postId, userId });

  let hasLiked = false;
  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();
  } else {
    await Like.create({ postId, userId });
    post.likesCount += 1;
    await post.save();
    hasLiked = true;

    // Send notification to post author if not self-like
    if (post.author && post.author.toString() !== userId) {
      const notif = await Notification.create({
        recipientId: post.author,
        senderId: userId,
        senderName: 'Someone',
        postId: post._id,
        type: 'LIKED',
        message: 'Someone liked your gratitude note!',
      });

      sendNotificationToUser(post.author.toString(), {
        id: notif._id,
        type: 'LIKED',
        senderName: 'Gratitude Wall',
        message: 'Someone liked your gratitude note!',
        postId: post._id,
        createdAt: notif.createdAt,
      });
    }
  }

  // Realtime Socket broadcast for updated like count
  broadcastLikeUpdate(postId, post.likesCount);

  return { postId, likesCount: post.likesCount, hasLiked };
};

export const reportPost = async (postId: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  post.reportsCount += 1;
  if (post.reportsCount >= 5) {
    post.isQuarantined = true;
  }
  await post.save();

  return { message: 'Post reported successfully for moderation' };
};
