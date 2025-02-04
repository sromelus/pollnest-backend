import { Poll } from '../../src/models'

export const testPoll = (userId: string) => {
    const poll = new Poll({
        title: '2024 elections',
        userId: userId,
        description: 'Who do you think is going to win this election?',
        messages: [
            {
                userId: userId,
                content: 'i think trump is going to win',
                createdAt: Date.now(),
            },
            {
                userId: userId,
                content: 'no way, kamala is going to win',
                createdAt: Date.now(),
            }
        ],
        pollOptions: [
            {img: 'trump_img', pollOptionText: 'trump', count: 0},
            {img: 'kamala_img', pollOptionText: 'kamala', count: 0}
        ],
        startDate: Date.now(),
        endDate: Date.now() + 1000 * 60 * 60 * 24 * 7,
        active: true,
        public: false
    })

    return poll;
};