import { ICategory } from '../categories.types.js';

export const CATEGORY_REPOSITORY_TOKEN = Symbol('CATEGORY_REPOSITORY');

export interface CategoryWhereParams {
  deleted_at?: null;
  type?: string;
  name?: {
    contains: string;
    mode: 'insensitive';
  };
}

export interface CategoryOrderByParams {
  [field: string]: 'asc' | 'desc';
}

export interface CategoryFindManyParams {
  where?: CategoryWhereParams;
  take?: number;
  skip?: number;
  orderBy?: CategoryOrderByParams;
}

export interface CategoryCreateParams {
  name: string;
  description?: string;
  type: string;
}

export interface CategoryUpdateParams {
  name?: string;
  description?: string;
}

export interface ICategoryRepository {
  findMany(params: CategoryFindManyParams): Promise<ICategory[]>;
  count(where?: CategoryWhereParams): Promise<number>;
  create(data: CategoryCreateParams): Promise<ICategory>;
  update(id: string, data: CategoryUpdateParams): Promise<ICategory>;
}
