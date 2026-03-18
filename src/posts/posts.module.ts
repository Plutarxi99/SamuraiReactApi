import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';

@Module({
  // NOTE: User is registered here so TypeORM can resolve the likedBy ManyToMany relation
  // when PostsService loads Post entities with relations: ['likedBy'].
  imports: [TypeOrmModule.forFeature([Post, User])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}