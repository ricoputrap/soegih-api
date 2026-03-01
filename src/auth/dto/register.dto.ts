import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Username (3-50 chars, alphanumeric, underscore, dash only)',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username must contain only alphanumeric characters, underscore, or dash',
  })
  username: string;

  @ApiProperty({
    description:
      'Password (8+ chars, uppercase, lowercase, number, special char)',
    example: 'SecurePass123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}
