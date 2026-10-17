import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get() {
    return this.profileService.get();
  }

  @Patch()
  update(@Body() dto: UpdateProfileDto) {
    return this.profileService.update(dto);
  }
}
