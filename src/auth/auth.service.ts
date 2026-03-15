import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) throw new ConflictException('Username already taken');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      passwordHash,
    });
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
    return { accessToken: token };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
    });
    return { accessToken: token };
  }

  // NOTE: findOne(id, id) is intentional — currentUserId === id means the user
  // is viewing their own profile, so `followed` and `is_blocked` will correctly
  // be false (you can't follow or block yourself).
  async getMe(userId: number): Promise<UserResponseDto> {
    return this.usersService.findOne(userId, userId);
  }
}
