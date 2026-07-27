import { IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  dealId?: string;
}
