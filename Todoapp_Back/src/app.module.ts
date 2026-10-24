import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { dbOptions } from './database/db-options.js';
import { LoggingExceptionFilter } from './common/logging-exception.filter.js';
import { ProfileModule } from './profile/profile.module.js';
import { TodosModule } from './todos/todos.module.js';

@Module({
  imports: [
    // Check settings at startup: a bad or missing value stops the app at boot
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().port().default(3000),
        CORS_ORIGIN: Joi.string().uri(),
        // Defaults live in dbOptions(), shared with the migration CLI and tests
        DB_HOST: Joi.string(),
        DB_PORT: Joi.number().port(),
        DB_USER: Joi.string(),
        DB_PASSWORD: Joi.string(),
        DB_NAME: Joi.string(),
        JWT_SECRET: Joi.string().min(32).required(),
      }),
    }),
    // ConfigModule loads and checks .env first, so this factory sees valid values
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbOptions(),
        autoLoadEntities: true,
        synchronize: false, // tables are created by migrations only
        // Apply any new migrations on startup, so a fresh clone just works
        migrations: [join(import.meta.dirname, 'migrations', '*.js')],
        migrationsRun: true,
      }),
    }),
    // At most 120 requests per minute per client IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TodosModule,
    ProfileModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Secure by default: every route needs a token unless it is @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: LoggingExceptionFilter },
  ],
})
export class AppModule {}
