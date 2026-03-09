import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { id: number; username: string },
  ): Promise<{ items: UserResponseDto[]; totalCount: number }> {
    return this.usersService.findAll(user.id);
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
