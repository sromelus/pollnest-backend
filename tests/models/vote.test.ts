import mongoose from 'mongoose';
import Vote from '../../src/models/Vote'
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


describe('Vote Model', () => {
     //Happy Path
    it('should create new vote successfully', async () => {
        //create poll
        const paramsVoteOptions = [{img: 'trump_img', voteOptionText: 'trump', count: 0}, {img: 'kamala_img', voteOptionText: 'kamala', count: 0}]

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

        const savedSubscriber = await subscriber.save();
        const savedUser = await user.save();

        const poll = new Poll({
            title: '2024 elections',
            userId: savedSubscriber._id, //new mongoose.Types.ObjectId()
            description: 'Who do you think is going to win this election?',
            messages: [{userId: savedUser._id, content: 'hello world'}],
            voteOptions: paramsVoteOptions,
            startDate: Date.now(),
            endDate: Date.now(),
            active: true
        });
        const savedPoll = await poll.save();


        const vote = new Vote({
            pollId: savedPoll._id,
            voteOptionText: 'trump',
            voterId: '1',
            voterIp: '23',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Boston',
            voterEthnicity: 'Black',
            voterGender: 'male'
        })

        const savedVote = await vote.save();

        expect(savedVote._id).toBeDefined();
    })

    //Sad Path
    it('should not create a vote when pollId or voteOptionText is missing', async () => {
        const vote = new Vote({
            pollId: null,
            voteOptionText: null,
            voterId: '1',
            voterIp: '23',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Boston',
            voterEthnicity: 'Black',
            voterGender: 'male'
        })

        try {
            await vote.save();
            fail('Should not succeed in creating vote')
        } catch(error) {
            expect((error as any).errors.pollId.message).toBe('Path `pollId` is required.')
            expect((error as any).errors.voteOptionText.message).toBe('Path `voteOptionText` is required.')
        }
    })

     //Sad Path
    it('should not create a vote when voteOptionText is not valid', async () => {
        const paramsVoteOptions = [{img: 'trump_img', voteOptionText: 'trump', count: 0}, {img: 'kamala_img', voteOptionText: 'kamala', count: 0}]

        const subscriber = new User({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane2@example.com',
            password: '123456',
            role: 'subscriber'
        });

        const user = new User({
            firstName: 'Rob',
            lastName: 'Lam',
            email: 'rob2@example.com',
            password: '123456',
        });

        const savedSubscriber = await subscriber.save();
        const savedUser = await user.save();

        const poll = new Poll({
            title: '2024 elections',
            userId: savedSubscriber._id, //new mongoose.Types.ObjectId()
            description: 'Who do you think is going to win this election?',
            messages: [{userId: savedUser._id, content: 'hello world'}],
            voteOptions: paramsVoteOptions,
            startDate: Date.now(),
            endDate: Date.now(),
            active: true
        });
        const savedPoll = await poll.save();

        const vote = new Vote({
            pollId: savedPoll._id,
            voteOptionText: 'kaa',
            voterId: savedUser._id,
            voterIp: '23',
            voterCountry: 'US',
            voterRegion: 'MA',
            voterCity: 'Boston',
            voterEthnicity: 'Black',
            voterGender: 'male'
        })

        try {
            await vote.save();
            fail('Should not succeed in creating vote')
        } catch(error) {
            expect((error as any).errors.voteOptionText.message).toBe('Vote option must be one of the valid options from the poll.')
        }
    })
});