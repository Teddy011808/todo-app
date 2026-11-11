import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Stored lowercased; the unique index is the final guard against duplicates
  @Column({ length: 254, unique: true })
  email: string;

  // Never returned by a normal find(); login asks for it explicitly
  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
