import 'dotenv/config';

export function useTestEnv() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL must be set to run tests');
  // tests truncate every table, so never run them on the dev database
  if (!new URL(url).pathname.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must point to a *_test database');
  }

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = url;
  process.env.LOG_LEVEL = 'silent';
  process.env.CURRENT_USER_ID = '00000000-0000-4000-8000-000000000001';
  process.env.DEMO_RESET_ENABLED = 'true';
}
