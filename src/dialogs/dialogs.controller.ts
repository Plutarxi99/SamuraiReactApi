import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DialogsService } from './dialogs.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { Dialog } from '../database/entities/dialog.entity.js';
import { Message } from '../database/entities/message.entity.js';

@ApiTags('dialogs')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('dialogs')
export class DialogsController {
  constructor(private readonly dialogsService: DialogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dialogs for the current user' })
  @ApiResponse({ status: 200, description: 'List of dialogs the current user participates in', type: [Dialog] })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  async findAll(
    @CurrentUser() user: { id: number; username: string },
  ): Promise<Dialog[]> {
    return this.dialogsService.findAll(user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages in a dialog' })
  @ApiParam({ name: 'id', type: Number, description: 'Dialog ID' })
  @ApiResponse({ status: 200, description: 'List of messages in the dialog', type: [Message] })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Current user is not a participant of this dialog' })
  @ApiResponse({ status: 404, description: 'Dialog not found' })
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<Message[]> {
    return this.dialogsService.getMessages(id, user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to a dialog' })
  @ApiParam({ name: 'id', type: Number, description: 'Dialog ID' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent', type: Message })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Missing or invalid JWT token' })
  @ApiResponse({ status: 403, description: 'Current user is not a participant of this dialog' })
  @ApiResponse({ status: 404, description: 'Dialog not found' })
  async sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: number; username: string },
  ): Promise<Message> {
    return this.dialogsService.sendMessage(id, user.id, dto.content);
  }
}
