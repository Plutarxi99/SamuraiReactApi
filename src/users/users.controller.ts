import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PaginateUsersQueryDto } from './dto/paginate-users-query.dto.js';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto.js';

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

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
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

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id, user.id);
  }

  @Post(':id/follow')
  async follow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ message: string }> {
    await this.usersService.follow(id, user.id);
    return { message: `Followed user ${id}` };
  }

  @Delete(':id/follow')
  async unfollow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ message: string }> {
    await this.usersService.unfollow(id, user.id);
    return { message: `Unfollowed user ${id}` };
  }

  @Post(':id/block')
  async block(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ message: string }> {
    await this.usersService.block(id, user.id);
    return { message: `Blocked user ${id}` };
  }
}
