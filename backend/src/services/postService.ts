import mongoose from 'mongoose';
import { Post, StickyColor } from '../models/Post';
import { Reaction } from '../models/Reaction';
import { PostRead } from '../models/PostRead';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { cleanInput } from '../utils/sanitizer';
import {
  broadcastNewPost,
  sendNotificationToUser,
  getIO,
  broadcastPostUpdate,
  broadcastPostDelete,
  broadcastNotificationToLoggedUsers,
} from '../config/socket';
import { sendWebPushNotification, broadcastWebPushNotification } from './notificationService';

export interface CreatePostDTO {
  content: string;
  taggedUserIds?: string[];
  taggedTeam?: string;   // newly supported: tag a whole team
  color?: StickyColor;
}

export const createPost = async (dto: CreatePostDTO, authorUserId: string) => {
  if (!authorUserId) {
    throw { statusCode: 401, message: 'You must be logged in to post gratitude' };
  }

  const sanitizedContent = cleanInput(dto.content);
  if (!sanitizedContent || sanitizedContent.trim().length < 4) {
    throw { statusCode: 400, message: 'Gratitude message must be at least 4 characters' };
  }

  const authorUser = await User.findById(authorUserId).select('fullName email team');
  if (!authorUser) {
    throw { statusCode: 404, message: 'Author user account not found' };
  }

  // Validate tagged user IDs (exclude Admins)
  const validTaggedUserIds: string[] = [];
  if (dto.taggedUserIds && dto.taggedUserIds.length > 0) {
    const users = await User.find({ _id: { $in: dto.taggedUserIds }, role: { $ne: 'ADMIN' } }).select('_id email fullName');
    users.forEach((u) => validTaggedUserIds.push(u._id.toString()));
  }

  const newPost = await Post.create({
    content: sanitizedContent,
    author: authorUser._id,
    authorName: authorUser.fullName,
    authorEmail: authorUser.email,
    taggedUsers: validTaggedUserIds,
    team: dto.taggedTeam?.trim() || authorUser.team || 'General',
    color: dto.color || 'yellow',
  });

  const populatedPost = await Post.findById(newPost._id)
    .populate('taggedUsers', 'email fullName avatarColor team')
    .lean();

  // 1. Real-time post broadcast to all clients on global wall
  broadcastNewPost(populatedPost);

  // 2. Broadcast announcement notification to ALL users
  try {
    const taggedList = populatedPost?.taggedUsers && (populatedPost.taggedUsers as any[]).length > 0
      ? (populatedPost.taggedUsers as any[]).map((u: any) => `@${u.fullName}`).join(', ')
      : '';

    const notifMessage = `A new gratitude post is posted.`;

    const notifType = taggedList ? 'TAGGED' : 'NEW_POST';

    const postAnnouncementNotif = await Notification.create({
      recipientId: null,
      senderId: authorUser._id,
      senderName: authorUser.fullName,
      postId: newPost._id,
      type: notifType,
      message: notifMessage,
    });

    broadcastNotificationToLoggedUsers({
      id: postAnnouncementNotif._id.toString(),
      type: notifType,
      senderName: authorUser.fullName,
      message: notifMessage,
      postId: newPost._id.toString(),
      createdAt: postAnnouncementNotif.createdAt.toISOString(),
    });
    
    // Web Push for offline users
    broadcastWebPushNotification({
      title: 'New Gratitude Post!',
      body: notifMessage,
      icon: '/vite.svg'
    });

    // 3. Send targeted @mention notifications to each tagged user
    if (validTaggedUserIds.length > 0) {
      for (const taggedUserId of validTaggedUserIds) {
        if (taggedUserId === authorUserId) continue; // Don't notify self
        try {
          const mentionNotif = await Notification.create({
            recipientId: taggedUserId,
            senderId: authorUser._id,
            senderName: authorUser.fullName,
            postId: newPost._id,
            type: 'TAGGED',
            message: `You were tagged in a new gratitude post!`,
          });
          
          sendNotificationToUser(taggedUserId, {
            id: mentionNotif._id.toString(),
            type: 'TAGGED',
            senderName: authorUser.fullName,
            message: `You were tagged in a new gratitude post!`,
            postId: newPost._id.toString(),
            createdAt: mentionNotif.createdAt.toISOString(),
          });
          
          sendWebPushNotification(taggedUserId, {
            title: 'New Tag!',
            body: `You were tagged in a new gratitude post!`,
            icon: '/vite.svg'
          });
        } catch (err) {
          // Silence individual tag notification error
        }
      }
    }
  } catch {
    // Silence notification error
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

  if (params.taggedUserId && mongoose.Types.ObjectId.isValid(params.taggedUserId)) {
    query.taggedUsers = { $in: [params.taggedUserId] };
  }

  if (params.search) {
    const cleanSearch = cleanInput(params.search);

    // Look up any users matching the search term to match against taggedUsers
    const matchedUsers = await User.find({
      $or: [
        { fullName: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();

    const matchedUserIds = matchedUsers.map((u: any) => u._id);

    const searchConditions: any[] = [
      { content: { $regex: cleanSearch, $options: 'i' } },
      { authorName: { $regex: cleanSearch, $options: 'i' } },
      { authorEmail: { $regex: cleanSearch, $options: 'i' } },
    ];

    if (matchedUserIds.length > 0) {
      searchConditions.push({ taggedUsers: { $in: matchedUserIds } });
    }

    query.$or = searchConditions;
  }

  const [rawPosts, total] = await Promise.all([
    Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('taggedUsers', 'email fullName avatarColor team')
      .lean(),
    Post.countDocuments(query),
  ]);

  if (rawPosts.length === 0) {
    return { posts: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  const postObjectIds = rawPosts.map((p) => new mongoose.Types.ObjectId(p._id.toString()));

  // Fetch reactions summary per post
  const allReactions = await Reaction.aggregate([
    { $match: { postId: { $in: postObjectIds } } },
    {
      $group: {
        _id: { postId: '$postId', emoji: '$emoji' },
        count: { $sum: 1 },
      },
    },
  ]);

  let userReactionsMap = new Map<string, string>();
  if (params.currentUserId) {
    const myReactions = await Reaction.find({
      userId: new mongoose.Types.ObjectId(params.currentUserId),
      postId: { $in: postObjectIds },
    }).lean();
    myReactions.forEach((r) => userReactionsMap.set(r.postId.toString(), r.emoji));
  }

  // Build reaction map per post
  const reactionMap = new Map<string, Record<string, number>>();
  allReactions.forEach((r) => {
    const pId = r._id.postId.toString();
    const emoji = r._id.emoji;
    if (!reactionMap.has(pId)) {
      reactionMap.set(pId, {});
    }
    reactionMap.get(pId)![emoji] = r.count;
  });

  // Fetch unique readers per post (from both PostRead and Reaction)
  const [allReads, allReactionsUsers] = await Promise.all([
    PostRead.find({ postId: { $in: postObjectIds } }).select('postId userId').lean(),
    Reaction.find({ postId: { $in: postObjectIds } }).select('postId userId').lean(),
  ]);

  const uniqueReadersMap = new Map<string, Set<string>>();
  allReads.forEach((r: any) => {
    const pId = r.postId.toString();
    if (!uniqueReadersMap.has(pId)) uniqueReadersMap.set(pId, new Set());
    if (r.userId) uniqueReadersMap.get(pId)!.add(r.userId.toString());
  });
  allReactionsUsers.forEach((rx: any) => {
    const pId = rx.postId.toString();
    if (!uniqueReadersMap.has(pId)) uniqueReadersMap.set(pId, new Set());
    if (rx.userId) uniqueReadersMap.get(pId)!.add(rx.userId.toString());
  });

  const posts = rawPosts.map((p) => {
    const pId = p._id.toString();
    const reactions = reactionMap.get(pId) || {};
    const userEmoji = userReactionsMap.get(pId) || null;

    const totalLikes = Object.values(reactions).reduce((sum, val) => sum + val, 0);

    return {
      ...p,
      likesCount: totalLikes || p.likesCount || 0,
      readsCount: uniqueReadersMap.get(pId)?.size || 0,
      reactions,
      userEmoji,
      hasLiked: !!userEmoji,
    };
  });

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

export const toggleEmojiReaction = async (postId: string, userId: string, targetEmoji: string = '❤️') => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  const pObjId = new mongoose.Types.ObjectId(postId);
  const uObjId = new mongoose.Types.ObjectId(userId);

  // STRICT SINGLE REACTION PER USER ENFORCEMENT: Delete any existing reaction by this user on this post
  const existingReaction = await Reaction.findOne({ postId: pObjId, userId: uObjId });

  let newActiveEmoji: string | null = null;

  if (existingReaction) {
    if (existingReaction.emoji === targetEmoji) {
      // Toggle off if same emoji clicked again
      await Reaction.deleteOne({ _id: existingReaction._id });
      newActiveEmoji = null;
    } else {
      // Switch reaction emoji to new selection
      existingReaction.emoji = targetEmoji;
      await existingReaction.save();
      newActiveEmoji = targetEmoji;
    }
  } else {
    // Add single reaction
    await Reaction.create({ postId: pObjId, userId: uObjId, emoji: targetEmoji });
    newActiveEmoji = targetEmoji;
  }

  // Aggregate updated reactions for this post
  const updatedReactions = await Reaction.aggregate([
    { $match: { postId: pObjId } },
    {
      $group: {
        _id: '$emoji',
        count: { $sum: 1 },
      },
    },
  ]);

  const reactionSummary: Record<string, number> = {};
  let totalCount = 0;
  updatedReactions.forEach((r) => {
    reactionSummary[r._id] = r.count;
    totalCount += r.count;
  });

  post.likesCount = totalCount;
  await post.save();

  // Broadcast real-time reaction update via Socket.io
  try {
    const io = getIO();
    const userWhoReacted = await User.findById(userId).select('fullName email avatarColor team');
    io.emit('reaction_update', {
      postId,
      reactions: reactionSummary,
      likesCount: totalCount,
      userReaction: userWhoReacted
        ? {
            userId: userId,
            emoji: newActiveEmoji,
            user: {
              id: userWhoReacted._id.toString(),
              fullName: userWhoReacted.fullName,
              email: userWhoReacted.email,
              avatarColor: userWhoReacted.avatarColor,
              team: userWhoReacted.team,
            },
            createdAt: new Date().toISOString(),
          }
        : null,
    });

    // Ensure reacting to a post also registers the user as a reader in real time
    if (newActiveEmoji) {
      const now = new Date();
      const readResult = await PostRead.findOneAndUpdate(
        { postId: pObjId, userId: uObjId },
        { $setOnInsert: { readAt: now } },
        { upsert: true, new: true }
      );
      const readsCount = await PostRead.countDocuments({ postId: pObjId });
      if (io) {
        io.emit('reads_update', { postId, readsCount });
        if (userWhoReacted) {
          io.emit('new_read', {
            postId,
            readsCount,
            reader: {
              _id: readResult?._id ? readResult._id.toString() : `${postId}-${userId}`,
              readAt: now.toISOString(),
              user: {
                id: userWhoReacted._id.toString(),
                fullName: userWhoReacted.fullName,
                email: userWhoReacted.email,
                avatarColor: userWhoReacted.avatarColor,
                team: userWhoReacted.team,
              },
            },
          });
        }
      }
    }
  } catch {
    // Silence socket error
  }

  // Send smart aggregated notification ONLY to post author (prevents notification spam when 1000s like)
  const authorIdStr = post.author.toString();
  if (newActiveEmoji && authorIdStr !== userId) {
    try {
      const likerUser = await User.findById(userId).select('fullName');
      const likerName = likerUser?.fullName || 'Someone';

      // Check if an unread LIKED notification for this post already exists for the author
      const existingNotif = await Notification.findOne({
        recipientId: post.author,
        postId: pObjId,
        type: 'LIKED',
        isRead: false,
      });

      if (existingNotif) {
        // Aggregate like count (e.g. "Gokul K and 999 others liked your gratitude note!")
        const otherLikesCount = Math.max(1, totalCount - 1);
        const aggMessage =
          otherLikesCount === 1
            ? `${likerName} and 1 other liked your gratitude note!`
            : `${likerName} and ${otherLikesCount} others liked your gratitude note!`;

        existingNotif.message = aggMessage;
        existingNotif.senderName = likerName;
        existingNotif.createdAt = new Date();
        await existingNotif.save();

        sendNotificationToUser(authorIdStr, {
          id: existingNotif._id.toString(),
          type: 'LIKED',
          senderName: likerName,
          message: aggMessage,
          postId: postId,
          createdAt: existingNotif.createdAt.toISOString(),
        });
      } else {
        // Create initial targeted notification for author
        const likeNotif = await Notification.create({
          recipientId: post.author,
          senderId: uObjId,
          senderName: likerName,
          postId: pObjId,
          type: 'LIKED',
          message: `${likerName} liked your gratitude note!`,
        });

        sendNotificationToUser(authorIdStr, {
          id: likeNotif._id.toString(),
          type: 'LIKED',
          senderName: likerName,
          message: `${likerName} liked your gratitude note!`,
          postId: postId,
          createdAt: likeNotif.createdAt.toISOString(),
        });

        sendWebPushNotification(post.author.toString(), {
          title: 'New Like on your Note!',
          body: `${likerName} liked your gratitude note!`,
          icon: '/vite.svg'
        });
      }
    } catch {
      // Silence notification error
    }
  }

  return {
    postId,
    reactions: reactionSummary,
    likesCount: totalCount,
    userEmoji: newActiveEmoji,
    hasLiked: !!newActiveEmoji,
  };
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

export const updatePost = async (
  postId: string,
  userId: string,
  updateData: { content?: string; color?: StickyColor; taggedUserIds?: string[] },
  userRole?: string
) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  const isAuthor = post.author.toString() === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    throw { statusCode: 403, message: 'You can only edit your own posts' };
  }

  // Check if within 10 minutes (unless admin)
  const postAgeMs = Date.now() - new Date(post.createdAt).getTime();
  const tenMinutesMs = 10 * 60 * 1000;
  if (!isAdmin && postAgeMs > tenMinutesMs) {
    throw { statusCode: 403, message: 'You can only edit posts within 10 minutes of creation' };
  }

  if (updateData.content) {
    const sanitizedContent = cleanInput(updateData.content);
    if (!sanitizedContent || sanitizedContent.trim().length < 4) {
      throw { statusCode: 400, message: 'Gratitude message must be at least 4 characters' };
    }
    post.content = sanitizedContent;
  }

  if (updateData.color) {
    post.color = updateData.color;
  }

  if (updateData.taggedUserIds !== undefined) {
    const validTaggedUserIds: string[] = [];
    if (updateData.taggedUserIds.length > 0) {
      const users = await User.find({ _id: { $in: updateData.taggedUserIds }, role: { $ne: 'ADMIN' } }).select('_id');
      users.forEach((u) => validTaggedUserIds.push(u._id.toString()));
    }
    post.taggedUsers = validTaggedUserIds as any;
  }

  await post.save();

  const updatedPost = await Post.findById(postId)
    .populate('taggedUsers', 'email fullName avatarColor team')
    .lean();

  // Broadcast post update to all clients
  broadcastPostUpdate(updatedPost);

  // Broadcast announcement notification to ALL users
  try {
    const authorName = (updatedPost as any)?.authorName || (updatedPost as any)?.author?.fullName || 'A user';
    const updateNotif = await Notification.create({
      recipientId: null,
      senderId: post.author,
      senderName: authorName,
      postId: post._id,
      type: 'SYSTEM',
      message: `${authorName} updated a gratitude note!`,
    });

    broadcastNotificationToLoggedUsers({
      id: updateNotif._id.toString(),
      type: 'SYSTEM',
      senderName: authorName,
      message: `${authorName} updated a gratitude note!`,
      postId: post._id.toString(),
      createdAt: updateNotif.createdAt.toISOString(),
    });
  } catch {
    // Silence notification error
  }

  return updatedPost;
};

export const deletePost = async (postId: string, userId: string, userRole?: string) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  const isAuthor = post.author.toString() === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    throw { statusCode: 403, message: 'You can only delete your own posts' };
  }

  // Check if within 10 minutes (unless admin)
  const postAgeMs = Date.now() - new Date(post.createdAt).getTime();
  const tenMinutesMs = 10 * 60 * 1000;
  if (!isAdmin && postAgeMs > tenMinutesMs) {
    throw { statusCode: 403, message: 'You can only delete posts within 10 minutes of creation' };
  }

  await Post.findByIdAndDelete(postId);
  await Reaction.deleteMany({ postId });
  await PostRead.deleteMany({ postId });
  await Notification.deleteMany({ postId });

  // Broadcast post deletion to all clients
  broadcastPostDelete(postId);

  return { message: 'Post deleted successfully' };
};

export const getPostReactions = async (postId: string) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw { statusCode: 400, message: 'Invalid post ID' };
  }
  const reactions = await Reaction.find({ postId: new mongoose.Types.ObjectId(postId) })
    .populate('userId', 'fullName email avatarColor team')
    .sort({ createdAt: -1 })
    .lean();

  return reactions
    .map((r: any) => ({
      _id: r._id,
      emoji: r.emoji,
      createdAt: r.createdAt,
      user: r.userId
        ? {
            id: r.userId._id,
            fullName: r.userId.fullName,
            email: r.userId.email,
            avatarColor: r.userId.avatarColor,
            team: r.userId.team,
          }
        : null,
    }))
    .filter((r: any) => r.user !== null);
};

export const markPostAsRead = async (postId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw { statusCode: 400, message: 'Invalid post ID' };
  }
  const pObjId = new mongoose.Types.ObjectId(postId);
  const uObjId = new mongoose.Types.ObjectId(userId);

  const post = await Post.findById(pObjId).select('_id');
  if (!post) {
    throw { statusCode: 404, message: 'Post not found' };
  }

  const now = new Date();
  const result = await PostRead.findOneAndUpdate(
    { postId: pObjId, userId: uObjId },
    { $setOnInsert: { readAt: now } },
    { upsert: true, new: true }
  );

  const readsCount = await PostRead.countDocuments({ postId: pObjId });

  // Broadcast real-time read count & reader details update
  try {
    const io = getIO();
    if (io) {
      const readerUser = await User.findById(userId).select('fullName email avatarColor team');
      io.emit('reads_update', { postId, readsCount });
      if (readerUser) {
        io.emit('new_read', {
          postId,
          readsCount,
          reader: {
            _id: result._id.toString(),
            readAt: now.toISOString(),
            user: {
              id: readerUser._id.toString(),
              fullName: readerUser.fullName,
              email: readerUser.email,
              avatarColor: readerUser.avatarColor,
              team: readerUser.team,
            },
          },
        });
      }
    }
  } catch {
    // Silence socket error
  }

  return { success: true, readsCount, readAt: result.readAt };
};

export const markPostsAsBatchRead = async (postIds: string[], userId: string) => {
  if (!Array.isArray(postIds) || postIds.length === 0 || !userId) {
    return { success: true, count: 0 };
  }

  const validPostIds = postIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (validPostIds.length === 0) {
    return { success: true, count: 0 };
  }

  const uObjId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Find which ones are already marked read for this user
  const existingReads = await PostRead.find({
    postId: { $in: validPostIds },
    userId: uObjId,
  }).select('postId');

  const existingPostIdSet = new Set(existingReads.map((r) => r.postId.toString()));
  const newPostIdsToRead = validPostIds.filter((pId) => !existingPostIdSet.has(pId.toString()));

  if (newPostIdsToRead.length > 0) {
    const bulkOps = newPostIdsToRead.map((pId) => ({
      updateOne: {
        filter: { postId: pId, userId: uObjId },
        update: { $setOnInsert: { readAt: now } },
        upsert: true,
      },
    }));

    await PostRead.bulkWrite(bulkOps);

    // Compute updated counts and broadcast real-time updates for newly read posts
    const updatedCounts = await PostRead.aggregate([
      { $match: { postId: { $in: newPostIdsToRead } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ]);

    const io = getIO();
    if (io) {
      const readerUser = await User.findById(userId).select('fullName email avatarColor team');
      const readerObj = readerUser
        ? {
            id: readerUser._id.toString(),
            fullName: readerUser.fullName,
            email: readerUser.email,
            avatarColor: readerUser.avatarColor,
            team: readerUser.team,
          }
        : null;

      updatedCounts.forEach((c) => {
        const pIdStr = c._id.toString();
        io.emit('reads_update', { postId: pIdStr, readsCount: c.count });
        if (readerObj) {
          io.emit('new_read', {
            postId: pIdStr,
            readsCount: c.count,
            reader: {
              _id: `${pIdStr}-${userId}`,
              readAt: now.toISOString(),
              user: readerObj,
            },
          });
        }
      });
    }
  }

  return { success: true, count: newPostIdsToRead.length };
};

export const getPostReads = async (postId: string) => {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw { statusCode: 400, message: 'Invalid post ID' };
  }
  const pObjId = new mongoose.Types.ObjectId(postId);

  // 1. Fetch direct reads
  const reads = await PostRead.find({ postId: pObjId })
    .populate('userId', 'fullName email avatarColor team')
    .sort({ readAt: -1 })
    .lean();

  // 2. Fetch reactions (anyone who liked the post has definitely read it)
  const reactions = await Reaction.find({ postId: pObjId })
    .populate('userId', 'fullName email avatarColor team')
    .sort({ createdAt: -1 })
    .lean();

  // Deduplicated map by user ID
  const readerMap = new Map<string, any>();

  // Add recorded reads
  reads.forEach((r: any) => {
    if (r.userId && r.userId._id) {
      const uId = r.userId._id.toString();
      readerMap.set(uId, {
        _id: r._id,
        readAt: r.readAt || r.createdAt,
        user: {
          id: r.userId._id,
          fullName: r.userId.fullName,
          email: r.userId.email,
          avatarColor: r.userId.avatarColor,
          team: r.userId.team,
        },
      });
    }
  });

  // Add likers if not already present
  reactions.forEach((rx: any) => {
    if (rx.userId && rx.userId._id) {
      const uId = rx.userId._id.toString();
      if (!readerMap.has(uId)) {
        readerMap.set(uId, {
          _id: rx._id,
          readAt: rx.createdAt,
          user: {
            id: rx.userId._id,
            fullName: rx.userId.fullName,
            email: rx.userId.email,
            avatarColor: rx.userId.avatarColor,
            team: rx.userId.team,
          },
        });
      }
    }
  });

  const formattedReaders = Array.from(readerMap.values()).sort(
    (a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
  );

  return {
    readsCount: formattedReaders.length,
    readers: formattedReaders,
  };
};
