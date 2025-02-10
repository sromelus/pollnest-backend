import { User, UserRole, IUser } from '../../src/models'

export const testUser = (options: Partial<IUser>): IUser => {
        const defaults = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'ValidPass123!',
            role: UserRole.User
        }

        const mergedOptions = { ...defaults, ...options };

        const user = new User(mergedOptions);

        return user;
};