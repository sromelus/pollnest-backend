import { IMigrationOperation } from '../migrationRunner';
import { addUserIpToUsers } from './001_add_user_ip_to_users';
import { addCategoryAndSlugToPolls } from './002_add_category_and_slug_to_polls';
import { fixMissingCategoryField } from './003_fix_missing_category_field';

export const migrations: IMigrationOperation[] = [
  addUserIpToUsers,
  addCategoryAndSlugToPolls,
  fixMissingCategoryField,
  // Add future migrations here
];