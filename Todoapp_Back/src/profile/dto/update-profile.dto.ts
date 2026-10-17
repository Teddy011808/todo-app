import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../../common/trim.js';

export class UpdateProfileDto {
  @IsOptional()
  @Trim()
  @Matches(/^[a-zA-Z0-9_.]{3,30}$/, {
    message:
      'username must be 3-30 characters: letters, numbers, dots or underscores',
  })
  username?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  displayName?: string;

  // Empty string is allowed: the profile page shows "No email"
  @IsOptional()
  @Trim()
  @ValidateIf((_, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
