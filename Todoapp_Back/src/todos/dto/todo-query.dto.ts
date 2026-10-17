import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TODO_STATUSES, type TodoStatus } from '../todo.entity.js';

// GET /api/todos?status=DONE&q=milk&starred=true
export class TodoQueryDto {
  @IsOptional()
  @IsIn(TODO_STATUSES)
  status?: TodoStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  starred?: 'true' | 'false';
}
