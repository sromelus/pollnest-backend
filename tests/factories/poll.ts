import { Poll } from '../../src/models'

export const testPoll = (
    options: {
        title: string,
        userId: string,
        description: string,
        messages: any[],
        pollOptions: any[],
        startDate: Date,
        endDate: Date,
        active: boolean,
        public: boolean
    } = {
        title: '2024 elections',
        userId: '123',
        description: 'Who do you think is going to win this election?',
        messages: [{content: 'i think trump is going to win', userId: '123', createdAt: new Date()}, {content: 'no way, kamala is going to win', userId: '123', createdAt: new Date()}],
        pollOptions: [{img: 'trump_img', pollOptionText: 'trump', count: 0}, {img: 'kamala_img', pollOptionText: 'kamala', count: 0}],
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        active: true,
        public: false
    }
) => {
    const poll = new Poll({
        title: options.title,
        userId: options.userId,
        description: options.description,
        messages: options.messages,
        pollOptions: options.pollOptions,
        startDate: options.startDate,
        endDate: options.endDate,
        active: options.active,
        public: options.public
    });

    return poll;
};