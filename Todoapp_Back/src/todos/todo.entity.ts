import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const TODO_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

// Upper bound on stored todos, so the table cannot grow forever
export const MAX_TODOS = 1000;

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'TODO' })
  status: TodoStatus;

  // Bonus: priority / starred
  @Column({ default: false })
  starred: boolean;

  // Bonus: drag-and-drop order (smallest first)
  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Soft delete: a deleted row is kept for a few minutes so Undo can restore it
  @DeleteDateColumn({ type: 'timestamptz', select: false })
  deletedAt?: Date;
}
