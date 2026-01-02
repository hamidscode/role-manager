import { IsString, IsArray, IsOptional, IsMongoId } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissions?: string[];
}
