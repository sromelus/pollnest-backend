import mongoose, { Schema, Document } from 'mongoose';

export enum Candidate {
    KAMALA = 'kamala',
    TRUMP = 'trump'
}

export interface VoteTally extends Document {
    candidate: Candidate;
    count: number;
    lastUpdated: Date;
}

const VoteTallySchema: Schema = new Schema({
    candidate: {
        type: String,
        required: true,
        unique: true,
        enum: Object.values(Candidate) // Only allow these values
    },
    count: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<VoteTally>('VoteTally', VoteTallySchema);