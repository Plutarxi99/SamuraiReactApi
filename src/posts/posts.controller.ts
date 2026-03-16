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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PostsService } from './posts.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { Post as PostEntity } from '../database/entities/post.entity.js';

@ApiTags('posts')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get posts for a user',
    description: 'Returns posts for the given `userId`. Defaults to the currently authenticated user when `userId` is omitted.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Target user ID — omit to fetch your own posts',
  })
  @ApiResponse({ status: 200, description: 'Array of posts', type: [PostEntity] })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async findAll(
    @Query('userId') userId: string | undefined,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity[]> {
    const id = userId ? parseInt(userId, 10) : user.id;
    return this.postsService.findByUser(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post created', type: PostEntity })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity> {
    return this.postsService.create(user.id, dto.content);
  }
}
