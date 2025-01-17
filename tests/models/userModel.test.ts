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

describe('User Model Test Suite', () => {
    let userId;

    it('should create a new user', async () => {
        const user = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            password: '123456'
        })

        const savedUser = await user.save();

        userId = savedUser._id;
        expect(userId).toBeDefined();
        expect(savedUser.firstName).toEqual('Jane');
        expect(savedUser.lastName).toEqual('Doe');
    })
})