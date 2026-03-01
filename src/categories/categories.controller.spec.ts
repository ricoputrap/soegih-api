import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

describe('CategoriesController (RED Phase - Tests FAIL until implemented)', () => {
  let controller: CategoriesController;
  let mockService: jest.Mocked<CategoriesService>;

  const userId = 'user-123';
  const now = Math.floor(Date.now() / 1000);

  // Mock category response
  const mockCategoryResponse = {
    id: 'cat-1',
    name: 'Groceries',
    type: 'expense' as const,
    description: 'Food and groceries',
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const mockUser = { id: userId, username: 'john_doe', created_at: now };

  beforeEach(async () => {
    // Mock the SERVICE completely (controller doesn't test service logic)
    mockService = {
      create: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      deleteSingle: jest.fn(),
      deleteMultiple: jest.fn(),
      archiveName: jest.fn(),
      countTransactions: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: mockService }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  describe('GET /categories', () => {
    it('should list all categories with default pagination', async () => {
      // Arrange
      const mockCategories = [
        mockCategoryResponse,
        {
          ...mockCategoryResponse,
          id: 'cat-2',
          name: 'Salary',
          type: 'income' as const,
        },
      ];
      mockService.getAll.mockResolvedValue(mockCategories);

      // Act
      const result = await controller.getAll(mockUser, 10, 0);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockService.getAll).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
      });
    });

    it('should filter categories by type', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([mockCategoryResponse]);

      // Act
      await controller.getAll(mockUser, 10, 0, 'expense');

      // Assert
      expect(mockService.getAll).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
        type: 'expense',
      });
    });

    it('should support pagination parameters', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([mockCategoryResponse]);

      // Act
      await controller.getAll(mockUser, 20, 40);

      // Assert
      expect(mockService.getAll).toHaveBeenCalledWith(userId, {
        limit: 20,
        offset: 40,
      });
    });

    it('should support search filter', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([mockCategoryResponse]);

      // Act
      await controller.getAll(mockUser, 10, 0, undefined, undefined, 'Groc');

      // Assert
      expect(mockService.getAll).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
        search: 'Groc',
      });
    });

    it('should include deleted categories when requested', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([mockCategoryResponse]);

      // Act
      await controller.getAll(mockUser, 10, 0, undefined, undefined, undefined, true);

      // Assert
      expect(mockService.getAll).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
        include_deleted: true,
      });
    });

    it('should support sorting', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([mockCategoryResponse]);

      // Act
      await controller.getAll(mockUser, 10, 0, undefined, 'name:desc');

      // Assert
      expect(mockService.getAll).toHaveBeenCalledWith(userId, {
        limit: 10,
        offset: 0,
        sort: 'name:desc',
      });
    });

    it('should return 200 status', async () => {
      // Arrange
      mockService.getAll.mockResolvedValue([]);

      // Act
      const result = await controller.getAll(mockUser);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('GET /categories/:id', () => {
    it('should return single category by ID', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(mockCategoryResponse);

      // Act
      const result = await controller.getOne(mockUser, 'cat-1');

      // Assert
      expect(result.id).toBe('cat-1');
      expect(mockService.getById).toHaveBeenCalledWith(userId, 'cat-1');
    });

    it('should call service with correct parameters', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(mockCategoryResponse);

      // Act
      await controller.getOne(mockUser, 'cat-123');

      // Assert
      expect(mockService.getById).toHaveBeenCalledWith(userId, 'cat-123');
    });

    it('should return 200 status with category data', async () => {
      // Arrange
      mockService.getById.mockResolvedValue(mockCategoryResponse);

      // Act
      const result = await controller.getOne(mockUser, 'cat-1');

      // Assert
      expect(result).toEqual(mockCategoryResponse);
    });
  });

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
        description: 'Food and groceries',
      };
      mockService.create.mockResolvedValue(mockCategoryResponse);

      // Act
      const result = await controller.create(mockUser, createDto);

      // Assert
      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Groceries');
      expect(mockService.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should extract user from request', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Test',
        type: 'income',
      };
      mockService.create.mockResolvedValue(mockCategoryResponse);

      // Act
      await controller.create(mockUser, createDto);

      // Assert
      expect(mockService.create).toHaveBeenCalledWith(userId, createDto);
    });

    it('should return 201 status with created category', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
      };
      mockService.create.mockResolvedValue(mockCategoryResponse);

      // Act
      const result = await controller.create(mockUser, createDto);

      // Assert
      expect(result).toEqual(mockCategoryResponse);
    });

    it('should pass optional description if provided', async () => {
      // Arrange
      const createDto: CreateCategoryDto = {
        name: 'Groceries',
        type: 'expense',
        description: 'Optional description',
      };
      mockService.create.mockResolvedValue(mockCategoryResponse);

      // Act
      await controller.create(mockUser, createDto);

      // Assert
      expect(mockService.create).toHaveBeenCalledWith(userId, createDto);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update category with partial data', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Groceries',
      };
      const updatedCategory = {
        ...mockCategoryResponse,
        name: 'Updated Groceries',
      };
      mockService.update.mockResolvedValue(updatedCategory);

      // Act
      const result = await controller.update(mockUser, 'cat-1', updateDto);

      // Assert
      expect(result.name).toBe('Updated Groceries');
      expect(mockService.update).toHaveBeenCalledWith(userId, 'cat-1', updateDto);
    });

    it('should extract user ID and category ID correctly', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = { name: 'New Name' };
      mockService.update.mockResolvedValue(mockCategoryResponse);

      // Act
      await controller.update(mockUser, 'cat-456', updateDto);

      // Assert
      expect(mockService.update).toHaveBeenCalledWith(userId, 'cat-456', updateDto);
    });

    it('should return 200 status with updated category', async () => {
      // Arrange
      const updateDto: UpdateCategoryDto = { type: 'income' };
      mockService.update.mockResolvedValue(mockCategoryResponse);

      // Act
      const result = await controller.update(mockUser, 'cat-1', updateDto);

      // Assert
      expect(result).toEqual(mockCategoryResponse);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete single category without confirmation needed', async () => {
      // Arrange
      const deleteResponse = {
        status: 'DELETED' as const,
        data: {
          id: 'cat-1',
          name: 'Groceries [ARCHIVED 1709299445]',
          deleted_at: now,
        },
      };
      mockService.deleteSingle.mockResolvedValue(deleteResponse);

      // Act
      const result = await controller.deleteOne(mockUser, 'cat-1', false);

      // Assert
      expect(result.status).toBe('DELETED');
      expect(mockService.deleteSingle).toHaveBeenCalledWith(userId, 'cat-1', false);
    });

    it('should return CONFIRMATION_REQUIRED if category has transactions', async () => {
      // Arrange
      const confirmationResponse = {
        status: 'CONFIRMATION_REQUIRED' as const,
        data: {
          id: 'cat-1',
          name: 'Groceries',
          transaction_count: 5,
          message: 'This category has 5 transactions',
        },
        confirmation_required: true,
      };
      mockService.deleteSingle.mockResolvedValue(confirmationResponse);

      // Act
      const result = await controller.deleteOne(mockUser, 'cat-1', false);

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.confirmation_required).toBe(true);
    });

    it('should delete with confirmation when confirm=true', async () => {
      // Arrange
      const deleteResponse = {
        status: 'DELETED' as const,
        data: {
          id: 'cat-1',
          name: 'Groceries [ARCHIVED 1709299445]',
          deleted_at: now,
          transaction_count_archived: 5,
        },
      };
      mockService.deleteSingle.mockResolvedValue(deleteResponse);

      // Act
      await controller.deleteOne(mockUser, 'cat-1', true);

      // Assert
      expect(mockService.deleteSingle).toHaveBeenCalledWith(userId, 'cat-1', true);
    });

    it('should extract confirm parameter correctly', async () => {
      // Arrange
      const deleteResponse = {
        status: 'DELETED' as const,
        data: { id: 'cat-1', name: 'test', deleted_at: now },
      };
      mockService.deleteSingle.mockResolvedValue(deleteResponse);

      // Act
      await controller.deleteOne(mockUser, 'cat-1', undefined);

      // Assert
      expect(mockService.deleteSingle).toHaveBeenCalledWith(userId, 'cat-1', false);
    });
  });

  describe('DELETE /categories (bulk)', () => {
    it('should delete multiple categories', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2', 'cat-3'];
      const bulkDeleteResponse = {
        status: 'DELETED' as const,
        data: {
          total_selected: 3,
          deleted_count: 3,
          items: [
            { id: 'cat-1', name: 'Cat 1 [ARCHIVED]', deleted_at: now },
            { id: 'cat-2', name: 'Cat 2 [ARCHIVED]', deleted_at: now },
            { id: 'cat-3', name: 'Cat 3 [ARCHIVED]', deleted_at: now },
          ],
        },
      };
      mockService.deleteMultiple.mockResolvedValue(bulkDeleteResponse);

      // Act
      const result = await controller.deleteMany(mockUser, { ids, confirm: false });

      // Assert
      expect(result.status).toBe('DELETED');
      expect(result.data.deleted_count).toBe(3);
      expect(mockService.deleteMultiple).toHaveBeenCalledWith(userId, ids, false);
    });

    it('should return CONFIRMATION_REQUIRED if any item has transactions', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2'];
      const confirmationResponse = {
        status: 'CONFIRMATION_REQUIRED' as const,
        data: {
          items_in_use: [
            { id: 'cat-2', transaction_count: 5 },
          ],
          items_safe_to_delete: [
            { id: 'cat-1', transaction_count: 0 },
          ],
        },
        confirmation_required: true,
      };
      mockService.deleteMultiple.mockResolvedValue(confirmationResponse);

      // Act
      const result = await controller.deleteMany(mockUser, { ids });

      // Assert
      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.confirmation_required).toBe(true);
    });

    it('should delete all when confirm=true', async () => {
      // Arrange
      const ids = ['cat-1', 'cat-2'];
      const bulkDeleteResponse = {
        status: 'DELETED' as const,
        data: {
          total_selected: 2,
          deleted_count: 2,
          items: [
            { id: 'cat-1', name: 'Cat 1 [ARCHIVED]', deleted_at: now },
            { id: 'cat-2', name: 'Cat 2 [ARCHIVED]', deleted_at: now },
          ],
        },
      };
      mockService.deleteMultiple.mockResolvedValue(bulkDeleteResponse);

      // Act
      await controller.deleteMany(mockUser, { ids, confirm: true });

      // Assert
      expect(mockService.deleteMultiple).toHaveBeenCalledWith(userId, ids, true);
    });

    it('should extract user ID correctly', async () => {
      // Arrange
      const ids = ['cat-1'];
      const bulkDeleteResponse = {
        status: 'DELETED' as const,
        data: { total_selected: 1, deleted_count: 1, items: [] },
      };
      mockService.deleteMultiple.mockResolvedValue(bulkDeleteResponse);

      // Act
      await controller.deleteMany(mockUser, { ids, confirm: false });

      // Assert
      expect(mockService.deleteMultiple).toHaveBeenCalledWith(userId, ids, false);
    });

    it('should handle default confirm value (false)', async () => {
      // Arrange
      const ids = ['cat-1'];
      const bulkDeleteResponse = {
        status: 'DELETED' as const,
        data: { total_selected: 1, deleted_count: 1, items: [] },
      };
      mockService.deleteMultiple.mockResolvedValue(bulkDeleteResponse);

      // Act
      await controller.deleteMany(mockUser, { ids });

      // Assert
      expect(mockService.deleteMultiple).toHaveBeenCalledWith(userId, ids, false);
    });
  });
});
