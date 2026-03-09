import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dialog } from './dialog.entity.js';
import { User } from './user.entity.js';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Dialog, (dialog) => dialog.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dialogId' })
  dialog: Dialog;

  @Column()
  dialogId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: number;
}
