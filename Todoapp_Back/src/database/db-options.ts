import type { DataSourceOptions } from 'typeorm';

// Connection settings come from environment variables. The defaults match
// the Docker command in the README (docker run ... postgres:16).
export function dbOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'todo',
  };
}
