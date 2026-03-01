import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface IGetAllCategoriesParams {
  sortKey?: EnumCategorySortKey;
  sortOrder?: EnumCategorySortOrder;
  limit?: number;
  offset?: number;
  type?: EnumCategoryType;
  search?: string;
  include_deleted?: boolean;
}

export interface GetAllCategoriesResponse {
  data: ICategory[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface CreateCategoryResponse {
  data: ICategory;
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface UpdateCategoryResponse {
  data: ICategory;
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface DeleteSingleCategoryData {
  id: string;
  name: string;
  transaction_count?: number;
  warning?: string;
  deleted_at?: Date | null;
  transaction_count_archived?: number;
}

export interface DeleteSingleCategoryResponse {
  status: 'DELETED' | 'CONFIRMATION_REQUIRED';
  data: DeleteSingleCategoryData;
  confirmation_required: boolean;
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface ICategoryService {
  getAll(params: IGetAllCategoriesParams): Promise<GetAllCategoriesResponse>;
  create(data: CreateCategoryDto): Promise<CreateCategoryResponse>;
  update(id: string, data: UpdateCategoryDto): Promise<UpdateCategoryResponse>;
  deleteSingle(
    id: string,
    confirm: boolean,
  ): Promise<DeleteSingleCategoryResponse>;
}
