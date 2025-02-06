import dotenv from 'dotenv';
import path from 'path';

// Load base .env file first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Load environment-specific file which can override base values
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });

