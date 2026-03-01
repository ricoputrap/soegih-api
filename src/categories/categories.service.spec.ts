import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  ICategoriesRepository,
  CATEGORIES_REPOSITORY_TOKEN,
  Category,
} from './repositories/categories.repository.interface';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

describe('CategoriesService (RED Phase - Tests FAIL until implemented)', () => {
  let service: CategoriesService;
  let mockRepository: jest.Mocked<ICategoriesRepository>;

  const userId = 'user-123';
  const now = Math.floor(Date.now() / 1000);

  // Mock category for testing
  const mockCategory: Category = {
    id: 'cat-1',
    user_id: userId,
    name: 'Groceries',
    type: 'expense',
    description: 'Food and groceries',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  beforeEach(async () => {
    // Mock ONLY the repository dependency
    mockRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByNameAndType: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      countTransactions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CATEGORIES_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create()', () => {
    it('should create a category with valid input', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
        description: 'Food and groceries',
      };
      mockRepository.create.mockResolvedValue(mockCategory);

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Groceries');
      expect(result.type).toBe('expense');
      expect(mockRepository.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should throw ConflictException if category name+type already exists', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
      };
      mockRepository.create.mockRejectedValue(
        new ConflictException('Category already exists'),
      );

      // Act & Assert
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should create category with optional description omitted', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Salary',
        type: 'income',
      };
      const categoryWithoutDesc: Category = {
        ...mockCategory,
        name: 'Salary',
        type: 'income',
        description: null,
      };
      mockRepository.create.mockResolvedValue(categoryWithoutDesc);

      // Act
      const result = await service.create(userId, createDto);

      // Assert
      expect(result.description).toBeNull();
    });
  });

  describe('getAll()', () => {
    it('should return all categories for user', async () => {
      // Arrange
      const mockCategories = [
        mockCategory,
        {
          ...mockCategory,
          id: 'cat-2',
          name: 'Salary',
          type: 'income',
        },
      ];
      mockRepository.findMany.mockResolvedValue({
        items: mockCategories,
        total: 2,
      });

      // Act
      const result = await service.getAll(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Groceries');
      expect(result[1].name).toBe('Salary');
      expect(mockRepository.findMany).toHaveBeenCalledWith(userId, {});
    });

    it('should return empty list if user has no categories', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue({
        items: [],
        total: 0,
      });

      // Act
      const result = await service.getAll(userId);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should filter by category type', async () => {
      // Arrange
      const expenseCategories = [mockCategory];
      mockRepository.findMany.mockResolvedValue({
        items: expenseCategories,
        total: 1,
      });

      // Act
      const result = await service.getAll(userId, { type: 'expense' });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('expense');
      expect(mockRepository.findMany).toHaveBeenCalledWith(userId, {
        type: 'expense',
      });
    });

    it('should support pagination with limit and offset', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue({
        items: [mockCategory],
        total: 50,
      });

      // Act
      const result = await service.getAll(userId, { limit: 10, offset: 20 });

      // Assert
      expect(mockRepository.findMany).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 20,
      });
    });

    it('should support search by name', async () => {
      // Arrange
      mockRepository.findMany.mockResolvedValue({
        items: [mockCategory],
        total: 1,
      });

      // Act
      await service.getAll(userId, { search: 'Groc' });

      // Assert
      expect(mockRepository.findMany).toHaveBeenCalledWith(userId, {
        search: 'Groc',
      });
    });

    it('should include deleted categories when include_deleted=true', async () => {
      // Arrange
      const deletedCategory: Category = {
        ...mockCategory,
        deleted_at: now - 86400,
      };
      mockRepository.findMany.mockResolvedValue({
        items: [mockCategory, deletedCategory],
        total: 2,
      });

      // Act
      const result = await service.getAll(userId, { include_deleted: true });

      // Assert
      expect(result).toHaveLength(2);
      expect(mockRepository.findMany).toHaveBeenCalledWith(userId, {
        include_deleted: true,
      });
    });
  });

  describe('getById()', () => {
    it('should return category by ID', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(mockCategory);

      // Act
      const result = await service.getById(userId, 'cat-1');

      // Assert
      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Groceries');
      expect(mockRepository.findById).toHaveBeenCalledWith('cat-1', userId);
    });

    it('should throw NotFoundException if category not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getById(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent accessing other user\'s categories (user isolation)', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);
      const otherUserId = 'user-456';

      // Act & Assert
      await expect(service.getById(otherUserId, 'cat-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findById).toHaveBeenCalledWith('cat-1', otherUserId);
    });

    it('should not return deleted categories', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null); // Deleted categories return null

      // Act & Assert
      await expect(service.getById(userId, 'cat-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update()', () => {
    it('should update category with partial data', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Groceries',
      };
      const updatedCategory: Category = {
        ...mockCategory,
        name: 'Updated Groceries',
        updated_at: now + 1,
      };
      mockRepository.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await service.update(userId, 'cat-1', updateDto);

      // Assert
      expect(result.name).toBe('Updated Groceries');
      expect(mockRepository.update).toHaveBeenCalledWith(
        'cat-1',
        userId,
        updateDto,
      );
    });

    it('should throw NotFoundException if category does not exist', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = { name: 'New Name' };
      mockRepository.update.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      // Act & Assert
      await expect(service.update(userId, 'nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new name+type already exists', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = {
        name: 'Salary', // Already exists as income
        type: 'income',
      };
      mockRepository.update.mockRejectedValue(
        new ConflictException('Category already exists'),
      );

      // Act & Assert
      await expect(service.update(userId, 'cat-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating only description', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = {
        description: 'New description',
      };
      const updatedCategory: Category = {
        ...mockCategory,
        description: 'New description',
      };
      mockRepository.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await service.update(userId, 'cat-1', updateDto);

      // Assert
      expect(result.description).toBe('New description');
    });

    it('should prevent updating other user\'s categories (user isolation)', async () => {
      // Arrange
      const otherUserId = 'user-456';
      const updateDto: UpdateCategoryDto = { name: 'Hacked' };
      mockRepository.update.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      // Act & Assert
      await expect(
        service.update(otherUserId, 'cat-1', updateDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'cat-1',
        otherUserId,
        updateDto,
      );
    });
  });

  describe('deleteSingle()', () => {
    it('should soft-delete category without transactions (no confirmation needed)', async () => {
      // Arrange
      mockRepository.countTransactions.mockResolvedValue(0);
      mockRepository.softDelete.mockResolvedValue({
        ...mockCategory,
        name: 'Groceries [ARCHIVED 1709299445]',
        deleted_at: now,
      });

      // Act
      const result = await service.deleteSingle(userId, 'cat-1', false);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.name).toContain('[ARCHIVED');
      expect(mockRepository.softDelete).toHaveBeenCalled();
    });

    it('should return CONFIRMATION_REQUIRED if category has transactions and confirm=false', async () => {
      // Arrange
      mockRepository.countTransactions.mockResolvedValue(5);

      // Act
      const result = await service.deleteSingle(userId, 'cat-1', false);

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.data.transaction_count).toBe(5);
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should soft-delete category with transactions when confirm=true', async () => {
      // Arrange
      mockRepository.countTransactions.mockResolvedValue(5);
      mockRepository.softDelete.mockResolvedValue({
        ...mockCategory,
        name: 'Groceries [ARCHIVED 1709299445]',
        deleted_at: now,
      });

      // Act
      const result = await service.deleteSingle(userId, 'cat-1', true);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.transaction_count_archived).toBe(5);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      // Arrange
      mockRepository.countTransactions.mockResolvedValue(0);
      mockRepository.softDelete.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      // Act & Assert
      await expect(service.deleteSingle(userId, 'nonexistent', false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should preserve transaction count in response', async () => {
      // Arrange
      const transactionCount = 3;
      mockRepository.countTransactions.mockResolvedValue(transactionCount);
      mockRepository.softDelete.mockResolvedValue({
        ...mockCategory,
        deleted_at: now,
      });

      // Act
      const result = await service.deleteSingle(userId, 'cat-1', true);

      // Assert
      expect(result.data.transaction_count_archived).toBe(transactionCount);
    });
  });

  describe('deleteMultiple()', () => {
    it('should soft-delete multiple categories without transactions', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2', 'cat-3'];
      mockRepository.countTransactions
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockRepository.softDelete
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-1',
          deleted_at: now,
        })
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-2',
          deleted_at: now,
        })
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-3',
          deleted_at: now,
        });

      // Act
      const result = await service.deleteMultiple(userId, ids, false);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_count).toBe(3);
      expect(result.data.total_selected).toBe(3);
    });

    it('should return CONFIRMATION_REQUIRED if any category has transactions and confirm=false', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2'];
      mockRepository.countTransactions
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5); // cat-2 has transactions

      // Act
      const result = await service.deleteMultiple(userId, ids, false);

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.data.items_in_use).toBeDefined();
      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('should delete all categories when confirm=true regardless of transactions', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2'];
      mockRepository.countTransactions
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5);
      mockRepository.softDelete
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-1',
          deleted_at: now,
        })
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-2',
          deleted_at: now,
        });

      // Act
      const result = await service.deleteMultiple(userId, ids, true);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_count).toBe(2);
    });

    it('should handle empty array gracefully', async () => {
      // Arrange
      const ids: string[] = [];

      // Act & Assert
      await expect(service.deleteMultiple(userId, ids, false)).rejects.toThrow();
    });

    it('should report transaction counts for each deleted item', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2'];
      mockRepository.countTransactions
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(0);
      mockRepository.softDelete
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-1',
          deleted_at: now,
        })
        .mockResolvedValueOnce({
          ...mockCategory,
          id: 'cat-2',
          deleted_at: now,
        });

      // Act
      const result = await service.deleteMultiple(userId, ids, true);

      // Assert
      expect(result.data.items[0].transaction_count_archived).toBe(3);
      expect(result.data.items[1].transaction_count_archived).toBe(0);
    });
  });

  describe('archiveName()', () => {
    it('should append [ARCHIVED timestamp] to category name', async () => {
      // Arrange
      const category: Category = {
        ...mockCategory,
        name: 'Groceries',
      };

      // Act
      const archivedName = service.archiveName(category);

      // Assert
      expect(archivedName).toContain('Groceries');
      expect(archivedName).toContain('[ARCHIVED');
      expect(archivedName).toContain(']');
    });

    it('should include timestamp in archived name', async () => {
      // Arrange
      const category: Category = mockCategory;

      // Act
      const archivedName = service.archiveName(category);

      // Assert
      expect(archivedName).toMatch(/\[\d+\]/); // Timestamp in brackets
    });
  });

  describe('countTransactions()', () => {
    it('should return transaction count for a category', async () => {
      // Arrange
      mockRepository.countTransactions.mockResolvedValue(5);

      // Act
      const count = await service.countTransactions('cat-1');

      // Assert
      expect(count).toBe(5);
      expect(mockRepository.countTransactions).toHaveBeenCalledWith('cat-1');
    });

    it('should return 0 if category has no transactions', async () => {
      // Arrange
      mockRepository.countTransactions.mockResolvedValue(0);

      // Act
      const count = await service.countTransactions('cat-1');

      // Assert
      expect(count).toBe(0);
    });
  });
});
