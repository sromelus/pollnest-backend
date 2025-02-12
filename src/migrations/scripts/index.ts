import { IMigrationOperation } from '../migrationRunner';
import { addUserIpToUsers } from './001_add_user_ip_to_users';

export const migrations: IMigrationOperation[] = [
  addUserIpToUsers,
  // Add future migrations here
];