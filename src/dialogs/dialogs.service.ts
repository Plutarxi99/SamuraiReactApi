import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dialog } from '../database/entities/dialog.entity.js';
import { Message } from '../database/entities/message.entity.js';

@Injectable()
export class DialogsService {
  constructor(
    @InjectRepository(Dialog)
    private readonly dialogRepo: Repository<Dialog>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  findAll(userId: number): Promise<Dialog[]> {
    // NOTE: Uses two distinct aliases — 'participant' for filtering, 'allParticipants' for selecting.
    // If both joins used the same alias, TypeORM would produce an ambiguous column error.
    return this.dialogRepo
      .createQueryBuilder('dialog')
      .innerJoin('dialog.participants', 'participant', 'participant.id = :userId', { userId })
      .leftJoinAndSelect('dialog.participants', 'allParticipants')
      .getMany();
  }

  async getMessages(dialogId: number, userId: number): Promise<Message[]> {
    const dialog = await this.dialogRepo.findOne({
      where: { id: dialogId },
      relations: ['participants'],
    });
    if (!dialog) throw new NotFoundException(`Dialog ${dialogId} not found`);
    const isMember = dialog.participants.some((p) => p.id === userId);
    // NOTE: Intentionally returns NotFoundException (not ForbiddenException) — security through
    // obscurity so non-members cannot confirm whether a dialog exists.
    if (!isMember) throw new NotFoundException(`Dialog ${dialogId} not found`);
    return this.messageRepo.find({
      where: { dialogId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(dialogId: number, senderId: number, content: string): Promise<Message> {
    const dialog = await this.dialogRepo.findOne({
      where: { id: dialogId },
      relations: ['participants'],
    });
    if (!dialog) throw new NotFoundException(`Dialog ${dialogId} not found`);
    const isMember = dialog.participants.some((p) => p.id === senderId);
    if (!isMember) throw new NotFoundException(`Dialog ${dialogId} not found`);
    const message = this.messageRepo.create({ dialogId, senderId, content });
    return this.messageRepo.save(message);
  }
}
