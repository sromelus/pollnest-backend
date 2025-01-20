import mongoose, { Schema, Document } from 'mongoose';
import { validate } from 'uuid';

export interface Poll extends Document {
    title: string;
    description: string;
    userId: string;
    messages: {content: string}[];
    voteOptions: {}[];
    startDate: string;
    endDate: string;
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
            required: true,
            unique: true
        },
        messages: {
            type: [{
                userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
                content: {type: String, required: true, maxlength: 500 },
                createdAt: { type: Date, default: Date.now }
            }],
            validate: {
                validator: function(messages: Array<MessageType>){
                    return messages.length <= 200
                },
                message: 'Messages array exceeds the maximum limit of 200.'
            }
        },
        voteOptions: {
            type: [{
                id: String,
                image: String,
                voteButtonText: String,
                count: {type: Number, default: 0}
            }],
            validate: {
                validator: function(voteOptions: Array<VoteOptionType>) {
                    return voteOptions.length >= 2
                },
                message: 'You should provide at least 2 vote options'
            }
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: Date.now,
            required: true
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<Poll>('Poll', PollSchema);