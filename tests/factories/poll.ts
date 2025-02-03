import { Poll } from '../../src/models'

export const testPoll = async (userId: any) => {
    const poll = new Poll({
        title: '2024 elections',
        userId,
        description: 'Who do you think is going to win this election?',
        messages: [],
        voteOptions: [
            {img: 'trump_img', voteOptionText: 'trump', count: 0},
            {img: 'kamala_img', voteOptionText: 'kamala', count: 0}
        ],
        startDate: Date.now(),
        endDate: Date.now(),
        active: true
    })

    return poll;
};