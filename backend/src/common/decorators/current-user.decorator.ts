import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedPrincipal {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

/**
 * Pulls the authenticated principal (user id, active org id, role) off the
 * request. Populated by JwtStrategy.validate() after the access token is
 * verified — see auth/strategies/jwt.strategy.ts.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedPrincipal | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const principal: AuthenticatedPrincipal = request.user;
    return data ? principal?.[data] : principal;
  },
);
