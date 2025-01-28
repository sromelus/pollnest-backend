import mongoose from 'mongoose';
import User from '../../src/models/User'
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});



describe('User Model', () => {
    //Happy Path
    it('should create a new user successfully', async () => {
        const admin = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            password: '123456',
            role: 'admin'
        });

        const savedAdmin = await admin.save();

        expect(savedAdmin._id).toBeDefined();
        expect(savedAdmin.firstName).toEqual('Jane');
        expect(savedAdmin.lastName).toEqual('Doe');
        expect(savedAdmin.email).toEqual('jane@example.com');
        expect(savedAdmin.role).toEqual('admin');
    })

    it('should have default role of "user"', async () => {
        const admin = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane1@example.com',
            password: '123456'
        });

        const savedAdmin = await admin.save();

        expect(savedAdmin.role).toEqual('user');
    })

     //Sad Path
    it('should not create user with bad email', async () => {
        const userWithBadEmail = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane2@.com',
            password: '123456'
        });

        try {
            await userWithBadEmail.save();
            fail('Should not succeed in saving invalid email');
        } catch (error) {
            expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
            expect((error as any).errors.email.message).toBe('Email is invalid');
        }
    });
});