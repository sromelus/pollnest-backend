import mongoose, { Schema, Document } from 'mongoose';
import { validate } from 'uuid';

export interface Poll extends Document {
    title: string;
    description: string;
    userId: string;
    messages: {content: string}[];
    pollOptions: {}[];
    startDate: string;
    endDate: string;
    active: boolean;
    public: boolean;
}

type MessageType = {
    userId: mongoose.Schema.Types.ObjectId,
    consent: string,
    createdAt: Date
}

type VoteOptionType = {
    id: String,
    image: String,
    voteButtonText: String,
    count: {type: Number, default: 0}
}

const PollSchema: Schema = new Schema({
        title: {
            type: String,
            required: true,
            validate: {
                validator: function(title:string){
                    return title.length >= 4
                },
                message: 'Please provide a longer title'
            }
        },
        description: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            validate: {
                validator: async function(userId: string) {
                    const User = mongoose.model('User');
                    const user = await User.findById(userId);
                    return user && (user.role === 'admin' || user.role === 'subscriber');
                },
                message: 'Invalid user ID or insufficient permissions. User must be an admin or subscriber.'
            },
            required: true,
        },
        messages: {
            type: [{
                userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
                content: {type: String, required: true, maxLength: 500 },
                createdAt: { type: Date, default: Date.now }
            }],
            validate: {
                validator: function(messages: Array<MessageType>){
                    return messages.length <= 200
                },
                message: 'Messages array exceeds the maximum limit of 200.'
            }
        },
        pollOptions: {
            type: [{
                id: String,
                image: String,
                pollOptionText: String,
                count: {type: Number, default: 0}
            }],
            validate: {
                validator: function(pollOptions: Array<VoteOptionType>) {
                    return pollOptions.length >= 2
                },
                message: 'You should provide at least 2 poll options'
            },
            required: true
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            required: true
        },
        active: {
            type: Boolean,
            default: true
        },
        public: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<Poll>('Poll', PollSchema);