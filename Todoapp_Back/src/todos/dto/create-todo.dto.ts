import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../common/trim.js';
import { TODO_STATUSES, type TodoStatus } from '../todo.entity.js';

export class CreateTodoDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsIn(TODO_STATUSES)
  status?: TodoStatus;
}
