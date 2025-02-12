import { IMigrationOperation } from '../migrationRunner';
import { User } from '../../models';

export const addUserIpToUsers: IMigrationOperation = {
  name: '001_add_user_ip_to_users',

  up: async () => {
    const batchSize = 1000;
    let processed = 0;

    while (true) {
      const users = await User.find({ userIp: { $exists: false } })
        .limit(batchSize);

      if (users.length === 0) break;

      await Promise.all(users.map(user =>
        User.updateOne(
          { _id: user._id },
          { $set: { userIp: '' } }
        )
      ));

      processed += users.length;
      console.log(`Processed ${processed} users`);
    }
  },

  down: async () => {
    await User.updateMany(
      {},
      { $unset: { userIp: '' } }
    );
  }
};