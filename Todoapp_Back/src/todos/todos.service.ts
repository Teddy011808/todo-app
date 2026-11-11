import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  ILike,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';
import { BulkStatusDto } from './dto/bulk.dto.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { TodoQueryDto } from './dto/todo-query.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoEvent } from './events/todo.event.js';
import { MAX_TODOS, Todo } from './todo.entity.js';

// How long a deleted todo can still be brought back with Undo
const UNDO_WINDOW_MS = 10 * 60 * 1000;

// Escape % and _ so a search for "50%" matches literally
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(
    @InjectRepository(Todo)
    private readonly repo: Repository<Todo>,
    private readonly events: EventEmitter2,
  ) {}

  // Every query is scoped to the owner in SQL, so nobody sees another user's todos
  findAll(ownerId: number, query: TodoQueryDto = {}): Promise<Todo[]> {
    // Only add the filters that were sent
    const where: FindOptionsWhere<Todo> = { ownerId };
    if (query.status) where.status = query.status;
    if (query.starred) where.starred = query.starred === 'true';
    const q = query.q?.trim();
    // TypeORM sends this as a query parameter, never as raw SQL
    if (q) where.title = ILike(`%${escapeLike(q)}%`);

    return this.repo.find({
      where,
      order: { position: 'ASC', id: 'ASC' },
    });
  }

  // Someone else's todo gives the same 404 as a missing one, so ids leak nothing
  async findOne(ownerId: number, id: number): Promise<Todo> {
    const todo = await this.repo.findOneBy({ id, ownerId });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async create(ownerId: number, dto: CreateTodoDto): Promise<Todo> {
    // shortcut: count-then-insert, parallel creates can pass MAX_TODOS by a few; fine for a soft cap
    if ((await this.repo.countBy({ ownerId })) >= MAX_TODOS) {
      throw new BadRequestException(`You can have at most ${MAX_TODOS} todos`);
    }
    // New todos go to the top of the list
    const top = (await this.repo.minimum('position', { ownerId })) ?? 0;
    const saved = await this.repo.save(
      this.repo.create({
        title: dto.title,
        status: dto.status ?? 'TODO',
        position: top - 1,
        ownerId,
      }),
    );
    this.emit('todo.created', ownerId, saved);
    // Reload so the response has the same fields as every other endpoint
    return this.findOne(ownerId, saved.id);
  }

  async update(ownerId: number, id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(ownerId, id);
    // Copy only the fields that were sent
    if (dto.title !== undefined) todo.title = dto.title;
    if (dto.status !== undefined) todo.status = dto.status;
    if (dto.starred !== undefined) todo.starred = dto.starred;
    const saved = await this.repo.save(todo);
    this.emit('todo.updated', ownerId, saved);
    return saved;
  }

  // Bonus: PATCH /api/todos/bulk
  async updateMany(
    ownerId: number,
    { ids, status }: BulkStatusDto,
  ): Promise<Todo[]> {
    await this.repo.update({ id: In(ids), ownerId }, { status });
    const todos = await this.repo.find({
      where: { id: In(ids), ownerId },
      order: { position: 'ASC', id: 'ASC' },
    });
    for (const todo of todos) this.emit('todo.updated', ownerId, todo);
    return todos;
  }

  async remove(ownerId: number, ids: number[]): Promise<void> {
    await this.purgeExpired();
    // Read the titles first: the feed needs them after the rows are gone
    const todos = await this.repo.findBy({ id: In(ids), ownerId });
    const result = await this.repo.softDelete({ id: In(ids), ownerId });
    if (!result.affected)
      throw new NotFoundException('No matching todos found');
    this.logger.log(`Deleted ${result.affected} todo(s)`);
    for (const todo of todos) this.emit('todo.deleted', ownerId, todo);
  }

  // Undo: only todos deleted in the last few minutes can come back.
  // They keep their old position, so they reappear in the same place.
  async restore(ownerId: number, ids: number[]): Promise<Todo[]> {
    const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
    const result = await this.repo.restore({
      id: In(ids),
      ownerId,
      deletedAt: MoreThan(cutoff),
    });
    if (!result.affected) {
      throw new NotFoundException('Nothing to restore (Undo window expired?)');
    }
    this.logger.log(`Restored ${result.affected} todo(s)`);
    return this.findAll(ownerId);
  }

  // Bonus: PATCH /api/todos/order. Listed todos come first in the given order;
  // unknown ids are ignored and unlisted todos keep their order after them.
  // Only the owner's ids reach the UPDATE: unknown or foreign ids are dropped.
  async reorder(ownerId: number, ids: number[]): Promise<Todo[]> {
    const current = await this.findAll(ownerId);
    const byId = new Map(current.map((todo) => [todo.id, todo]));
    const listed = ids.filter((id) => byId.has(id));
    const rest = current
      .map((todo) => todo.id)
      .filter((id) => !listed.includes(id));
    const order = [...listed, ...rest];

    // One parameterized UPDATE: position = index in the new order
    await this.repo.query(
      `UPDATE todos SET position = o.position
       FROM unnest($1::int[]) WITH ORDINALITY AS o(id, position)
       WHERE todos.id = o.id`,
      [order],
    );
    return this.findAll(ownerId);
  }

  // Called only after the save has committed, so listeners never see a rolled-back todo
  private emit(name: string, ownerId: number, todo: Todo) {
    this.events.emit(name, new TodoEvent(todo.id, ownerId, todo.title));
  }

  // Soft-deleted rows older than the Undo window are removed for good
  private async purgeExpired() {
    const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
    await this.repo.delete({ deletedAt: LessThan(cutoff) });
  }
}
