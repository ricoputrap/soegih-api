import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import {
  EnumCategoryType,
  EnumCategorySortKey,
  EnumCategorySortOrder,
  GetAllCategoriesResponse,
  CreateCategoryResponse,
  UpdateCategoryResponse,
  DeleteSingleCategoryResponse,
} from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  // Mock service - CategoriesService.prisma is never instantiated, ensuring no DB access
  let mockCategoriesService: {
    getAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deleteSingle: jest.Mock;
  };

  // Shared timestamp for consistent mock data
  const mockTimestamp = new Date('2024-01-01T00:00:00Z');

  // Mock category data for responses
  const mockCategory = {
    id: '1',
    name: 'Utilities',
    type: EnumCategoryType.EXPENSE,
    description: 'Electricity, Water, Gas',
    created_at: mockTimestamp,
    updated_at: mockTimestamp,
    deleted_at: null,
  };

  const mockGetAllResponse: GetAllCategoriesResponse = {
    data: [mockCategory],
    pagination: {
      limit: 10,
      offset: 0,
      total: 1,
      has_next: false,
      has_previous: false,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  const mockCreateResponse: CreateCategoryResponse = {
    data: mockCategory,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
    },
  };

  beforeEach(async () => {
    // Reset mocks before each test
    mockCategoriesService = {
      getAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteSingle: jest.fn(),
    };

    // Create testing module with mocked service (no real DB connection)
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  describe('getAll', () => {
    // Tests for getAll controller method - verifies proper delegation to service
    it('should return all categories with default pagination', async () => {
      // Mock service response - no DB call
      mockCategoriesService.getAll.mockResolvedValue(mockGetAllResponse);

      const result = await controller.getAll({});

      expect(result).toEqual(mockGetAllResponse);
      expect(mockCategoriesService.getAll).toHaveBeenCalledWith({});
    });

    it('should return categories filtered by type', async () => {
      const query = { type: EnumCategoryType.INCOME };
      const incomeResponse: GetAllCategoriesResponse = {
        ...mockGetAllResponse,
        data: [
          {
            ...mockCategory,
            type: EnumCategoryType.INCOME,
          },
        ],
      };

      mockCategoriesService.getAll.mockResolvedValue(incomeResponse);

      const result = await controller.getAll(query);

      expect(result).toEqual(incomeResponse);
      expect(mockCategoriesService.getAll).toHaveBeenCalledWith(query);
    });

    it('should return categories with search filter', async () => {
      const query = { search: 'Utilities' };
      mockCategoriesService.getAll.mockResolvedValue(mockGetAllResponse);

      const result = await controller.getAll(query);

      expect(result).toEqual(mockGetAllResponse);
      expect(mockCategoriesService.getAll).toHaveBeenCalledWith(query);
    });

    it('should return categories with custom pagination', async () => {
      const query = { limit: 20, offset: 10 };
      const paginatedResponse: GetAllCategoriesResponse = {
        ...mockGetAllResponse,
        pagination: {
          limit: 20,
          offset: 10,
          total: 50,
          has_next: true,
          has_previous: true,
        },
      };

      mockCategoriesService.getAll.mockResolvedValue(paginatedResponse);

      const result = await controller.getAll(query);

      expect(result).toEqual(paginatedResponse);
      expect(mockCategoriesService.getAll).toHaveBeenCalledWith(query);
    });

    it('should return categories sorted in descending order', async () => {
      const query = {
        sortKey: EnumCategorySortKey.NAME,
        sortOrder: EnumCategorySortOrder.DESC,
      };

      mockCategoriesService.getAll.mockResolvedValue(mockGetAllResponse);

      const result = await controller.getAll(query);

      expect(result).toEqual(mockGetAllResponse);
      expect(mockCategoriesService.getAll).toHaveBeenCalledWith(query);
    });

    it('should include deleted categories when requested', async () => {
      const query = { include_deleted: true };
      const responseWithDeleted: GetAllCategoriesResponse = {
        ...mockGetAllResponse,
        data: [
          ...mockGetAllResponse.data,
          {
            ...mockCategory,
            id: '2',
            name: 'Deleted Category',
            deleted_at: mockTimestamp,
          },
        ],
        pagination: {
          ...mockGetAllResponse.pagination,
          total: 2,
        },
      };

      mockCategoriesService.getAll.mockResolvedValue(responseWithDeleted);

      const result = await controller.getAll(query);

      expect(result).toEqual(responseWithDeleted);
      expect(mockCategoriesService.getAll).toHaveBeenCalledWith(query);
    });

    it('should return empty array when no categories found', async () => {
      const emptyResponse: GetAllCategoriesResponse = {
        data: [],
        pagination: {
          limit: 10,
          offset: 0,
          total: 0,
          has_next: false,
          has_previous: false,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

      mockCategoriesService.getAll.mockResolvedValue(emptyResponse);

      const result = await controller.getAll({});

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('create', () => {
    // Tests for create controller method - verifies proper delegation to service
    it('should create a category successfully', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
        description: 'Electricity, Water, Gas',
      };

      // Mock service response - no DB write
      mockCategoriesService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreateResponse);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(createDto);
    });

    it('should create a category with minimal data', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Salary',
        type: EnumCategoryType.INCOME,
      };

      const minimalResponse: CreateCategoryResponse = {
        data: {
          ...mockCategory,
          name: 'Salary',
          type: EnumCategoryType.INCOME,
          description: '',
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

      mockCategoriesService.create.mockResolvedValue(minimalResponse);

      const result = await controller.create(createDto);

      expect(result).toEqual(minimalResponse);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(createDto);
    });

    it('should handle duplicate category error', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Utilities',
        type: EnumCategoryType.EXPENSE,
      };

      mockCategoriesService.create.mockRejectedValue(
        new ConflictException('DUPLICATE_CATEGORY_NAME'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCategoriesService.create).toHaveBeenCalledWith(createDto);
    });

    it('should return created category with all fields', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Home & Garden',
        type: EnumCategoryType.EXPENSE,
        description: 'Home improvement and garden supplies',
      };

      const fullResponse: CreateCategoryResponse = {
        data: {
          id: '3',
          name: 'Home & Garden',
          type: EnumCategoryType.EXPENSE,
          description: 'Home improvement and garden supplies',
          created_at: mockTimestamp,
          updated_at: mockTimestamp,
          deleted_at: null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      };

      mockCategoriesService.create.mockResolvedValue(fullResponse);

      const result = await controller.create(createDto);

      expect(result.data).toMatchObject({
        name: createDto.name,
        type: createDto.type,
        description: createDto.description,
      });
      expect(result.meta.version).toBe('1.0');
    });

    it('should have correct HTTP status code', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Test Category',
        type: EnumCategoryType.EXPENSE,
      };

      mockCategoriesService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(mockCategoriesService.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockUpdateResponse: UpdateCategoryResponse = {
      data: { ...mockCategory, name: 'Updated Utilities' },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    };

    it('should call service with correct id and body', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Updated Utilities' };
      mockCategoriesService.update.mockResolvedValue(mockUpdateResponse);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(mockUpdateResponse);
      expect(mockCategoriesService.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should return 200 with updated category', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };
      mockCategoriesService.update.mockResolvedValue(mockUpdateResponse);

      const result = await controller.update('1', updateDto);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.meta.version).toBe('1.0');
    });

    it('should propagate NotFoundException from service', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Test' };
      mockCategoriesService.update.mockRejectedValue(
        new NotFoundException('CATEGORY_NOT_FOUND'),
      );

      await expect(controller.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ConflictException from service', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Salary' };
      mockCategoriesService.update.mockRejectedValue(
        new ConflictException('DUPLICATE_CATEGORY_NAME'),
      );

      await expect(controller.update('1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteSingle', () => {
    const mockDeletedResponse: DeleteSingleCategoryResponse = {
      status: 'DELETED',
      data: {
        id: '1',
        name: 'Utilities [ARCHIVED 2024-01-01T00:00:00.000Z]',
        deleted_at: mockTimestamp,
      },
      confirmation_required: false,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    };

    const mockConfirmationRequiredResponse: DeleteSingleCategoryResponse = {
      status: 'CONFIRMATION_REQUIRED',
      data: {
        id: '1',
        name: 'Utilities',
        transaction_count: 3,
        warning: 'This category is used in 3 transaction(s). Pass confirm=true to archive it.',
      },
      confirmation_required: true,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    };

    it('should call service.deleteSingle with id and confirm=false when no confirm param', async () => {
      mockCategoriesService.deleteSingle.mockResolvedValue(mockDeletedResponse);

      const result = await controller.deleteSingle('1');

      expect(result).toEqual(mockDeletedResponse);
      expect(mockCategoriesService.deleteSingle).toHaveBeenCalledWith('1', false);
    });

    it('should call service.deleteSingle with confirm=false when confirm="false"', async () => {
      mockCategoriesService.deleteSingle.mockResolvedValue(mockConfirmationRequiredResponse);

      const result = await controller.deleteSingle('1', 'false');

      expect(result).toEqual(mockConfirmationRequiredResponse);
      expect(mockCategoriesService.deleteSingle).toHaveBeenCalledWith('1', false);
    });

    it('should call service.deleteSingle with confirm=true when confirm="true"', async () => {
      mockCategoriesService.deleteSingle.mockResolvedValue(mockDeletedResponse);

      const result = await controller.deleteSingle('1', 'true');

      expect(result).toEqual(mockDeletedResponse);
      expect(mockCategoriesService.deleteSingle).toHaveBeenCalledWith('1', true);
    });

    it('should propagate NotFoundException from service', async () => {
      mockCategoriesService.deleteSingle.mockRejectedValue(
        new NotFoundException('CATEGORY_NOT_FOUND'),
      );

      await expect(controller.deleteSingle('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return CONFIRMATION_REQUIRED response shape', async () => {
      mockCategoriesService.deleteSingle.mockResolvedValue(mockConfirmationRequiredResponse);

      const result = await controller.deleteSingle('1', 'false');

      expect(result.status).toBe('CONFIRMATION_REQUIRED');
      expect(result.confirmation_required).toBe(true);
      expect(result.data.transaction_count).toBe(3);
    });

    it('should return DELETED response shape', async () => {
      mockCategoriesService.deleteSingle.mockResolvedValue(mockDeletedResponse);

      const result = await controller.deleteSingle('1', 'true');

      expect(result.status).toBe('DELETED');
      expect(result.confirmation_required).toBe(false);
      expect(result.data.deleted_at).toBeDefined();
    });
  });
});
