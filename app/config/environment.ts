export const envConfig = {
  development: {
    allowedOrigins: ['http://localhost:3000'],
  },
  staging: {
    allowedOrigins: [
      'http://staging.yourapp.com',
      'https://staging.yourapp.com'
    ],
  },
  production: {
    allowedOrigins: [
      'http://yourapp.com',
      'https://yourapp.com'
    ],
  },
};


export type Environment = keyof typeof envConfig;