import { dbConnect, dbDisconnect, dropDatabase } from '../helpers/db';
import { testUser } from '../factories'


beforeAll(async () => {
    await dbConnect();
});

beforeEach(async () => {
    await dropDatabase();
});

afterEach(async () => {
    await dropDatabase();
});

afterAll(async () => {
    await dbDisconnect();
});

describe('User Model', () => {
    //Happy Path
    it('should create a new user successfully', async () => {
        const admin = await testUser('jane@example.com', 'admin');
        const savedAdmin = await admin.save();

        expect(admin._id).toBeDefined();
        expect(admin.firstName).toBeDefined();
        expect(admin.lastName).toBeDefined();
        expect(admin.email).toEqual('jane@example.com');
        expect(admin.role).toEqual('admin');
    });

    it('should have default role of "user"', async () => {
        const user = await testUser('jane1@example.com');
        const savedUser = await user.save();

        expect(savedUser.role).toEqual('user');
    });

    //Sad Path
    it('should not create user with bad email', async () => {
        const userWithBadEmail = await testUser('jane2@.com')

        try {
            await userWithBadEmail.save();
            fail('Should not succeed in saving invalid email');
        } catch (error) {
            expect((error as any).errors.email.message).toBe('Email is invalid');
        }
    });
});