import { CreateCategoryDto } from './dto/create-category.dto';

export enum EnumCategorySortKey {
  NAME = 'name',
}

export enum EnumCategorySortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum EnumCategoryType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export interface ICategory {
  id: string;
  name: string;
  type: EnumCategoryType;
  description?: string;
}

export interface IGetAllCategoriesParams {
  sortKey?: EnumCategorySortKey;
  sortOrder?: EnumCategorySortOrder;
}

export interface ICategoryService {
  getAll(params: IGetAllCategoriesParams): Promise<ICategory[]>;
  create(data: CreateCategoryDto): Promise<ICategory>;
}
