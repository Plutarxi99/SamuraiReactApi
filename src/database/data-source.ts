import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Post } from './entities/post.entity.js';
import { Dialog } from './entities/dialog.entity.js';
import { Message } from './entities/message.entity.js';

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: 'db.sqlite',
  entities: [User, Post, Dialog, Message],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});
