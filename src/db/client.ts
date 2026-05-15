import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function createDb(connectionString: string) {
  return drizzleHttp({ client: neon(connectionString), schema: schema });
}
