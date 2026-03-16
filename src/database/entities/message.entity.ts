import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Dialog } from './dialog.entity.js';
import { User } from './user.entity.js';

@Entity('messages')
export class Message {
  @ApiProperty({ example: 1, description: 'Message ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Hey, how are you?', description: 'Message text' })
  @Column('text')
  content: string;

  @ApiProperty({ example: '2024-01-15T10:35:00.000Z', description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  // NOTE: dialog relation omitted from Swagger to break the circular Dialog<->Message $ref loop.
  @ManyToOne(() => Dialog, (dialog) => dialog.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dialogId' })
  dialog: Dialog;

  @ApiProperty({ example: 1, description: 'ID of the dialog this message belongs to' })
  @Column()
  dialogId: number;

  // NOTE: sender relation is not always loaded — described inline to avoid deep circular refs.
  @ApiProperty({
    description: 'Message sender (partial)',
    type: 'object',
    properties: {
      id: { type: 'number', example: 3 },
      username: { type: 'string', example: 'jane_doe' },
    },
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ApiProperty({ example: 3, description: 'ID of the sender' })
  @Column()
  senderId: number;
}
