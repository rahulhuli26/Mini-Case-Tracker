import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Ensures at least one `Manager` and one `Agent` account exist, creating
 * default seeded accounts (with known credentials, for local/dev use) when
 * a role has no users yet. Safe to call on every server startup.
 *
 * @returns {Promise<void>}
 */
export const seedUsers = async () => {
  const managerCount = await User.countDocuments({ role: 'Manager' });
  if (managerCount === 0) {
    const managerHash = await bcrypt.hash('Manager123!', 10);
    await User.create({
      name: 'Sara Manager',
      email: 'manager@caseflow.test',
      password: managerHash,
      role: 'Manager'
    });
  }

  const agents = [
    { name: 'Alex Agent', email: 'agent@caseflow.test', password: 'Agent123!' },
    { name: 'Jordan Agent', email: 'agent2@caseflow.test', password: 'Agent123!' }
  ];

  for (const agent of agents) {
    const exists = await User.exists({ email: agent.email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(agent.password, 10);
      await User.create({ ...agent, password: passwordHash, role: 'Agent' });
    }
  }
};
