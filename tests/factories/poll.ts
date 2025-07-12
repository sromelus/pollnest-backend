import { Types } from 'mongoose';
import { Poll } from '../../src/models'
import { IPoll } from '../../src/models/Poll';

// Helper function to get random color
const getRandomColor = (): string => {
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#000000'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const testPoll = (options: Partial<IPoll>): IPoll => {
    const title = options.title || '2024 elections';
    const defaults = {
        title: title,
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
            {
                image_alt: 'trump_img', 
                pollOptionText: 'trump', 
                count: 0,
                imageUrl: "https://placehold.co/400x500/green/white",
                color: getRandomColor()
            },
            {
                image_alt: 'kamala_img', 
                pollOptionText: 'kamala', 
                count: 0,
                imageUrl: "https://placehold.co/400x500/green/white",
                color: getRandomColor()
            }
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        active: true,
        public: false,
        allowMultipleVotes: true,
        category: 'general',
        slug: generateSlug(title) + '-' + Math.random().toString(36).substr(2, 9)
    };

    const mergedOptions = { ...defaults, ...options };

    return new Poll(mergedOptions);
};