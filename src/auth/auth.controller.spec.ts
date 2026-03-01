import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-123',
    username: 'john_doe',
    created_at: 1709299445,
  };

  const mockTokens = {
    accessToken: 'access-token-jwt',
    refreshToken: 'refresh-token-jwt',
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    mockService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    // Reset res mock between tests
    jest.clearAllMocks();
    mockRes.cookie.mockReset();
    mockRes.clearCookie.mockReset();
    mockRes.send.mockReset();
    mockRes.status.mockReturnThis();
  });

  describe('POST /auth/register', () => {
    it('should register user, set cookies, and return user data', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      mockService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      // Act
      const result = await controller.register(registerDto, mockRes as any);

      // Assert
      expect(mockService.register).toHaveBeenCalledWith(registerDto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        mockTokens.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockTokens.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toBeDefined();
      expect(result.data.id).toBe('user-123');
      expect(result.data.username).toBe('john_doe');
      expect(result.data).not.toHaveProperty('password');
    });

    it('should propagate ConflictException when username is taken', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        username: 'existing_user',
        password: 'SecurePass123!',
      };
      mockService.register.mockRejectedValue(
        new ConflictException('Username already registered'),
      );

      // Act & Assert
      await expect(
        controller.register(registerDto, mockRes as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user, set cookies, and return user data', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'SecurePass123!',
      };
      mockService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      // Act
      const result = await controller.login(loginDto, mockRes as any);

      // Assert
      expect(mockService.login).toHaveBeenCalledWith(loginDto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        mockTokens.accessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockTokens.refreshToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toBeDefined();
      expect(result.data.username).toBe('john_doe');
    });

    it('should propagate UnauthorizedException with invalid credentials', async () => {
      // Arrange
      const loginDto: LoginDto = {
        username: 'john_doe',
        password: 'WrongPassword!',
      };
      mockService.login.mockRejectedValue(
        new UnauthorizedException('Invalid username or password'),
      );

      // Act & Assert
      await expect(controller.login(loginDto, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookies and return 204', async () => {
      // Act
      await controller.logout(mockRes as any);

      // Assert
      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token cookie and return user data', async () => {
      // Arrange
      const userId = 'user-123';
      const newAccessToken = 'new-access-token-jwt';
      mockService.refresh.mockResolvedValue({ accessToken: newAccessToken });

      // Act
      const result = await controller.refresh(userId, mockRes as any);

      // Assert
      expect(mockService.refresh).toHaveBeenCalledWith(userId);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        newAccessToken,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toBeDefined();
    });

    it('should propagate UnauthorizedException with invalid/expired token', async () => {
      // Arrange
      const userId = 'invalid-user-id';
      mockService.refresh.mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token'),
      );

      // Act & Assert
      await expect(controller.refresh(userId, mockRes as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
