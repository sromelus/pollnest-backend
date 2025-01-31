import User from '../../src/models/User';

export const testUser = async (email: string, role: string = 'user') => {
    const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: '123456',
        role
    });

    return user;
};