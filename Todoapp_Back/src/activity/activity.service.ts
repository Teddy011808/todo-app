import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity.js';

const FEED_SIZE = 50;

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  findAll(userId: number): Promise<Activity[]> {
    return this.repo.find({
      where: { userId },
      order: { id: 'DESC' },
      take: FEED_SIZE,
    });
  }

  async log(userId: number, message: string): Promise<void> {
    await this.repo.insert({ userId, message });
  }
}
