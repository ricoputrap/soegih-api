import { IsEnum, IsOptional } from 'class-validator';
import {
  EnumCategorySortKey,
  EnumCategorySortOrder,
} from '../categories.types';

export class GetAllCategoriesDto {
  @IsOptional()
  @IsEnum(EnumCategorySortKey)
  sortKey?: EnumCategorySortKey;

  @IsOptional()
  @IsEnum(EnumCategorySortOrder)
  sortOrder?: EnumCategorySortOrder;
}
