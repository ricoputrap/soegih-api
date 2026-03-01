import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IUserRepository } from './user.repository.interface.js';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<{
    id: string;
    username: string;
    password: string;
    created_at: Date;
    updated_at: Date;
  } | null> {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: { username: string; password: string }): Promise<{
    id: string;
    username: string;
    created_at: Date;
    updated_at: Date;
  }> {
    try {
      const user = await this.prisma.user.create({
        data: {
          username: data.username,
          password: data.password,
        },
        select: {
          id: true,
          username: true,
          created_at: true,
          updated_at: true,
        },
      });
      return user;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username already registered');
      }
      throw error;
    }
  }
}
