import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  EnumCategorySortKey,
  EnumCategorySortOrder,
  EnumCategoryType,
  ICategory,
  ICategoryService,
  IGetAllCategoriesParams,
} from './categories.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService implements ICategoryService {
  constructor(private prisma: PrismaService) {}

  async getAll({
    sortKey = EnumCategorySortKey.NAME,
    sortOrder = EnumCategorySortOrder.ASC,
  }: IGetAllCategoriesParams): Promise<ICategory[]> {
    const data = await this.prisma.category.findMany({
      orderBy: {
        [sortKey]: sortOrder === EnumCategorySortOrder.ASC ? 'asc' : 'desc',
      },
    });

    return data.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type as EnumCategoryType,
      description: category.description || '',
    }));
  }

  async create(data: CreateCategoryDto): Promise<ICategory> {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
        },
      });

      return {
        id: category.id,
        name: category.name,
        type: category.type as EnumCategoryType,
        description: category.description || '',
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('DUPLICATE_CATEGORY_NAME');
      }
      throw error;
    }
  }
}
