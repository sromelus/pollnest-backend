import '../loadEnvironmentVariables';

interface EnvironmentConfig {
  allowedOrigins: string[];
  jwtSecret: string;
  jwtRefreshSecret: string;
  nodeEnv: string;
}

// export type Environment = keyof typeof envConfig;

export const envConfig: Record<string, EnvironmentConfig> = {
  development: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    nodeEnv: 'development',
  },
  staging: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    nodeEnv: 'staging',
  },
  production: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET || 'test_secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    nodeEnv: 'production',
  },
  test: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    jwtSecret: process.env.JWT_SECRET || 'test_secret-test',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'test_refresh_secret-test',
    nodeEnv: 'test',
  },
};
