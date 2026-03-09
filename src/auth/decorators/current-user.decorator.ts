import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { id: number; username: string } => {
    const request = ctx.switchToHttp().getRequest();
    // req.user is populated by JwtStrategy.validate() after a successful JWT validation
    return request.user;
  },
);
