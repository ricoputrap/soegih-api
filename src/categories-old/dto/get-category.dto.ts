import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EnumCategorySortKey,
  EnumCategorySortOrder,
  EnumCategoryType,
} from '../categories.types';

export class GetAllCategoriesDto {
  @IsOptional()
  @IsEnum(EnumCategorySortKey)
  sortKey?: EnumCategorySortKey;

  @IsOptional()
  @IsEnum(EnumCategorySortOrder)
  sortOrder?: EnumCategorySortOrder;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsEnum(EnumCategoryType)
  type?: EnumCategoryType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_deleted?: boolean;
}
