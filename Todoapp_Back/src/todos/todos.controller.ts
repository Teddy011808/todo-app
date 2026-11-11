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
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator.js';
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
  findAll(@Query() query: TodoQueryDto, @CurrentUser() user: AuthUser) {
    return this.todos.findAll(user.id, query);
  }

  @Post()
  create(@Body() dto: CreateTodoDto, @CurrentUser() user: AuthUser) {
    return this.todos.create(user.id, dto); // 201 by default
  }

  // Fixed paths come before ":id" so "bulk" is not read as an id

  // PATCH /api/todos/bulk  { ids, status }
  @Patch('bulk')
  updateMany(@Body() dto: BulkStatusDto, @CurrentUser() user: AuthUser) {
    return this.todos.updateMany(user.id, dto);
  }

  // DELETE /api/todos/bulk  { ids }
  @Delete('bulk')
  @HttpCode(204)
  removeMany(@Body() dto: IdsDto, @CurrentUser() user: AuthUser) {
    return this.todos.remove(user.id, dto.ids);
  }

  // POST /api/todos/restore  { ids }  (Undo a recent delete)
  @Post('restore')
  restore(@Body() dto: IdsDto, @CurrentUser() user: AuthUser) {
    return this.todos.restore(user.id, dto.ids);
  }

  // PATCH /api/todos/order  { ids }  (drag and drop)
  @Patch('order')
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser) {
    return this.todos.reorder(user.id, dto.ids);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.todos.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTodoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.todos.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.todos.remove(user.id, [id]);
  }
}
