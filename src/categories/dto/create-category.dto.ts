import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CategoryType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Food and groceries', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  @IsEnum(CategoryType)
  type: CategoryType;
}
