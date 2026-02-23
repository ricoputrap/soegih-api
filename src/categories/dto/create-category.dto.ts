import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnumCategoryType } from '../categories.types';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Utilities & Services' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Electricity, Water, Gas, Trash Pickup, Internet' })
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ enum: EnumCategoryType, example: EnumCategoryType.EXPENSE })
  @IsEnum(EnumCategoryType)
  type: EnumCategoryType;
}
