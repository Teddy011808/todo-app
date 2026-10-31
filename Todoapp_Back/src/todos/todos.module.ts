import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanupTask } from './cleanup.task.js';
import { Todo } from './todo.entity.js';
import { TodosController } from './todos.controller.js';
import { TodosService } from './todos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  controllers: [TodosController],
  providers: [TodosService, CleanupTask],
})
export class TodosModule {}
