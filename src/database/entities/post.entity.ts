import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
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

  // NOTE: JoinTable owner is on Post so the join table name and columns are controlled here.
  // likedBy is not loaded by default — always specify relations: ['likedBy'] when needed.
  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_likes',
    joinColumn: { name: 'postId' },
    inverseJoinColumn: { name: 'userId' },
  })
  likedBy: User[];

  // NOTE: virtual getter — derived from likedBy array when the relation is loaded.
  // Returns 0 if the relation was not eagerly loaded (undefined guard).
  @ApiProperty({ example: 5, description: 'Total number of likes on this post' })
  get likesCount(): number {
    return this.likedBy?.length ?? 0;
  }

  // NOTE: transient property — not stored in DB, not a getter.
  // Set by the service after loading the likedBy relation so it reflects the requesting user.
  @ApiProperty({ example: false, description: 'Whether the current user has liked this post' })
  isLiked: boolean = false;
}