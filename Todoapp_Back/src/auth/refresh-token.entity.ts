import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity.js';

// One row per issued refresh token. Only a hash is stored, like a password.
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user?: User;

  @Column()
  userId: number;

  @Column({ length: 64, unique: true })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  // Set when the token is used (rotated) or the user logs out
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
