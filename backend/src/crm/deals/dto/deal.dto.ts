import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DealStage } from '@prisma/client';

export class CreateDealDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  pipelineId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  valueCents?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseAt?: string;
}

export class UpdateDealDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsInt() @Min(0) valueCents?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsEnum(DealStage) stage?: DealStage;
  @IsOptional() @IsInt() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsDateString() expectedCloseAt?: string;
}
