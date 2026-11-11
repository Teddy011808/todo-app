import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// What JwtStrategy.validate() puts on req.user
export type AuthUser = { id: number };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
