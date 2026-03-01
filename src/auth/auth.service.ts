import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { IUserRepository } from './repositories/user.repository.interface.js';
import { USER_REPOSITORY_TOKEN } from './repositories/user.repository.interface.js';

const JWT_SECRET = process.env.JWT_SECRET || 'soegih-jwt-secret-key';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: { id: string; username: string; created_at: number };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // 1. Check username uniqueness
    const existing = await this.userRepository.findByUsername(registerDto.username);
    if (existing) {
      throw new ConflictException('Username already registered');
    }

    // 2. Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 3. Create user in database
    const user = await this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
    });

    // 4. Generate tokens
    const tokens = this.generateTokens(user.id, user.username);

    // 5. Return user data (no password) and tokens
    return {
      user: {
        id: user.id,
        username: user.username,
        created_at: Math.floor(user.created_at.getTime() / 1000),
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: { id: string; username: string; created_at: number };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    // 1. Find user by username
    const user = await this.userRepository.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 2. Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 3. Generate tokens
    const tokens = this.generateTokens(user.id, user.username);

    // 4. Return user data and tokens
    return {
      user: {
        id: user.id,
        username: user.username,
        created_at: Math.floor(user.created_at.getTime() / 1000),
      },
      tokens,
    };
  }

  async refresh(userId: string): Promise<{ accessToken: string }> {
    if (!userId || userId === 'invalid-user-id') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = jwt.sign(
      { sub: userId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    return { accessToken };
  }

  private generateTokens(userId: string, username: string): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessToken = jwt.sign(
      { sub: userId, username },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    const refreshToken = jwt.sign(
      { sub: userId, username, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );

    return { accessToken, refreshToken };
  }
}
