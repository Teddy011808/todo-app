import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../auth/user.entity.js';

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user?: User;

  @Index()
  @Column({ select: false })
  userId: number;

  @Column()
  message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
