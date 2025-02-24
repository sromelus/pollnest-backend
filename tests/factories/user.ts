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
            referrerId: null,
            phone: (Math.floor(1000000000000000) + Math.floor(Math.random() * 9000000000000000)).toString(),
            verified: false,
            ip: '127.0.0.1',
            gender: 'male',
            ethnicity: 'white',
        }

        const mergedOptions = { ...defaults, ...options };

        const user = new User(mergedOptions);

        return user;
};