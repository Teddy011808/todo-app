import { Column, Entity, PrimaryColumn } from 'typeorm';

// Single-user app: the profile is always the row with id 1
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
