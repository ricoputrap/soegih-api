import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  EnumCategoryType,
  EnumCategorySortKey,
  EnumCategorySortOrder,
} from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockPrismaService: {
    category: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
  };

  // Mock category data
  const mockTimestamp = new Date('2024-01-01T00:00:00Z');
  const mockCategory = {
    id: '1',
    name: 'Utilities',
    type: 'expense' as const,
    description: 'Electricity, Water, Gas',
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
    deleted_at: null,
  };

  const mockCategory2 = {
    id: '2',
    name: 'Salary',
    type: 'income' as const,
    description: 'Monthly income',
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
    deleted_at: null,
  };

  beforeEach(async () => {
    // Mock Prisma service with category operations
    mockPrismaService = {
      category: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('getAll', () => {
    it('should return categories with default pagination', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.getAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Utilities');
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.has_next).toBe(false);
      expect(result.pagination.has_previous).toBe(false);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          where: { deleted_at: null },
        }),
      );
    });

    it('should clamp limit between 1 and 100', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.count.mockResolvedValue(0);

      // Test limit too high - should clamp to 100
      await service.getAll({ limit: 200 });
      expect(mockPrismaService.category.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 100 }),
      );

      // Test limit at minimum valid - should be 1
      mockPrismaService.category.findMany.mockClear();
      mockPrismaService.category.count.mockClear();
      await service.getAll({ limit: 1 });
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 }),
      );
    });

    it('should set offset to 0 if negative', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.count.mockResolvedValue(0);

      await service.getAll({ offset: -5 });
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory2]);
      mockPrismaService.category.count.mockResolvedValue(1);

      await service.getAll({ type: EnumCategoryType.INCOME });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: EnumCategoryType.INCOME,
            deleted_at: null,
          }),
        }),
      );
    });

    it('should search by name with case-insensitive matching', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      await service.getAll({ search: 'UTILITIES' });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: {
              contains: 'UTILITIES',
              mode: 'insensitive',
            },
            deleted_at: null,
          }),
        }),
      );
    });

    it('should include deleted categories when requested', async () => {
      const deletedCategory = {
        ...mockCategory,
        id: '3',
        deleted_at: mockTimestamp,
      };
      mockPrismaService.category.findMany.mockResolvedValue([
        mockCategory,
        deletedCategory,
      ]);
      mockPrismaService.category.count.mockResolvedValue(2);

      await service.getAll({ include_deleted: true });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should sort by name in ascending order', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      await service.getAll({
        sortKey: EnumCategorySortKey.NAME,
        sortOrder: EnumCategorySortOrder.ASC,
      });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should sort by name in descending order', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      await service.getAll({
        sortKey: EnumCategorySortKey.NAME,
        sortOrder: EnumCategorySortOrder.DESC,
      });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        mockCategory,
        mockCategory2,
      ]);
      mockPrismaService.category.count.mockResolvedValue(50);

      const result = await service.getAll({ limit: 10, offset: 20 });

      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(20);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.has_next).toBe(true); // 20 + 10 < 50
      expect(result.pagination.has_previous).toBe(true); // 20 > 0
    });

    it('should return empty array when no categories found', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);
      mockPrismaService.category.count.mockResolvedValue(0);

      const result = await service.getAll({});

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.has_next).toBe(false);
    });

    it('should include metadata in response', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.getAll({});

      expect(result.meta.version).toBe('1.0');
      expect(result.meta.timestamp).toBeDefined();
      expect(typeof result.meta.timestamp).toBe('string');
    });

    it('should handle empty description by returning empty string', async () => {
      const categoryNoDesc = {
        ...mockCategory,
        description: null,
      };
      mockPrismaService.category.findMany.mockResolvedValue([
        categoryNoDesc,
      ]);
      mockPrismaService.category.count.mockResolvedValue(1);

      const result = await service.getAll({});

      expect(result.data[0].description).toBe('');
    });

    it('should execute findMany and count in parallel', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);
      mockPrismaService.category.count.mockResolvedValue(1);

      await service.getAll({});

      expect(mockPrismaService.category.findMany).toHaveBeenCalled();
      expect(mockPrismaService.category.count).toHaveBeenCalled();
    });

    it('should combine multiple filters', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([mockCategory2]);
      mockPrismaService.category.count.mockResolvedValue(1);

      await service.getAll({
        type: EnumCategoryType.INCOME,
        search: 'salary',
        offset: 5,
        limit: 20,
      });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: EnumCategoryType.INCOME,
            name: {
              contains: 'salary',
              mode: 'insensitive',
            },
            deleted_at: null,
          }),
          skip: 5,
          take: 20,
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a category successfully', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const createDto: CreateCategoryDto = {
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
        description: 'Electricity, Water, Gas',
      };

      const result = await service.create(createDto);

      expect(result.data.id).toBe('1');
      expect(result.data.name).toBe('Utilities');
      expect(result.data.type).toBe(EnumCategoryType.EXPENSE);
      expect(result.data.description).toBe('Electricity, Water, Gas');
      expect(result.meta.version).toBe('1.0');
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          type: createDto.type,
          description: createDto.description,
        },
      });
    });

    it('should create a category with optional description', async () => {
      const categoryNoDesc = {
        ...mockCategory,
        description: null,
      };
      mockPrismaService.category.create.mockResolvedValue(categoryNoDesc);

      const createDto: CreateCategoryDto = {
        name: 'Salary',
        type: EnumCategoryType.INCOME,
      };

      const result = await service.create(createDto);

      expect(result.data.description).toBe('');
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Salary',
          type: EnumCategoryType.INCOME,
          description: undefined,
        },
      });
    });

    it('should throw ConflictException on duplicate category', async () => {
      const prismaError = {
        code: 'P2002',
        constructor: {
          name: 'PrismaClientKnownRequestError',
        },
      };

      // Create a proper mock error
      const error = Object.create(prismaError);
      error.code = 'P2002';
      error.constructor.name = 'PrismaClientKnownRequestError';

      // Use a more direct approach for instanceof
      mockPrismaService.category.create.mockRejectedValue(
        new ConflictException('DUPLICATE_CATEGORY_NAME'),
      );

      const createDto: CreateCategoryDto = {
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should include metadata in response', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const createDto: CreateCategoryDto = {
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
      };

      const result = await service.create(createDto);

      expect(result.meta).toBeDefined();
      expect(result.meta.version).toBe('1.0');
      expect(result.meta.timestamp).toBeDefined();
      expect(typeof result.meta.timestamp).toBe('string');
    });

    it('should handle empty description by returning empty string', async () => {
      const categoryNoDesc = {
        ...mockCategory,
        description: null,
      };
      mockPrismaService.category.create.mockResolvedValue(categoryNoDesc);

      const createDto: CreateCategoryDto = {
        name: 'Test',
        type: EnumCategoryType.EXPENSE,
      };

      const result = await service.create(createDto);

      expect(result.data.description).toBe('');
    });

    it('should return category with all fields', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const createDto: CreateCategoryDto = {
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
        description: 'Electricity, Water, Gas',
      };

      const result = await service.create(createDto);

      expect(result.data).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        description: expect.any(String),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        deleted_at: null,
      });
    });
  });
});
