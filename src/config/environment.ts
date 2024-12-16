export const envConfig = {
  development: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  staging: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  },
  production: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
  },
};

export type Environment = keyof typeof envConfig;