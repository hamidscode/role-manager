import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
    private redisService: RedisService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    try {
      const permission = new this.permissionModel(createPermissionDto);
      const saved = await permission.save();
      
      // Invalidate all role permission caches since new permission is added
      await this.redisService.delPattern('role:permissions:*');
      
      return saved;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Permission with this slug already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async findBySlug(slug: string): Promise<Permission> {
    const permission = await this.permissionModel.findOne({ slug }).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with slug ${slug} not found`);
    }
    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    try {
      const permission = await this.permissionModel
        .findByIdAndUpdate(id, updatePermissionDto, { new: true })
        .exec();
      
      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // Invalidate all role permission caches
      await this.redisService.delPattern('role:permissions:*');
      
      return permission;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Permission with this slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    
    // Invalidate all role permission caches
    await this.redisService.delPattern('role:permissions:*');
  }
}
