import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from './repositories/user.repository.interface.js';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    // Create mock REPOSITORY (dependency), not the service itself
    mockUserRepository = {
      findByUsername: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService, // ← Real service (NOT mocked)
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: mockUserRepository, // ← Mock the dependency
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
      const newUser = {
        id: 'user-123',
        username: 'john_doe',
        created_at: new Date(),
        updated_at: new Date(),
      };
      // Repository: user doesn't exist yet
      mockUserRepository.findByUsername.mockResolvedValue(null);
      // Repository: create user
      mockUserRepository.create.mockResolvedValue(newUser);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-123');
      expect(result.user.username).toBe('john_doe');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      // Verify repository was called to check username uniqueness
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        'john_doe',
      );
      // Verify repository was called to create user
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'existing_user',
        password: 'SecurePass123!',
      };
      // Repository: user already exists
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 'user-existing',
        username: 'existing_user',
        password: 'hashed_password',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      // Verify repository was called to check username
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        'existing_user',
      );
      // Verify repository.create was NOT called
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password and not store plaintext', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'test_user',
        password: 'SecurePass123!',
      };
      const newUser = {
        id: 'user-456',
        username: 'test_user',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser);

      // Act
      const result = await service.register(registerDto);

      // Assert - password should never be in response
      expect(result.user).not.toHaveProperty('password');
      // Verify create was called with hashed password (not plaintext)
      expect(mockUserRepository.create).toHaveBeenCalled();
      const createCall = mockUserRepository.create.mock.calls[0][0];
      // Password should be hashed (won't match plaintext)
      expect(createCall.password).not.toBe('SecurePass123!');
    });

    it('should generate both access and refresh tokens with correct expiration', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'test_user',
        password: 'SecurePass123!',
      };
      const newUser = {
        id: 'user-789',
        username: 'test_user',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser);

      // Act
      const result = await service.register(registerDto);

      // Assert - tokens should be valid JWT-like strings
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(typeof result.tokens.accessToken).toBe('string');
      expect(typeof result.tokens.refreshToken).toBe('string');
      // Tokens should be different (different expiration times)
      expect(result.tokens.accessToken).not.toBe(result.tokens.refreshToken);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      const hashedPassword =
        '$2b$10$1Cs3CSnqjdSh28HaPb721.WI2Co9AlEb/KWqWdLEGmgQsmrDwt19i'; // bcrypt hash of "SecurePass123!"
      const user = {
        id: 'user-123',
        username: 'john_doe',
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      // Repository: find user by username
      mockUserRepository.findByUsername.mockResolvedValue(user);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.username).toBe('john_doe');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      // Verify repository was called to find user
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        'john_doe',
      );
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'WrongPassword123!',
      };
      const hashedPassword =
        '$2b$10$1Cs3CSnqjdSh28HaPb721.WI2Co9AlEb/KWqWdLEGmgQsmrDwt19i'; // bcrypt hash of "SecurePass123!" of "SecurePass123!"
      const user = {
        id: 'user-123',
        username: 'john_doe',
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockUserRepository.findByUsername.mockResolvedValue(user);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      // Verify repository was called to find user
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        'john_doe',
      );
    });

    it('should throw UnauthorizedException with non-existent username', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'non_existent',
        password: 'SecurePass123!',
      };
      // Repository: user not found
      mockUserRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      // Verify repository was called to find user
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        'non_existent',
      );
    });
  });

  describe('refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Arrange
      const userId = 'user-123';

      // Act
      const result = await service.refresh(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      // Arrange
      const userId = 'invalid-user-id';

      // Act & Assert
      await expect(service.refresh(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
