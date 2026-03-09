import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../database/entities/post.entity.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  findByUser(userId: number): Promise<Post[]> {
    return this.postRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  create(userId: number, content: string): Promise<Post> {
    const post = this.postRepo.create({ userId, content });
    return this.postRepo.save(post);
  }
}
