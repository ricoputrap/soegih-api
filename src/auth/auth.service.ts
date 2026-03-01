import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { IUserRepository, USER_REPOSITORY_TOKEN } from './repositories/user.repository.interface.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Register a new user with username and password
   *
   * TODO:
   * 1. Validate username is unique (check repository)
   * 2. Hash password with bcrypt (10 salt rounds)
   * 3. Create user in database via repository
   * 4. Generate access_token (1h expiration) and refresh_token (7d)
   * 5. Return user data and tokens
   *
   * Errors:
   * - Throw ConflictException (409) if username already exists
   * - Throw BadRequestException (400) if validation fails
   */
  async register(registerDto: RegisterDto): Promise<{
    user: { id: string; username: string; created_at: number };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Login user with username and password
   *
   * TODO:
   * 1. Find user by username via repository
   * 2. Compare provided password with hashed password
   * 3. Generate access_token (1h) and refresh_token (7d)
   * 4. Return user data and tokens
   *
   * Errors:
   * - Throw UnauthorizedException (401) if credentials invalid
   */
  async login(loginDto: LoginDto): Promise<{
    user: { id: string; username: string; created_at: number };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Refresh access token using refresh token
   *
   * TODO:
   * 1. Validate refresh token (decode JWT)
   * 2. Generate new access_token (1h)
   * 3. Return new token
   *
   * Errors:
   * - Throw UnauthorizedException (401) if token invalid or expired
   */
  async refresh(userId: string): Promise<{ accessToken: string }> {
    // TODO: Implement
    throw new Error('Not implemented');
  }
}
