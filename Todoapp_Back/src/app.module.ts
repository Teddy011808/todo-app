import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingExceptionFilter } from './common/logging-exception.filter.js';
import { dbOptions } from './database/db-options.js';
import { ProfileModule } from './profile/profile.module.js';
import { TodosModule } from './todos/todos.module.js';

@Module({
  imports: [
    // Read the env at startup (not import time) so tests can point at todo_test
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbOptions(),
        autoLoadEntities: true,
        synchronize: false, // tables are created by migrations only
      }),
    }),
    // At most 120 requests per minute per client IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TodosModule,
    ProfileModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: LoggingExceptionFilter },
  ],
})
export class AppModule {}
