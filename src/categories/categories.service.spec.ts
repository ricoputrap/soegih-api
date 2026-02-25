import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  EnumCategoryType,
  EnumCategorySortKey,
  EnumCategorySortOrder,
} from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY_TOKEN,
} from './repositories/category.repository.interface';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockRepository: jest.Mocked<ICategoryRepository>;

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
    // Mock repository
    mockRepository = {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      countTransactions: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CATEGORY_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('getAll', () => {
    it('should return categories with default pagination', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory]);
      mockRepository.count.mockResolvedValue(1);

      const result = await service.getAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Utilities');
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.has_next).toBe(false);
      expect(result.pagination.has_previous).toBe(false);
      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
          where: { deleted_at: null },
        }),
      );
    });

    it('should clamp limit between 1 and 100', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      // Test limit too high - should clamp to 100
      await service.getAll({ limit: 200 });
      expect(mockRepository.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 100 }),
      );

      // Test limit at minimum valid - should be 1
      mockRepository.findMany.mockClear();
      mockRepository.count.mockClear();
      await service.getAll({ limit: 1 });
      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 }),
      );
    });

    it('should set offset to 0 if negative', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await service.getAll({ offset: -5 });
      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0 }),
      );
    });

    it('should filter by type', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory2]);
      mockRepository.count.mockResolvedValue(1);

      await service.getAll({ type: EnumCategoryType.INCOME });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: EnumCategoryType.INCOME,
            deleted_at: null,
          }),
        }),
      );
    });

    it('should search by name with case-insensitive matching', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory]);
      mockRepository.count.mockResolvedValue(1);

      await service.getAll({ search: 'UTILITIES' });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
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
      mockRepository.findMany.mockResolvedValue([
        mockCategory,
        deletedCategory,
      ]);
      mockRepository.count.mockResolvedValue(2);

      await service.getAll({ include_deleted: true });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should sort by name in ascending order', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory]);
      mockRepository.count.mockResolvedValue(1);

      await service.getAll({
        sortKey: EnumCategorySortKey.NAME,
        sortOrder: EnumCategorySortOrder.ASC,
      });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should sort by name in descending order', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory]);
      mockRepository.count.mockResolvedValue(1);

      await service.getAll({
        sortKey: EnumCategorySortKey.NAME,
        sortOrder: EnumCategorySortOrder.DESC,
      });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory, mockCategory2]);
      mockRepository.count.mockResolvedValue(50);

      const result = await service.getAll({ limit: 10, offset: 20 });

      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(20);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.has_next).toBe(true); // 20 + 10 < 50
      expect(result.pagination.has_previous).toBe(true); // 20 > 0
    });

    it('should return empty array when no categories found', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.getAll({});

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.has_next).toBe(false);
    });

    it('should include metadata in response', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory]);
      mockRepository.count.mockResolvedValue(1);

      const result = await service.getAll({});

      expect(result.meta.version).toBe('1.0');
      expect(result.meta.timestamp).toBeDefined();
      expect(typeof result.meta.timestamp).toBe('string');
    });

    it('should execute findMany and count in parallel', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory]);
      mockRepository.count.mockResolvedValue(1);

      await service.getAll({});

      expect(mockRepository.findMany).toHaveBeenCalled();
      expect(mockRepository.count).toHaveBeenCalled();
    });

    it('should combine multiple filters', async () => {
      mockRepository.findMany.mockResolvedValue([mockCategory2]);
      mockRepository.count.mockResolvedValue(1);

      await service.getAll({
        type: EnumCategoryType.INCOME,
        search: 'salary',
        offset: 5,
        limit: 20,
      });

      expect(mockRepository.findMany).toHaveBeenCalledWith(
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
      mockRepository.create.mockResolvedValue(mockCategory);

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
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        type: createDto.type,
        description: createDto.description,
      });
    });

    it('should create a category with optional description', async () => {
      const categoryNoDesc = {
        ...mockCategory,
        description: '',
      };
      mockRepository.create.mockResolvedValue(categoryNoDesc);

      const createDto: CreateCategoryDto = {
        name: 'Salary',
        type: EnumCategoryType.INCOME,
      };

      const result = await service.create(createDto);

      expect(result.data.description).toBe('');
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'Salary',
        type: EnumCategoryType.INCOME,
        description: undefined,
      });
    });

    it('should throw ConflictException on duplicate category', async () => {
      mockRepository.create.mockRejectedValue(
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
      mockRepository.create.mockResolvedValue(mockCategory);

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

    it('should return category with all fields', async () => {
      mockRepository.create.mockResolvedValue(mockCategory);

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

  describe('update', () => {
    it('should update a category successfully and return correct shape', async () => {
      const updatedCategory = { ...mockCategory, name: 'Updated Utilities' };
      mockRepository.update.mockResolvedValue(updatedCategory);

      const updateDto: UpdateCategoryDto = { name: 'Updated Utilities' };
      const result = await service.update('1', updateDto);

      expect(result.data).toEqual(updatedCategory);
      expect(result.meta.version).toBe('1.0');
      expect(typeof result.meta.timestamp).toBe('string');
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should pass only provided fields to repository (partial update)', async () => {
      const updatedCategory = {
        ...mockCategory,
        description: 'New description',
      };
      mockRepository.update.mockResolvedValue(updatedCategory);

      const updateDto: UpdateCategoryDto = { description: 'New description' };
      await service.update('1', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        description: 'New description',
      });
    });

    it('should re-throw NotFoundException from repository', async () => {
      mockRepository.update.mockRejectedValue(
        new NotFoundException('CATEGORY_NOT_FOUND'),
      );

      await expect(
        service.update('nonexistent-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should re-throw ConflictException from repository', async () => {
      mockRepository.update.mockRejectedValue(
        new ConflictException('DUPLICATE_CATEGORY_NAME'),
      );

      await expect(service.update('1', { name: 'Salary' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteSingle', () => {
    it('should throw NotFoundException when category does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteSingle('nonexistent', false)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteSingle('nonexistent', false)).rejects.toThrow(
        'CATEGORY_NOT_FOUND',
      );
    });

    it('should throw NotFoundException when category is already soft-deleted', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockCategory,
        deleted_at: mockTimestamp,
      });

      await expect(service.deleteSingle('1', false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return CONFIRMATION_REQUIRED when category is used in transactions and confirm=false', async () => {
      mockRepository.findById.mockResolvedValue(mockCategory);
      mockRepository.countTransactions.mockResolvedValue(3);

      const result = await service.deleteSingle('1', false);

      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.confirmation_required).toBe(true);
      expect(result.data.transaction_count).toBe(3);
      expect(result.data.warning).toBeDefined();
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should delete immediately when category has no transactions and confirm=false', async () => {
      mockRepository.findById.mockResolvedValue(mockCategory);
      mockRepository.countTransactions.mockResolvedValue(0);
      const archivedCategory = {
        ...mockCategory,
        name: 'Utilities [ARCHIVED ...]',
        deleted_at: new Date(),
      };
      mockRepository.softDelete.mockResolvedValue(archivedCategory);

      const result = await service.deleteSingle('1', false);

      expect(result.status).toBe('DELETED');
      expect(result.confirmation_required).toBe(false);
      expect(result.data.transaction_count_archived).toBeUndefined();
      expect(mockRepository.softDelete).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: expect.stringContaining('[ARCHIVED') }),
      );
    });

    it('should delete and include transaction_count_archived when confirm=true', async () => {
      mockRepository.findById.mockResolvedValue(mockCategory);
      mockRepository.countTransactions.mockResolvedValue(5);
      const archivedCategory = {
        ...mockCategory,
        name: 'Utilities [ARCHIVED ...]',
        deleted_at: new Date(),
      };
      mockRepository.softDelete.mockResolvedValue(archivedCategory);

      const result = await service.deleteSingle('1', true);

      expect(result.status).toBe('DELETED');
      expect(result.confirmation_required).toBe(false);
      expect(result.data.transaction_count_archived).toBe(5);
    });

    it('should include [ARCHIVED ...] suffix in archived name', async () => {
      mockRepository.findById.mockResolvedValue(mockCategory);
      mockRepository.countTransactions.mockResolvedValue(0);
      mockRepository.softDelete.mockResolvedValue({
        ...mockCategory,
        name: 'Utilities [ARCHIVED 2024-01-01T00:00:00.000Z]',
        deleted_at: new Date(),
      });

      await service.deleteSingle('1', false);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: expect.stringMatching(/^Utilities \[ARCHIVED .+\]$/),
          deleted_at: expect.any(Date),
        }),
      );
    });

    it('should include metadata in response', async () => {
      mockRepository.findById.mockResolvedValue(mockCategory);
      mockRepository.countTransactions.mockResolvedValue(0);
      mockRepository.softDelete.mockResolvedValue({
        ...mockCategory,
        deleted_at: new Date(),
      });

      const result = await service.deleteSingle('1', false);

      expect(result.meta.version).toBe('1.0');
      expect(typeof result.meta.timestamp).toBe('string');
    });
  });
});
