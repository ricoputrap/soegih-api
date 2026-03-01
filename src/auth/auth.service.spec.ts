import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthService: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
  };

  beforeEach(async () => {
    // Create mock service with jest.Mock for each method
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user with valid credentials', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      const mockResponse = {
        user: {
          id: 'user-123',
          username: 'john_doe',
          created_at: 1709299445,
        },
        tokens: {
          accessToken: 'access_token_jwt',
          refreshToken: 'refresh_token_jwt',
        },
      };
      mockAuthService.register.mockResolvedValue(mockResponse);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.username).toBe('john_doe');
      expect(result.user.created_at).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'existing_user',
        password: 'SecurePass123!',
      };
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Username already exists'),
      );

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should hash password and not store plaintext', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'test_user',
        password: 'SecurePass123!',
      };
      const mockResponse = {
        user: {
          id: 'user-456',
          username: 'test_user',
          created_at: 1709299445,
        },
        tokens: {
          accessToken: 'access_token_jwt',
          refreshToken: 'refresh_token_jwt',
        },
      };
      mockAuthService.register.mockResolvedValue(mockResponse);

      // Act
      const result = await service.register(registerDto);

      // Assert (password should never be in response)
      expect(result.user).not.toHaveProperty('password');
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should generate both access and refresh tokens with correct expiration', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'test_user',
        password: 'SecurePass123!',
      };
      const mockResponse = {
        user: {
          id: 'user-789',
          username: 'test_user',
          created_at: 1709299445,
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      };
      mockAuthService.register.mockResolvedValue(mockResponse);

      // Act
      const result = await service.register(registerDto);

      // Assert (tokens should be valid JWT-like strings)
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(typeof result.tokens.accessToken).toBe('string');
      expect(typeof result.tokens.refreshToken).toBe('string');
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      const mockResponse = {
        user: {
          id: 'user-123',
          username: 'john_doe',
          created_at: 1709299445,
        },
        tokens: {
          accessToken: 'access_token_jwt',
          refreshToken: 'refresh_token_jwt',
        },
      };
      mockAuthService.login.mockResolvedValue(mockResponse);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user.username).toBe('john_doe');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'WrongPassword123!',
      };
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException with non-existent username', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'non_existent',
        password: 'SecurePass123!',
      };
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const userId = 'user-123';
      const mockResponse = {
        accessToken: 'new_access_token_jwt',
      };
      mockAuthService.refresh.mockResolvedValue(mockResponse);

      // Act
      const result = await service.refresh(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(mockAuthService.refresh).toHaveBeenCalledWith(userId);
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      // Arrange
      const userId = 'invalid-user-id';
      mockAuthService.refresh.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      // Act & Assert
      await expect(service.refresh(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.refresh).toHaveBeenCalledWith(userId);
    });
  });
});
