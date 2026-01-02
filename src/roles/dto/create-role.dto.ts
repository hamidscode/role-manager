import { IsString, IsNotEmpty, IsArray, IsOptional, IsMongoId } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  permissions?: string[];
}
