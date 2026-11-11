import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.profileService.get(user.id);
  }

  @Patch()
  update(@Body() dto: UpdateProfileDto, @CurrentUser() user: AuthUser) {
    return this.profileService.update(user.id, dto);
  }
}
