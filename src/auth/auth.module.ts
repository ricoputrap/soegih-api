import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaUserRepository } from './repositories/prisma-user.repository.js';
import { USER_REPOSITORY_TOKEN } from './repositories/user.repository.interface.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
