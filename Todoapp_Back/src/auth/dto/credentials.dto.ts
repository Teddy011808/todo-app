import { IsEmail, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/trim.js';

// Used by both signup and login
export class CredentialsDto {
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @MinLength(8)
  @MaxLength(72)
  password: string;
}
