import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TodoEvent } from '../todos/events/todo.event.js';
import { ActivityService } from './activity.service.js';

@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  constructor(private readonly activity: ActivityService) {}

  @OnEvent('todo.created', { async: true })
  onCreated(e: TodoEvent) {
    return this.record(e, 'Created');
  }

  @OnEvent('todo.updated', { async: true })
  onUpdated(e: TodoEvent) {
    return this.record(e, 'Updated');
  }

  @OnEvent('todo.deleted', { async: true })
  onDeleted(e: TodoEvent) {
    return this.record(e, 'Deleted');
  }

  // The client already has its response, so a failure can only go to the logs
  private async record(e: TodoEvent, verb: string) {
    try {
      await this.activity.log(e.userId, `${verb} "${e.title}"`);
    } catch (err) {
      this.logger.error('activity log failed', (err as Error).stack);
    }
  }
}
