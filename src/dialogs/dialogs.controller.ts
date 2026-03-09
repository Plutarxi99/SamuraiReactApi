import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DialogsService } from './dialogs.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { Dialog } from '../database/entities/dialog.entity.js';
import { Message } from '../database/entities/message.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('dialogs')
export class DialogsController {
  constructor(private readonly dialogsService: DialogsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { id: number; username: string },
  ): Promise<Dialog[]> {
    return this.dialogsService.findAll(user.id);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<Message[]> {
    return this.dialogsService.getMessages(id, user.id);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<Message> {
    return this.dialogsService.sendMessage(id, user.id, dto.content);
  }
}
