import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { DialogsModule } from './dialogs/dialogs.module.js';
import { AuthModule } from './auth/auth.module.js';
import { User } from './database/entities/user.entity.js';
import { Post } from './database/entities/post.entity.js';
import { Dialog } from './database/entities/dialog.entity.js';
import { Message } from './database/entities/message.entity.js';

@Module({
  imports: [
    // NOTE: Explicit entity array is required — nodenext module resolution breaks glob patterns
    // NOTE: synchronize:true is acceptable for development only; disable and use migrations in production
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      entities: [User, Post, Dialog, Message],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    UsersModule,
    PostsModule,
    DialogsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
