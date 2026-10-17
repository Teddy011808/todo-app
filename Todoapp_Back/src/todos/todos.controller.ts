import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BulkStatusDto, IdsDto, ReorderDto } from './dto/bulk.dto.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodoQueryDto } from './dto/todo-query.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodosService } from './todos.service.js';

@Controller('todos')
export class TodosController {
  constructor(private readonly todos: TodosService) {}

  // GET /api/todos?status=DONE&q=milk
  @Get()
  findAll(@Query() query: TodoQueryDto) {
    return this.todos.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateTodoDto) {
    return this.todos.create(dto); // 201 by default
  }

  // Fixed paths come before ":id" so "bulk" is not read as an id

  // PATCH /api/todos/bulk  { ids, status }
  @Patch('bulk')
  updateMany(@Body() dto: BulkStatusDto) {
    return this.todos.updateMany(dto);
  }

  // DELETE /api/todos/bulk  { ids }
  @Delete('bulk')
  @HttpCode(204)
  removeMany(@Body() dto: IdsDto) {
    return this.todos.remove(dto.ids);
  }

  // POST /api/todos/restore  { ids }  (Undo a recent delete)
  @Post('restore')
  restore(@Body() dto: IdsDto) {
    return this.todos.restore(dto.ids);
  }

  // PATCH /api/todos/order  { ids }  (drag and drop)
  @Patch('order')
  reorder(@Body() dto: ReorderDto) {
    return this.todos.reorder(dto.ids);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.todos.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTodoDto) {
    return this.todos.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todos.remove([id]);
  }
}
