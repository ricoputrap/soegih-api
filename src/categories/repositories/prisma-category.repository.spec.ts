import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PrismaCategoryRepository } from './prisma-category.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { EnumCategoryType } from '../categories.types';

describe('PrismaCategoryRepository', () => {
  let repository: PrismaCategoryRepository;
  let mockPrismaService: {
    category: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
  };

  const mockTimestamp = new Date('2024-01-01T00:00:00Z');
  const mockPrismaCategory = {
    id: '1',
    name: 'Utilities',
    type: 'expense',
    description: 'Electricity, Water, Gas',
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
    deleted_at: null,
  };

  const mockPrismaCategoryNoDesc = {
    id: '2',
    name: 'Salary',
    type: 'income',
    description: null,
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
    deleted_at: null,
  };

  beforeEach(async () => {
    mockPrismaService = {
      category: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaCategoryRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaCategoryRepository>(PrismaCategoryRepository);
  });

  describe('findMany', () => {
    it('should return transformed categories from Prisma', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        mockPrismaCategory,
      ]);

      const result = await repository.findMany({
        where: { deleted_at: null },
        take: 10,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
        description: 'Electricity, Water, Gas',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
        deleted_at: null,
      });
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: { deleted_at: null },
        take: 10,
        skip: 0,
      });
    });

    it('should coerce null description to empty string', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        mockPrismaCategoryNoDesc,
      ]);

      const result = await repository.findMany({});

      expect(result[0].description).toBe('');
      expect(result[0].description).not.toBeNull();
    });

    it('should pass through orderBy parameter', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      await repository.findMany({
        orderBy: { name: 'asc' },
      });

      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should handle empty result', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await repository.findMany({
        where: { deleted_at: null },
      });

      expect(result).toEqual([]);
    });

    it('should handle multiple categories with mixed descriptions', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        mockPrismaCategory,
        mockPrismaCategoryNoDesc,
      ]);

      const result = await repository.findMany({});

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Electricity, Water, Gas');
      expect(result[1].description).toBe('');
    });

    it('should handle categories with all fields present', async () => {
      const categoryWithAllFields = {
        ...mockPrismaCategory,
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
      };
      mockPrismaService.category.findMany.mockResolvedValue([
        categoryWithAllFields,
      ]);

      const result = await repository.findMany({});

      expect(result[0].created_at).toEqual(mockTimestamp);
      expect(result[0].updated_at).toEqual(mockTimestamp);
    });
  });

  describe('count', () => {
    it('should return count from Prisma', async () => {
      mockPrismaService.category.count.mockResolvedValue(42);

      const result = await repository.count({ deleted_at: null });

      expect(result).toBe(42);
      expect(mockPrismaService.category.count).toHaveBeenCalledWith({
        where: { deleted_at: null },
      });
    });

    it('should handle count with no where clause', async () => {
      mockPrismaService.category.count.mockResolvedValue(10);

      const result = await repository.count();

      expect(result).toBe(10);
      expect(mockPrismaService.category.count).toHaveBeenCalledWith({
        where: undefined,
      });
    });

    it('should handle zero count', async () => {
      mockPrismaService.category.count.mockResolvedValue(0);

      const result = await repository.count({ deleted_at: null });

      expect(result).toBe(0);
    });

    it('should pass through complex where clause', async () => {
      mockPrismaService.category.count.mockResolvedValue(5);

      await repository.count({
        deleted_at: null,
        type: 'expense',
        name: { contains: 'rent', mode: 'insensitive' },
      });

      expect(mockPrismaService.category.count).toHaveBeenCalledWith({
        where: {
          deleted_at: null,
          type: 'expense',
          name: { contains: 'rent', mode: 'insensitive' },
        },
      });
    });
  });

  describe('create', () => {
    it('should create and return transformed category', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockPrismaCategory);

      const result = await repository.create({
        name: 'Utilities',
        type: 'expense',
        description: 'Electricity, Water, Gas',
      });

      expect(result).toEqual({
        id: '1',
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
        description: 'Electricity, Water, Gas',
        created_at: mockTimestamp,
        updated_at: mockTimestamp,
        deleted_at: null,
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Utilities',
          type: 'expense',
          description: 'Electricity, Water, Gas',
        },
      });
    });

    it('should create category without description', async () => {
      mockPrismaService.category.create.mockResolvedValue(
        mockPrismaCategoryNoDesc,
      );

      const result = await repository.create({
        name: 'Salary',
        type: 'income',
      });

      expect(result.description).toBe('');
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Salary',
          type: 'income',
          description: undefined,
        },
      });
    });

    it('should throw ConflictException on P2002 duplicate key error', async () => {
      // Create a proper Prisma error that passes instanceof check
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`name`,`type`)',
        {
          code: 'P2002',
          clientVersion: '7.4.1',
        },
      );
      mockPrismaService.category.create.mockRejectedValue(prismaError);

      await expect(
        repository.create({
          name: 'Utilities',
          type: 'expense',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException with correct message', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`name`,`type`)',
        {
          code: 'P2002',
          clientVersion: '7.4.1',
        },
      );
      mockPrismaService.category.create.mockRejectedValue(prismaError);

      await expect(
        repository.create({
          name: 'Utilities',
          type: 'expense',
        }),
      ).rejects.toThrow('DUPLICATE_CATEGORY_NAME');
    });

    it('should re-throw non-P2002 Prisma errors', async () => {
      const prismaError = {
        code: 'P2025',
        message:
          'An operation failed because it depends on one or more records that were required but not found.',
      };
      mockPrismaService.category.create.mockRejectedValue(prismaError);

      await expect(
        repository.create({
          name: 'Utilities',
          type: 'expense',
        }),
      ).rejects.toEqual(prismaError);
    });

    it('should re-throw non-Prisma errors', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.category.create.mockRejectedValue(error);

      await expect(
        repository.create({
          name: 'Utilities',
          type: 'expense',
        }),
      ).rejects.toEqual(error);
    });

    it('should handle created_at and updated_at as dates', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockPrismaCategory);

      const result = await repository.create({
        name: 'Utilities',
        type: 'expense',
      });

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle deleted_at as null', async () => {
      mockPrismaService.category.create.mockResolvedValue(mockPrismaCategory);

      const result = await repository.create({
        name: 'Utilities',
        type: 'expense',
      });

      expect(result.deleted_at).toBeNull();
    });

    it('should handle deleted_at as Date when soft-deleted', async () => {
      const deletedCategory = {
        ...mockPrismaCategory,
        deleted_at: mockTimestamp,
      };
      mockPrismaService.category.create.mockResolvedValue(deletedCategory);

      const result = await repository.create({
        name: 'Utilities',
        type: 'expense',
      });

      expect(result.deleted_at).toEqual(mockTimestamp);
    });
  });

  describe('toICategory (private method via public methods)', () => {
    it('should cast type string to EnumCategoryType', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { ...mockPrismaCategory, type: 'income' },
      ]);

      const result = await repository.findMany({});

      expect(result[0].type).toBe(EnumCategoryType.INCOME);
    });

    it('should preserve non-null description exactly', async () => {
      const categoryWithDesc = {
        ...mockPrismaCategory,
        description: 'Test Description with Special Chars: !@#$%',
      };
      mockPrismaService.category.findMany.mockResolvedValue([categoryWithDesc]);

      const result = await repository.findMany({});

      expect(result[0].description).toBe(
        'Test Description with Special Chars: !@#$%',
      );
    });

    it('should coerce empty string description to empty string (not null)', async () => {
      const categoryEmptyDesc = {
        ...mockPrismaCategory,
        description: '',
      };
      mockPrismaService.category.findMany.mockResolvedValue([
        categoryEmptyDesc,
      ]);

      const result = await repository.findMany({});

      expect(result[0].description).toBe('');
    });
  });
});
