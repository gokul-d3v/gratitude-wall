import bcrypt from 'bcryptjs';
import { User } from '../models/User';

export const seedInitialAdminAndTeams = async () => {
  try {
    // Seed Admin User only — teams are created by admin via the dashboard
    const adminCode = 'BROTOTYPE';
    const existingAdmin = await User.findOne({ employeeCode: adminCode });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('Brototype@321', salt);

      await User.create({
        employeeCode: adminCode,
        fullName: 'Brototype Admin',
        passwordHash,
        avatarColor: '#0058bd',
        team: '',
        role: 'ADMIN',
      });
      console.log('✅ [Admin Seed] Created default admin account: BROTOTYPE');
    }
  } catch (error) {
    console.error('⚠️ [Admin Seed] Error seeding admin:', error);
  }
};
