import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './activity.entity.js';
import { ActivityController } from './activity.controller.js';
import { ActivityListener } from './activity.listener.js';
import { ActivityService } from './activity.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityListener],
})
export class ActivityModule {}
