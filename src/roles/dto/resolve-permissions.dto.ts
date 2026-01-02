import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class ResolvePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  roleNames: string[];
}
