import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { PrismaCategoryRepository } from './repositories/prisma-category.repository.js';
import { CATEGORY_REPOSITORY_TOKEN } from './repositories/category.repository.interface.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORY_REPOSITORY_TOKEN,
      useClass: PrismaCategoryRepository,
    },
  ],
})
export class CategoriesModule {}
