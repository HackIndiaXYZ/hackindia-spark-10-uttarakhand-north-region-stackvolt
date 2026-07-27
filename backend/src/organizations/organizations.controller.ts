import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';
import { OrganizationsService } from './organizations.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/organizations.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations/current')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get()
  getProfile(@CurrentUser('organizationId') organizationId: string) {
    return this.orgService.getProfile(organizationId);
  }

  @Get('members')
  listMembers(@CurrentUser('organizationId') organizationId: string) {
    return this.orgService.listMembers(organizationId);
  }

  @Post('invitations')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN)
  inviteMember(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.orgService.inviteMember(organizationId, userId, dto);
  }

  @Get('invitations')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN)
  listInvitations(@CurrentUser('organizationId') organizationId: string) {
    return this.orgService.listInvitations(organizationId);
  }

  @Delete('invitations/:id')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN)
  revokeInvitation(@CurrentUser('organizationId') organizationId: string, @Param('id') id: string) {
    return this.orgService.revokeInvitation(organizationId, id);
  }

  @Patch('members/:membershipId/role')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN)
  updateRole(
    @CurrentUser('organizationId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.orgService.updateMemberRole(organizationId, membershipId, dto);
  }

  @Delete('members/:membershipId')
  @Roles(OrgRole.OWNER, OrgRole.ADMIN)
  removeMember(@CurrentUser('organizationId') organizationId: string, @Param('membershipId') membershipId: string) {
    return this.orgService.removeMember(organizationId, membershipId);
  }
}
