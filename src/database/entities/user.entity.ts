import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  // NOTE: @Exclude() prevents passwordHash from appearing in serialized API responses
  // Requires ClassSerializerInterceptor to be enabled globally in main.ts
  @Exclude()
  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  // NOTE: explicit type: 'text' is required for all string | null columns — TypeScript union
  // types compile to Object at runtime, which confuses TypeORM's reflection-based type inference.
  @Column({ type: 'text', nullable: true, default: null })
  full_name: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  place_birthday: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  status_text: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  location_city: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  location_country: string | null;

  // NOTE: explicit type: 'text' required — TypeScript union with null compiles to
  // Object at runtime, which breaks TypeORM's reflection-based column type inference.
  @Column({ type: 'text', nullable: true, default: null })
  photo: string | null;

  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'follows',
    joinColumn: { name: 'followerId' },
    inverseJoinColumn: { name: 'followingId' },
  })
  following: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  @ManyToMany(() => User, (user) => user.blockedByUsers)
  @JoinTable({
    name: 'blocks',
    joinColumn: { name: 'blockerId' },
    inverseJoinColumn: { name: 'blockedId' },
  })
  blocking: User[];

  @ManyToMany(() => User, (user) => user.blocking)
  blockedByUsers: User[];
}
