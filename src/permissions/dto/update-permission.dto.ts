import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
