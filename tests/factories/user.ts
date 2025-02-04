import { User } from '../../src/models'

export const testUser = (
    options: {firstName: string, lastName: string, email: string, password: string, role: string} = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '12345678Aa!',
        role: 'user'
    }
) => {
    const user = new User({
        firstName: options.firstName,
        lastName: options.lastName,
        email: options.email,
        password: options.password,
        role: options.role
    });

    return user;
};