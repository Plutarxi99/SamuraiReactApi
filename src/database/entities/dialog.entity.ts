import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity.js';
import { Message } from './message.entity.js';

@Entity('dialogs')
export class Dialog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'dialog_participants',
    joinColumn: { name: 'dialogId' },
    inverseJoinColumn: { name: 'userId' },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.dialog)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;
}
