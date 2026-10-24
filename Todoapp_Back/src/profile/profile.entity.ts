import { Column, Entity, PrimaryColumn } from 'typeorm';

// One profile per user: its id is the user's id
@Entity('profile')
export class Profile {
  @PrimaryColumn()
  id: number;

  @Column({ length: 30 })
  username: string;

  @Column({ length: 80 })
  displayName: string;

  @Column({ length: 254, default: '' })
  email: string;
}
