import { User } from '../../src/models'

export const testUser = async (email: string, role: string = 'user') => {
    const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: '12345678Aa!',
        role
    });

    return user;
};