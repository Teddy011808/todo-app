import { Controller, Get } from '@nestjs/common';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator.js';
import { ActivityService } from './activity.service.js';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.activity.findAll(user.id);
  }
}
