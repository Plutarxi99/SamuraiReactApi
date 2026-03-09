import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // NOTE: Use a real secret from environment in production; never commit secrets
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-in-prod',
    });
  }

  validate(payload: { sub: number; username: string }): {
    id: number;
    username: string;
  } {
    // The returned object is attached to req.user and available via @CurrentUser()
    return { id: payload.sub, username: payload.username };
  }
}
