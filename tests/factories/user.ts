import { User } from '../../src/models'

export const testUser = (
        options: {
            firstName?: string,
            lastName?: string,
            email?: string,
            password?: string,
            role?: string
        } = {}
    ) => {
        const defaults = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: '12345678Aa!',
            role: 'user'
        }

        const mergedOptions = { ...defaults, ...options };

        const user = new User(mergedOptions);

        return user;
};