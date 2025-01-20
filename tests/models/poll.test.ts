import mongoose from 'mongoose';
import User from '../../src/models/User'
import Poll from '../../src/models/Poll'
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


describe('Poll Model', () => {
    //Happy Path
    it('should create a new poll', async () => {
        const paramsVoteOptions = [{img: 'trump_img', voteButtonText: 'Trump', count: 0}, {img: 'kamala_img', voteButtonText: 'Kamala', count: 0}]

        const admin = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            password: '123456',
            role: 'admin'
        });

        const subscriber = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane1@example.com',
            password: '123456',
            role: 'subscriber'
        });

        const user = new User({
            firstName: 'Rob',
            lastName: 'Lam',
            email: 'rob@example.com',
            password: '123456',
        });

        const savedAdmin = await admin.save();
        const savedSubscriber = await subscriber.save();
        const savedUser = await user.save();

        const poll = new Poll({
           title: '2024 elections',
           userId: savedAdmin._id, //new mongoose.Types.ObjectId()
           description: 'Who do you think is going to win this election?',
           messages: [{userId: savedUser._id, content: 'hello world'}],
           voteOptions: paramsVoteOptions,
           startDate: Date.now(),
           endDate: Date.now(),
           active: true
        });

        const savedPoll = await poll.save();

        expect(savedPoll._id).toBeDefined();
        expect(savedPoll.title).toEqual('2024 elections');
        expect(savedPoll.description).toEqual('Who do you think is going to win this election?');
        expect((savedPoll.messages).map(msg => msg.content)).toEqual(['hello world']);
        expect(savedPoll.voteOptions.length).toEqual(2);
    })

    //Sad Path
    it('should not create a new poll', async () => {
        const paramsVoteOptions = [{img: 'trump_img', voteButtonText: 'Trump', count: 0}, {img: 'kamala_img', voteButtonText: 'Kamala', count: 0}]
        const admin = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane4@example.com',
            password: '123456',
            role: 'admin'
        });

        const subscriber = new User({
            firstName: 'Joe',
            lastName: 'Dee',
            email: 'joe4@example.com',
            password: '123456',
            role: 'subscriber'
        });

        const user = new User({
            firstName: 'Rob',
            lastName: 'Lam',
            email: 'rob4@example.com',
            password: '123456',
        });

        const savedAdmin = await admin.save();
        const savedSubscriber = await subscriber.save();
        const savedUser = await user.save();

        const poll = new Poll({
           messages: [{userId: savedUser._id, content: 'hello world'}],
           voteOptions: paramsVoteOptions,
        });

        try {
            await poll.save();
            fail('Should not succeed in saving invalid poll');
        } catch(error) {
            expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
            console.log(error)
            expect((error as any).errors.title.message).toBe('Path `title` is required.')

        }

        // expect(savedPoll._id).toBeDefined();
        // expect(savedPoll.title).toEqual('2024 elections');
        // expect(savedPoll.description).toEqual('Who do you think is going to win this election?');
        // expect((savedPoll.messages).map(msg => msg.content)).toEqual(['hello world']);
        // expect(savedPoll.voteOptions.length).toEqual(2);
    })
})