import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrismaCategoriesRepository } from './repositories/prisma-categories.repository.js';
import { CATEGORIES_REPOSITORY_TOKEN } from './repositories/categories.repository.interface.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORIES_REPOSITORY_TOKEN,
      useClass: PrismaCategoriesRepository,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
