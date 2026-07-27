import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { EmailService } from '../auth/email.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, EmailService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
