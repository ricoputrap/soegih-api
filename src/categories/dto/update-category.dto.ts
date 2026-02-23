import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from './create-category.dto.js';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Groceries', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Food and groceries', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: CategoryType, required: false })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  deleted_at?: number | null;
}
