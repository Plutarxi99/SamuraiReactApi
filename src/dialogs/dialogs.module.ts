import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DialogsController } from './dialogs.controller.js';
import { DialogsService } from './dialogs.service.js';
import { Dialog } from '../database/entities/dialog.entity.js';
import { Message } from '../database/entities/message.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Dialog, Message])],
  controllers: [DialogsController],
  providers: [DialogsService],
})
export class DialogsModule {}
