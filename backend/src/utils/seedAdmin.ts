import bcrypt from 'bcryptjs';
import { User } from '../models/User';

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

    const existingAdmin = await User.findOne({ email: adminCode });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(adminPassword || 'Brototype@321', salt);

      await User.create({
        email: adminCode,
        fullName: 'Brototype Admin',
        passwordHash,
        avatarColor: '#0058bd',
        team: '',
        role: 'ADMIN',
      });
      console.log('✅ [Admin Seed] Created default admin account: admin@brototype.com');
    }
  } catch (error) {
    console.error('⚠️ [Admin Seed] Error seeding admin:', error);
  }
};
