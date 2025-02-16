import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVote extends Document {
  pollId: Types.ObjectId,
  voteOptionText: string;
  pollOptionId: string,
  voterId?: Types.ObjectId;
  voterIp: string,
  voterCountry: string,
  voterRegion: string,
  voterCity: string,
  voterEthnicity: string;
  voterGender: string;
}

const VoteSchema = new Schema<IVote>({
    pollId: {
      type: Schema.Types.ObjectId,
      ref: 'Poll',
      validate: [
        {
          validator: async function(this: IVote, pollId: string) {
            const Poll = mongoose.model('Poll');
            const poll = await Poll.findById(pollId);
            return poll !== null;
          },
          message: 'Poll not found',
        },
        {
          validator: async function(this: IVote, pollId: string) {
            const Poll = mongoose.model('Poll');
            const poll = await Poll.findById(pollId);
            if (!poll.allowMultipleVotes && !this.voterId) {
              return false;
            }
            return true;
          },
          message: 'Only registered users can vote. Please login or signup to vote.',
        },
        {
          validator: async function(this: IVote, pollId: string) {
            const Poll = mongoose.model('Poll');
            const poll = await Poll.findById(pollId);
            if(!poll.allowMultipleVotes) {
              const Vote = mongoose.model('Vote');
              const existingVote = await Vote.findOne({
                pollId: pollId,
                voterId: this.voterId
              });
              if (existingVote) return false;
            }
            return true;
          },
          message: 'You have already voted for this poll.',
        }
    ],
      required: true,
    },
    voteOptionText: {
      type: String,
      required: true,
    },
    pollOptionId: {
      type: Schema.Types.String,
      required: true,
      validate: {
        validator: async function(this: IVote, pollOptionId: string) {
          const Poll = mongoose.model('Poll');
          const poll = await Poll.findById(this.pollId);
          if(!poll) return false;
          return (poll.pollOptions as Array<{ _id: string }>).some((option) => option._id == pollOptionId);
        },
        message: 'Vote option must be one of the valid options from the poll.'
      }
    },
    voterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      required: false
    },
    voterIp: {
      type: Schema.Types.String,
      required: true
    },
    voterCountry: {
      type: Schema.Types.String,
      required: true
    },
    voterRegion: {
      type: Schema.Types.String,
      required: false
    },
    voterCity: {
      type: Schema.Types.String,
      required: false
    },
    voterEthnicity: {
      type: Schema.Types.String,
    },
    voterGender: {
      type: Schema.Types.String,
    }
  },
  {
      timestamps: true
  }
);

export default mongoose.model<IVote>('Vote', VoteSchema);