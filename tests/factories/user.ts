import { User, UserRole, IUser } from '../../src/models'

export const testUser = (options: Partial<IUser>): IUser => {
        const defaults = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'ValidPass123!',
            role: UserRole.User,
            referralPoints: 0,
            points: 0,
            voteCount: 0,
            referrerId: null
        }

        const mergedOptions = { ...defaults, ...options };

        const user = new User(mergedOptions);

        return user;
};