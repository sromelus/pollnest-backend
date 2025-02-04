import { Poll } from '../../src/models'

export const testPoll = (
        options: {
            title?: string,
            userId?: string,
            description?: string,
            messages?: any[],
            pollOptions?: any[],
            startDate?: Date,
            endDate?: Date,
            active?: boolean,
            public?: boolean
        } = {}
    ) => {
        const defaults = {
            title: '2024 elections',
            userId: '123',
            description: 'Who do you think is going to win this election?',
            messages: [{content: 'i think trump is going to win', userId: '67a26660f5de61f22181db3d', createdAt: new Date()}, {content: 'no way, kamala is going to win', userId: '67a26660f5de61f22181db3d', createdAt: new Date()}],
            pollOptions: [{img: 'trump_img', pollOptionText: 'trump', count: 0}, {img: 'kamala_img', pollOptionText: 'kamala', count: 0}],
            startDate: new Date(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            active: true,
            public: false
        };

        const mergedOptions = { ...defaults, ...options };

        const poll = new Poll(mergedOptions);

        return poll;
};