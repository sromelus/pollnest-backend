import '../loadEnvironmentVariables';

interface EnvironmentConfig {
  allowedOrigins: string[];
  jwtSecret: string;
}

// export type Environment = keyof typeof envConfig;

export const envConfig: Record<string, EnvironmentConfig> = {
  development: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
  },
  staging: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
  },
  production: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
  },
  test: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET || 'test_secret-test',
  },
};
