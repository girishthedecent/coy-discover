import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { serverConfig } from './index.js';

const adapter = new PrismaPg({ connectionString: serverConfig.DATABASE_URL });

const prismaClient = new PrismaClient({ adapter, log: ['warn', 'error'] });

export default prismaClient;
