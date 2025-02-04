import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/dbTestConfig';
import { testUser } from '../factories'


beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
});

afterAll(async () => {
    await dbDisconnect();
});

describe('User Model', () => {
    //Happy Path
    it('should create a new user successfully', async () => {
        const admin = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', password: '12345678Aa!', role: 'admin'});
        const savedAdmin = await admin.save();

        expect(savedAdmin._id).toBeDefined();
        expect(savedAdmin.firstName).toBeDefined();
        expect(savedAdmin.lastName).toBeDefined();
        expect(savedAdmin.email).toEqual('jane@example.com');
        expect(savedAdmin.role).toEqual('admin');
    });

    it('should have default role of "user"', async () => {
        const user = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane1@example.com', password: '12345678Aa!', role: 'user'});
        const savedUser = await user.save();

        expect(savedUser.role).toEqual('user');
    });

    //Sad Path
    it('should not create user with bad email', async () => {
        const userWithBadEmail = testUser({firstName: 'Jane', lastName: 'Doe', email: 'jane2@.com', password: '12345678Aa!', role: 'user'});

        try {
            await userWithBadEmail.save();
            fail('Should not succeed in saving invalid email');
        } catch (error) {
            expect((error as any).errors.email.message).toBe('Please enter a valid email address');
        }
    });
});