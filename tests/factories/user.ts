import { User } from '../../src/models'

export const testUser = (options: {email: string, role: string} = {email: 'test@example.com', role: 'user'}) => {
    const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: options.email,
        password: '12345678Aa!',
        role: options.role
    });

    return user;
};