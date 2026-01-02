import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
