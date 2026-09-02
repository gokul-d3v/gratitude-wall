import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin';
import { Reaction } from '../models/Reaction';
import { PostRead } from '../models/PostRead';

export const seedInitialAdminAndTeams = async () => {
  try {
    const adminCode = 'admin@brototype.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD;

    if (!adminPassword) {
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️ [Admin Seed] Skipped: ADMIN_SEED_PASSWORD not set in production.');
        return;
      }
      console.log('⚠️ [Admin Seed] ADMIN_SEED_PASSWORD not set. Using default for development.');
    }

    const existingAdmin = await Admin.findOne({ email: adminCode });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(adminPassword || 'Brototype@321', salt);

      await Admin.create({
        email: adminCode,
        fullName: 'Brototype Admin',
        passwordHash,
        avatarColor: '#0058bd',
        role: 'ADMIN',
      });
      console.log('✅ [Admin Seed] Created default admin account: admin@brototype.com');
    }
  } catch (error) {
    console.error('⚠️ [Admin Seed] Error seeding admin:', error);
  }
};

export const syncHistoricalReactionsToReads = async () => {
  try {
    const reactions = await Reaction.find().select('postId userId createdAt').lean();
    if (reactions.length === 0) return;

    const bulkOps = reactions.map((r: any) => ({
      updateOne: {
        filter: { postId: r.postId, userId: r.userId },
        update: { $setOnInsert: { readAt: r.createdAt || new Date() } },
        upsert: true,
      },
    }));

    await PostRead.bulkWrite(bulkOps);
    console.log(`✅ [Read Sync] Synced ${reactions.length} historical reactions into PostRead records`);
  } catch (error) {
    console.error('⚠️ [Read Sync] Error syncing historical reactions:', error);
  }
};
