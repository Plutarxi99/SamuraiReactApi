import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto.js';

function mapToUserResponseDto(
  user: User,
  currentUserId: number,
): UserResponseDto {
  return {
    id: user.id,
    full_name: user.full_name,
    place_birthday: user.place_birthday,
    status_text: user.status_text,
    followed: user.followers.some((f) => f.id === currentUserId),
    location: {
      city: user.location_city,
      country: user.location_country,
    },
    is_blocked: user.blockedByUsers.some((b) => b.id === currentUserId),
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(
    currentUserId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedUsersResponseDto> {
    // NOTE: getManyAndCount issues a single query with COUNT(*) OVER() — more
    // efficient than a separate count query or counting the in-memory array.
    const [users, totalCount] = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect(
        'u.followers',
        'follower',
        'follower.id = :currentUserId',
        { currentUserId },
      )
      .leftJoinAndSelect(
        'u.blockedByUsers',
        'blocker',
        'blocker.id = :currentUserId',
        { currentUserId },
      )
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = users.map((u) => mapToUserResponseDto(u, currentUserId));
    const totalPages = Math.ceil(totalCount / limit);

    return { items, totalCount, page, limit, totalPages };
  }

  findById(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOneBy({ username });
  }

  create(data: { username: string; passwordHash: string }): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async follow(targetId: number, followerId: number): Promise<void> {
    if (targetId === followerId)
      throw new BadRequestException('Cannot follow yourself');
    const [target, follower] = await Promise.all([
      this.userRepo.findOne({
        where: { id: targetId },
        relations: ['followers'],
      }),
      this.userRepo.findOneBy({ id: followerId }),
    ]);
    if (!target) throw new NotFoundException(`User ${targetId} not found`);
    if (!follower) throw new NotFoundException(`User ${followerId} not found`);
    const alreadyFollowing = target.followers.some((u) => u.id === followerId);
    if (!alreadyFollowing) {
      target.followers.push(follower);
      await this.userRepo.save(target);
    }
  }

  async unfollow(targetId: number, followerId: number): Promise<void> {
    const target = await this.userRepo.findOne({
      where: { id: targetId },
      relations: ['followers'],
    });
    if (!target) throw new NotFoundException(`User ${targetId} not found`);
    target.followers = target.followers.filter((u) => u.id !== followerId);
    await this.userRepo.save(target);
  }

  async block(targetId: number, blockerId: number): Promise<void> {
    if (targetId === blockerId)
      throw new BadRequestException('Cannot block yourself');
    const [blocker, target] = await Promise.all([
      this.userRepo.findOne({
        where: { id: blockerId },
        relations: ['blocking', 'followers'],
      }),
      this.userRepo.findOne({
        where: { id: targetId },
        relations: ['followers'],
      }),
    ]);
    if (!blocker) throw new NotFoundException(`User ${blockerId} not found`);
    if (!target) throw new NotFoundException(`User ${targetId} not found`);
    const alreadyBlocked = blocker.blocking.some((u) => u.id === targetId);
    if (!alreadyBlocked) blocker.blocking.push(target);
    // Side-effect: unfollow the blocked user
    target.followers = target.followers.filter((u) => u.id !== blockerId);
    await Promise.all([
      this.userRepo.save(blocker),
      this.userRepo.save(target),
    ]);
  }
}
