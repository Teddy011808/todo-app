import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { User } from '../auth/user.entity.js';
import { Profile } from './profile.entity.js';

// First visit: name the profile after the email, e.g. "ann.lee@x.com" -> "ann.lee"
function defaultProfile(email: string) {
  const name = email.split('@')[0];
  return {
    username: name
      .replace(/[^a-zA-Z0-9_.]/g, '_')
      .slice(0, 30)
      .padEnd(3, '_'),
    displayName: name.slice(0, 80),
    email,
  };
}

// What the API returns: only these fields, never the internal id
export type ProfileResponse = Pick<
  Profile,
  'username' | 'displayName' | 'email'
>;

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly repo: Repository<Profile>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async get(userId: number): Promise<ProfileResponse> {
    return this.toResponse(await this.findOrCreate(userId));
  }

  async update(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.findOrCreate(userId);
    // Copy only the fields that were sent
    if (dto.username !== undefined) profile.username = dto.username;
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.email !== undefined) profile.email = dto.email;
    return this.toResponse(await this.repo.save(profile));
  }

  // The user's first request creates their profile row
  private async findOrCreate(id: number): Promise<Profile> {
    const existing = await this.repo.findOneBy({ id });
    if (existing) return existing;
    const { email } = await this.users.findOneByOrFail({ id });
    // upsert: two first requests at once must not both insert
    await this.repo.upsert({ id, ...defaultProfile(email) }, ['id']);
    return this.repo.findOneByOrFail({ id });
  }

  private toResponse({ username, displayName, email }: Profile) {
    return { username, displayName, email };
  }
}
