import { IsEmail, IsEnum } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(OrgRole)
  role: OrgRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(OrgRole)
  role: OrgRole;
}
