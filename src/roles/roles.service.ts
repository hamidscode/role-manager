import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RedisService } from '../common/redis/redis.service';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private redisService: RedisService,
    private permissionsService: PermissionsService,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    try {
      // Validate that all permission IDs exist
      if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
        await this.validatePermissions(createRoleDto.permissions);
      }

      const role = new this.roleModel({
        ...createRoleDto,
        permissions: createRoleDto.permissions?.map(id => new Types.ObjectId(id)) || [],
      });
      
      const saved = await role.save();
      
      // Invalidate cache for this role
      await this.redisService.del(`role:permissions:${saved.name}`);
      
      return saved;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().populate('permissions').exec();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel.findById(id).populate('permissions').exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleModel.findOne({ name }).populate('permissions').exec();
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    try {
      // Validate that all permission IDs exist
      if (updateRoleDto.permissions && updateRoleDto.permissions.length > 0) {
        await this.validatePermissions(updateRoleDto.permissions);
      }

      const updateData: any = { ...updateRoleDto };
      if (updateRoleDto.permissions) {
        updateData.permissions = updateRoleDto.permissions.map(id => new Types.ObjectId(id));
      }

      const role = await this.roleModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('permissions')
        .exec();
      
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Invalidate cache for this role
      await this.redisService.del(`role:permissions:${role.name}`);
      
      return role;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Role with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const role = await this.roleModel.findByIdAndDelete(id).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    // Invalidate cache for this role
    await this.redisService.del(`role:permissions:${role.name}`);
  }

  async resolvePermissions(roleNames: string[]): Promise<{ permissions: string[] }> {
    if (!roleNames || roleNames.length === 0) {
      return { permissions: [] };
    }

    // Create a cache key for this combination of roles
    const cacheKey = `role:permissions:${roleNames.sort().join(',')}`;
    
    // Try to get from cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return { permissions: JSON.parse(cached) };
    }

    // Fetch roles from database
    const roles = await this.roleModel
      .find({ name: { $in: roleNames } })
      .populate('permissions')
      .exec();

    if (roles.length === 0) {
      throw new NotFoundException('No roles found with the provided names');
    }

    // Collect all unique permission slugs
    const permissionSlugs = new Set<string>();
    
    for (const role of roles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const permission of role.permissions) {
          if (permission && typeof permission === 'object' && 'slug' in permission) {
            permissionSlugs.add((permission as any).slug);
          }
        }
      }
    }

    const result = Array.from(permissionSlugs);
    
    // Cache the result for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    
    return { permissions: result };
  }

  private async validatePermissions(permissionIds: string[]): Promise<void> {
    for (const id of permissionIds) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid permission ID: ${id}`);
      }
      try {
        await this.permissionsService.findOne(id);
      } catch (error) {
        throw new BadRequestException(`Permission with ID ${id} does not exist`);
      }
    }
  }
}
