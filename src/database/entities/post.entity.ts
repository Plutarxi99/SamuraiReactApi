import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity.js';

@Entity('posts')
export class Post {
  @ApiProperty({ example: 1, description: 'Post ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Hello world!', description: 'Post body text' })
  @Column('text')
  content: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  // NOTE: user relation is not always loaded — omit from Swagger to avoid circular schema issues
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 7, description: 'ID of the post author' })
  @Column()
  userId: number;
}
