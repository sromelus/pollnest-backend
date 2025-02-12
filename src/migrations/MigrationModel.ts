import mongoose, { Schema } from 'mongoose';

interface IMigration {
  name: string;
  appliedAt: Date;
}

const migrationSchema = new Schema<IMigration>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  appliedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});

export const Migration = mongoose.model<IMigration>('Migration', migrationSchema);