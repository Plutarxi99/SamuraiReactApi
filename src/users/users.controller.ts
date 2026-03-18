import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/user-response.dto.js';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto.js';
import { PaginateUsersQueryDto } from './dto/paginate-users-query.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

// NOTE: ALLOWED_MIME_TYPES restricts uploads to common raster image formats.
// SVG is intentionally excluded — it can carry embedded scripts (XSS vector).
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const avatarStorage = diskStorage({
  destination: './uploads/avatars',
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

@ApiTags('users')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get a paginated list of all users (excluding self)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated user list',
    type: PaginatedUsersResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async findAll(
    @Query() query: PaginateUsersQueryDto,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(user.id, query.page, query.limit);
  }

  // NOTE: This route must be declared before GET :id so that the literal
  // segment "me" is matched here and not coerced by ParseIntPipe downstream.
  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: avatarStorage,
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          // Passing an error to cb rejects the upload and triggers a NestJS
          // exception handler — the error surfaces as a 400 BadRequestException
          // thanks to the global exception filter.
          cb(
            new BadRequestException(`Unsupported file type: ${file.mimetype}`),
            false,
          );
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiOperation({
    summary:
      'Upload or replace the current user avatar (max 5 MB, JPEG/PNG/GIF/WEBP)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, or WEBP — max 5 MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avatar updated — returns updated user profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No file uploaded or unsupported file type',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<UserResponseDto> {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded — include a "photo" field',
      );
    }
    // NOTE: Global prefix is /api, so the public URL must include it.
    const photoUrl = `http://localhost:3000/api/uploads/avatars/${file.filename}`;
    return await this.usersService.updatePhoto(user.id, photoUrl);
  }

  // NOTE: This literal route segment must sit above GET :id so that NestJS
  // matches "profile" here before ParseIntPipe tries to coerce it as a number.
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Updated user profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — invalid field value',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT token',
  })
  @ApiResponse({
    status: 409,
    description: 'Username is already taken by another user',
  })
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user profile by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Target user ID' })
  @ApiResponse({ status: 200, description: 'User profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<UserResponseDto> {
    const t0 = Date.now();
    const result = await this.usersService.findOne(id, user.id);
    console.log(`[Controller] GET /users/${id} total: ${Date.now() - t0}ms`);
    return result;
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the user to follow' })
  @ApiResponse({ status: 201, description: 'Now following the user' })
  @ApiResponse({ status: 400, description: 'Cannot follow yourself or already following' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async follow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ message: string }> {
    await this.usersService.follow(id, user.id);
    return { message: `Followed user ${id}` };
  }

  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the user to unfollow',
  })
  @ApiResponse({ status: 200, description: 'Unfollowed the user' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unfollow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ message: string }> {
    await this.usersService.unfollow(id, user.id);
    return { message: `Unfollowed user ${id}` };
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the user to block',
  })
  @ApiResponse({ status: 201, description: 'User blocked' })
  @ApiResponse({
    status: 400,
    description: 'Cannot block yourself or already blocked',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async block(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ message: string }> {
    await this.usersService.block(id, user.id);
    return { message: `Blocked user ${id}` };
  }
}
