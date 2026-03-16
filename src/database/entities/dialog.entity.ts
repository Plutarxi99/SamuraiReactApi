import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity.js';
import { Message } from './message.entity.js';

@Entity('dialogs')
export class Dialog {
  @ApiProperty({ example: 1, description: 'Dialog ID' })
  @PrimaryGeneratedColumn()
  id: number;

  // NOTE: participants is a ManyToMany relation that is always loaded via leftJoinAndSelect.
  // We describe it as an array of objects with minimal fields to avoid circular $ref chains.
  @ApiProperty({
    description: 'Users participating in this dialog',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 3 },
        username: { type: 'string', example: 'jane_doe' },
      },
    },
  })
  @ManyToMany(() => User)
  @JoinTable({
    name: 'dialog_participants',
    joinColumn: { name: 'dialogId' },
    inverseJoinColumn: { name: 'userId' },
  })
  participants: User[];

  @ApiProperty({
    description: 'Messages in this dialog',
    type: 'array',
    items: { $ref: '#/components/schemas/Message' },
  })
  @OneToMany(() => Message, (message) => message.dialog)
  messages: Message[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
