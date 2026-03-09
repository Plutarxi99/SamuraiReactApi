import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { Post as PostEntity } from '../database/entities/post.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll(
    @Query('userId') userId: string | undefined,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity[]> {
    const id = userId ? parseInt(userId, 10) : user.id;
    return this.postsService.findByUser(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity> {
    return this.postsService.create(user.id, dto.content);
  }
}
