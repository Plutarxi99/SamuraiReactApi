import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../database/entities/post.entity.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async findByUser(userId: number, currentUserId: number): Promise<Post[]> {
    const posts = await this.postRepo.find({
      where: { userId },
      relations: ['likedBy'],
      order: { createdAt: 'DESC' },
    });

    for (const post of posts) {
      post.isLiked = post.likedBy.some((u) => u.id === currentUserId);
    }

    return posts;
  }

  async create(userId: number, content: string): Promise<Post> {
    const post = this.postRepo.create({ userId, content });
    const saved = await this.postRepo.save(post);
    // NOTE: reload with likedBy so the response shape is consistent with findByUser
    return this.loadWithLikes(saved.id, userId);
  }

  async like(postId: number, userId: number): Promise<Post> {
    const post = await this.loadPostOrFail(postId);

    const alreadyLiked = post.likedBy.some((u) => u.id === userId);
    if (alreadyLiked) {
      throw new BadRequestException('You have already liked this post');
    }

    // NOTE: ManyToMany relation mutation requires save() with the full entity —
    // update()/insert() cannot manage join table rows.
    post.likedBy.push({ id: userId } as any);
    await this.postRepo.save(post);

    return this.loadWithLikes(postId, userId);
  }

  async unlike(postId: number, userId: number): Promise<Post> {
    const post = await this.loadPostOrFail(postId);

    const likedIndex = post.likedBy.findIndex((u) => u.id === userId);
    if (likedIndex === -1) {
      throw new BadRequestException('You have not liked this post');
    }

    post.likedBy.splice(likedIndex, 1);
    await this.postRepo.save(post);

    return this.loadWithLikes(postId, userId);
  }

  // --- private helpers ---

  private async loadPostOrFail(postId: number): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['likedBy'],
    });
    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }
    return post;
  }

  private async loadWithLikes(postId: number, currentUserId: number): Promise<Post> {
    const post = await this.loadPostOrFail(postId);
    post.isLiked = post.likedBy.some((u) => u.id === currentUserId);
    return post;
  }
}