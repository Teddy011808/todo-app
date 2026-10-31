import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Todo } from './todo.entity.js';

const KEEP_DONE_MS = 30 * 24 * 3600 * 1000; // 30 days

@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(
    @InjectRepository(Todo) private readonly repo: Repository<Todo>,
  ) {}

  // Every replica runs this, which is safe: a second delete finds nothing
  @Cron('0 2 * * *', { timeZone: 'Asia/Phnom_Penh' })
  async purgeOldDoneTodos() {
    const cutoff = new Date(Date.now() - KEEP_DONE_MS);
    const res = await this.repo.delete({
      status: 'DONE',
      updatedAt: LessThan(cutoff),
    });
    this.logger.log(`Purged ${res.affected} done todos`);
  }
}
