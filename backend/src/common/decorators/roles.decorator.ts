import { SetMetadata } from '@nestjs/common';
import { OrgRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts an endpoint to the given organization roles.
 * Usage: @Roles(OrgRole.OWNER, OrgRole.ADMIN)
 */
export const Roles = (...roles: OrgRole[]) => SetMetadata(ROLES_KEY, roles);
