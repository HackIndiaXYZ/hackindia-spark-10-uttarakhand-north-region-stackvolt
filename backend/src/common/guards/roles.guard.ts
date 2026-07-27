import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedPrincipal } from '../decorators/current-user.decorator';

/**
 * Reads the roles allowed for a route (set via @Roles(...)) and checks them
 * against the caller's role within the organization resolved by JwtStrategy.
 * If no @Roles() decorator is present, the route is allowed for any
 * authenticated member of the org.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const principal: AuthenticatedPrincipal = request.user;

    if (!principal || !requiredRoles.includes(principal.role as OrgRole)) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
}
