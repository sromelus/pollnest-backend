import { Types } from 'mongoose';
import { Poll } from '../../src/models'
import { IPoll } from '../../src/models/Poll';

export const testPoll = (options: Partial<IPoll>): IPoll => {
    const defaults = {
        title: '2024 elections',
        creatorId: new Types.ObjectId('67a26660f5de61f22181db3d'),
        description: 'Who do you think is going to win this election?',
        messages: [{
            content: 'i think trump is going to win',
            userId: new Types.ObjectId('67a26660f5de61f22181db3d'),
            createdAt: new Date()
        }, {
            content: 'no way, kamala is going to win',
            userId: new Types.ObjectId('67a26660f5de61f22181db3d'),
            createdAt: new Date()
        }],
        pollOptions: [
            {image: 'trump_img', pollOptionText: 'trump', count: 0},
            {image: 'kamala_img', pollOptionText: 'kamala', count: 0}
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        active: true,
        public: false
    };

    const mergedOptions = { ...defaults, ...options };

    return new Poll(mergedOptions);
};