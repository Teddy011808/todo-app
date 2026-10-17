import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Profile } from './profile.entity.js';

const PROFILE_ID = 1;
const DEFAULT_PROFILE = {
  username: 'teddy',
  displayName: 'Teddy',
  email: 'teddy@example.com',
};

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
  ) {}

  async get(): Promise<ProfileResponse> {
    return this.toResponse(await this.findOrCreate());
  }

  async update(dto: UpdateProfileDto): Promise<ProfileResponse> {
    const profile = await this.findOrCreate();
    // Copy only the fields that were sent
    if (dto.username !== undefined) profile.username = dto.username;
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.email !== undefined) profile.email = dto.email;
    return this.toResponse(await this.repo.save(profile));
  }

  // The first request creates the default profile row
  private async findOrCreate(): Promise<Profile> {
    const existing = await this.repo.findOneBy({ id: PROFILE_ID });
    if (existing) return existing;
    await this.repo.upsert({ id: PROFILE_ID, ...DEFAULT_PROFILE }, ['id']);
    return this.repo.findOneByOrFail({ id: PROFILE_ID });
  }

  private toResponse({ username, displayName, email }: Profile) {
    return { username, displayName, email };
  }
}
