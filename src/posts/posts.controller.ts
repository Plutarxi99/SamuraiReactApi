import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
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
  ApiParam,
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
    description:
      'Returns posts for the given `userId`. Defaults to the currently authenticated user when `userId` is omitted. Each post includes `likesCount` and `isLiked` relative to the current user.',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Target user ID — omit to fetch your own posts',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of posts',
    type: [PostEntity],
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async findAll(
    @Query('userId') userId: string | undefined,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity[]> {
    const id = userId ? parseInt(userId, 10) : user.id;
    return this.postsService.findByUser(id, user.id);
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

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID to like' })
  @ApiResponse({
    status: 200,
    description:
      'Post liked — returns updated post with likesCount and isLiked',
    type: PostEntity,
  })
  @ApiResponse({ status: 400, description: 'Post already liked' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async like(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity> {
    return this.postsService.like(parseInt(id, 10), user.id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', type: Number, description: 'Post ID to unlike' })
  @ApiResponse({
    status: 200,
    description:
      'Post unliked — returns updated post with likesCount and isLiked',
    type: PostEntity,
  })
  @ApiResponse({ status: 400, description: 'Post was not liked' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async unlike(
    @Param('id') id: string,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PostEntity> {
    return this.postsService.unlike(parseInt(id, 10), user.id);
  }
}