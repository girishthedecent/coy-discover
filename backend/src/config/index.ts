import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(4000),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'silent']).default('info'),
    TRUST_PROXY: z.stringbool().default(false),
    TRUSTED_ORIGINS: z
      .string()
      .default('')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),

    DATABASE_URL: z.string().startsWith('postgres'),
    TEST_DATABASE_URL: z.string().optional(),

    // no auth in this assignment, every request is this user
    CURRENT_USER_ID: z.uuid(),
    DEMO_RESET_ENABLED: z.stringbool().default(false),
  })
  .refine((c) => !(c.NODE_ENV === 'production' && c.DEMO_RESET_ENABLED), {
    path: ['DEMO_RESET_ENABLED'],
    message: 'must be off in production',
  });

export type ServerConfig = z.infer<typeof schema>;

export function parseServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  // treat `NAME=` in .env as not set
  const values = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== ''));
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

function loadConfig(): ServerConfig {
  try {
    return parseServerConfig(process.env);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

export const serverConfig = loadConfig();
