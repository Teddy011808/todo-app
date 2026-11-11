import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from './auth/decorators/public.decorator.js';

// GET /api/health: 200 when the API can reach Postgres, else 500. Used by compose and deploys.
@Controller('health')
export class HealthController {
  constructor(private readonly db: DataSource) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    await this.db.query('SELECT 1');
    return { status: 'ok' };
  }
}
