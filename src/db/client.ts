import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export function createDb(databaseUrl: string, nodeEnv?: string) {
  return nodeEnv === 'development' ? 
  drizzlePg({ client: postgres(databaseUrl), schema: schema }) :
  drizzleHttp({ client: neon(databaseUrl), schema: schema });
}
