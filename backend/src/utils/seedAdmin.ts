import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Team } from '../models/Team';

export const seedInitialAdminAndTeams = async () => {
  try {
    // 1. Seed Default Teams
    const defaultTeams = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'HR', 'Support'];
    for (const teamName of defaultTeams) {
      await Team.updateOne(
        { name: teamName },
        { $setOnInsert: { name: teamName, description: `${teamName} Department` } },
        { upsert: true }
      );
    }

    // 2. Seed Admin User: username/employeeCode "brototype" password "Brototype@321"
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
        team: 'Engineering',
        role: 'ADMIN',
      });
      console.log('✅ [Admin Seed] Created default admin account: Brototype (Password: Brototype@321)');
    }
  } catch (error) {
    console.error('⚠️ [Admin Seed] Error seeding admin:', error);
  }
};
