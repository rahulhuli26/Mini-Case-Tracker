import bcrypt from 'bcryptjs';
import User from '../models/User.js';

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

  const agentCount = await User.countDocuments({ role: 'Agent' });
  if (agentCount === 0) {
    const agentHash = await bcrypt.hash('Agent123!', 10);
    await User.create({
      name: 'Alex Agent',
      email: 'agent@caseflow.test',
      password: agentHash,
      role: 'Agent'
    });
  }
};
