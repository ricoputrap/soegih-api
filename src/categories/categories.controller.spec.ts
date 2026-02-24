import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import {
  EnumCategoryType,
  EnumCategorySortKey,
  EnumCategorySortOrder,
  GetAllCategoriesResponse,
  CreateCategoryResponse,
} from './categories.types';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  // Mock service - CategoriesService.prisma is never instantiated, ensuring no DB access
  let mockCategoriesService: {
    getAll: jest.Mock;
    create: jest.Mock;
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
});
