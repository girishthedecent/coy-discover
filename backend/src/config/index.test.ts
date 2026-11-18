import { describe, expect, it } from 'vitest';
import { parseServerConfig } from './index.js';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  CURRENT_USER_ID: '00000000-0000-4000-8000-000000000001',
};

describe('parseServerConfig', () => {
  it('uses defaults', () => {
    const config = parseServerConfig(base);
    expect(config.PORT).toBe(4000);
    expect(config.TRUSTED_ORIGINS).toEqual([]);
    expect(config.DEMO_RESET_ENABLED).toBe(false);
  });

  it('throws on missing or invalid values', () => {
    expect(() => parseServerConfig({})).toThrow(/DATABASE_URL/);
    expect(() => parseServerConfig({ ...base, CURRENT_USER_ID: 'me' })).toThrow(/CURRENT_USER_ID/);
  });

  it('does not allow demo reset in production', () => {
    const env = { ...base, DEMO_RESET_ENABLED: 'true' };
    expect(() => parseServerConfig({ ...env, NODE_ENV: 'production' })).toThrow(
      /DEMO_RESET_ENABLED/,
    );
    expect(parseServerConfig(env).DEMO_RESET_ENABLED).toBe(true);
  });

  it('splits origins and ignores empty values', () => {
    const config = parseServerConfig({
      ...base,
      TRUSTED_ORIGINS: 'http://a.test, http://b.test,',
      PORT: '',
    });
    expect(config.TRUSTED_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
    expect(config.PORT).toBe(4000);
  });
});
