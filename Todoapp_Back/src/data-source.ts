// Must be first, so every other file sees the .env values
import './load-env.js';
import { DataSource } from 'typeorm';
import { dbOptions } from './database/db-options.js';

// Used by the TypeORM CLI to generate and run migrations
export default new DataSource({
  ...dbOptions(),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
