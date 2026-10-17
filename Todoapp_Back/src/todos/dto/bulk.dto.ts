import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsPositive,
} from 'class-validator';
import { MAX_TODOS, TODO_STATUSES, type TodoStatus } from '../todo.entity.js';

// Used by bulk delete and Undo (restore)
export class IdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ids: number[];
}

// PATCH /api/todos/bulk  { ids, status }
export class BulkStatusDto extends IdsDto {
  @IsIn(TODO_STATUSES)
  status: TodoStatus;
}

// PATCH /api/todos/order  { ids }  (full list in the new order)
export class ReorderDto {
  @IsArray()
  @ArrayMaxSize(MAX_TODOS)
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ids: number[];
}
