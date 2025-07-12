import mongoose, { Schema, Document, Types } from 'mongoose';
import { validate } from 'uuid';

export type MessageType = {
    userId: string,
    consent: string,
    createdAt: Date
}

export type PollOptionType = {
    _id?: string,
    image: string,
    pollOptionText: string,
    count: number
}

export interface IPoll extends Document {
    title: string;
    description: string;
    creatorId: Types.ObjectId;
    messages: MessageType[];
    pollOptions: PollOptionType[];
    startDate: Date;
    endDate: Date;
    active: boolean;
    public: boolean;
    allowMultipleVotes: boolean;
    category: string;
    slug: string;
}

const PollSchema = new Schema<IPoll>({
        title: {
            type: Schema.Types.String,
            required: true,
            validate: {
                validator: function(title:string){
                    return title.length >= 4
                },
                message: 'Please provide a longer title'
            }
        },
        description: {
            type: Schema.Types.String,
            required: true,
        },
        creatorId: {
            type: Schema.Types.ObjectId,
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
                userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
                content: {type: Schema.Types.String, required: true, maxLength: 500 },
                createdAt: { type: Schema.Types.Date, default: Date.now }
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
                image: {type: Schema.Types.String, required: true},
                pollOptionText: {type: Schema.Types.String, required: true},
                count: {type: Schema.Types.Number, required: true, default: 0}
            }],
            validate: {
                validator: function(pollOptions: Array<PollOptionType>) {
                    return pollOptions.length >= 2
                },
                message: 'You should provide at least 2 poll options'
            },
            required: true
        },
        startDate: {
            type: Schema.Types.Date,
            default: Date.now,
        },
        endDate: {
            type: Schema.Types.Date,
            default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            required: true
        },
        active: {
            type: Schema.Types.Boolean,
            default: true
        },
        public: {
            type: Schema.Types.Boolean,
            default: false
        },
        allowMultipleVotes: {
            type: Schema.Types.Boolean,
            default: false
        },
        category: {
            type: Schema.Types.String,
            default: 'general'
        },
        slug: {
            type: Schema.Types.String,
            required: true,
            unique: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IPoll>('Poll', PollSchema);