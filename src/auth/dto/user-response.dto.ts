import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  data: {
    id: string;
    username: string;
    created_at: number;
  };

  @ApiProperty()
  meta: {
    timestamp: number;
    version: string;
  };
}
